---
title: MySQL_页分裂
date: 2020-02-28 14:49:54
toc: true
tags: 
- MySQL
- Translation
categories: 
- 博文
---
文章来源：[InnoDB Page Merging and Page Splitting](https://www.percona.com/blog/2017/04/10/innodb-page-merging-and-page-splitting/)

---

# 表结构
假设有张表名为`windmills`，其数据文件目录结构可能如下：
```
data/
  windmills/
      wmills.ibd
      wmills.frm
```

数据存储在一个叫`wills.ibd`的文件中。该文件由N个`segments`组成，每个`segments`都关联着索引。

在删除数据行是，该文件的尺寸不会改变，`segment`自身会增大或缩小取决于其名为`extent`的子元素。一个`extent`只能存在于`segment`中并且固定大小为1MB（若page是默认页大小时）。一个`page`是`extent`的子元素且有默认16KB的大小。

因此，`extent`最多有64`pages`。一个页可以包含2~N的数据行。具体的行数取决于行的大小（在表结构中定义了）。Innodb中有一个强制规定，即一个页至少要包含两个数据行，由此有了另一个规定：数据行不能超过8000字节。
<img class="re-small" alt="segment-extent-page" src="/images/mysql/segment_extent-e1491345857803.png" />
<span class="img-subtitle">InnoDB uses B-trees to organize your data inside pages across extents, within segments.</span>

# Roots,Branches,and Leaves
每个页(leaf)包含2~N的数据行，由主键索引来组织其结构。该树形结构有一些特殊的页来管理树枝(branches)，即所谓的`internal nodes`(INodes)。
![b+树](/images/mysql/Bplustree-1024x471.png)
<span class="img-subtitle">This image is just an example, and is not indicative of the real-world output below.</span>
上图对应的具体细节如下：
```bash
ROOT NODE #3: 4 records, 68 bytes
 NODE POINTER RECORD ≥ (id=2) → #197
 INTERNAL NODE #197: 464 records, 7888 bytes
 NODE POINTER RECORD ≥ (id=2) → #5
 LEAF NODE #5: 57 records, 7524 bytes
 RECORD: (id=2) → (uuid="884e471c-0e82-11e7-8bf6-08002734ed50", millid=139, kwatts_s=1956, date="2017-05-01", location="For beauty's pattern to succeeding men.Yet do thy", active=1, time="2017-03-21 22:05:45", strrecordtype="Wit")
```

表结构:
```sql
CREATE TABLE `wmills` (
  `id` bigint(11) NOT NULL AUTO_INCREMENT,
  `uuid` char(36) COLLATE utf8_bin NOT NULL,
  `millid` smallint(6) NOT NULL,
  `kwatts_s` int(11) NOT NULL,
  `date` date NOT NULL,
  `location` varchar(50) COLLATE utf8_bin DEFAULT NULL,
  `active` tinyint(2) NOT NULL DEFAULT '1',
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `strrecordtype` char(3) COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`id`),
  KEY `IDX_millid` (`millid`)
) ENGINE=InnoDB;
```

B-Tree都有一个根节点，本例子中根节点是#3。root页（即根节点）包含有索引的ID值，其INodes数量等信息。INodes页包含自身的属性，取值范围等信息。最后，是叶子节点(leaf nodes)，这里我们能获取到数据行。在这个例子中，我们可以看出来，#5号叶子节点包含57行数据，总共7524字节。

我们使用表和行来维护数据，而Innodb使用branches，pages，和records来维护数据。必须牢记一点，Innodb并不直接操作数据行，而是操作pages。当从磁盘上加载一页后，他会扫描改页来确定数据行(row/record)。

# Page Internals
`page`可以是空的也可以是装满的。数据行由主键组织，若你的表有`AUTO_INCREMENT`属性，那么主键就是顺序的，如ID=1,2,3,4等等。
![页](/images/mysql/Locality_1.png)

`page`有另一个重要的属性：`MERGE_THRESHOLD`。其默认值是页大小的50%，它在Innodb的合并过程中很重要。
![页2](/images/mysql/Locality_2.png)

插入数据时，页顺序填充（若装得下）。当页满了，下一行数据会填充到下一页中。

我们不仅能自上而下的遍历branches，也能水平遍历叶子节点。因为叶子节点含有指向下一叶子节点的指针。

例如，page#5有指向下一节点页#6的指针。而页#6含有一个指回页#5的指针，同时有一个指向下一节点页#7的指针。

该结构能加速顺序扫描的速度（如范围检索）。上述是对`AUTO_INCREMENT`的插入场景的描述。但若我们执行删除操作呢？

# Page Mergeing
当删除一行时，它并不会物理上删除该数据。而是标记为已删除，其占用的空间是可申领的状态。(Instead, it flags the record as deleted and the space it used becomes reclaimable.)
![页3](/images/mysql/Locality_3.png)

当执行了足够多的删除操作，达到`MERGE_THRESHOLD`（默认是页大小的50%）时，Innodb开始检查附近的页（前一页和后一页），看看是否能通过合并两页来优化空间。
![页4](/images/mysql/Locality_4.png)

本例中，页#6使用的空间不足其50%，页#5因为多次删除操作也有<50%的使用率，从Innodb的角度看，他们是可以合并的。
![页5](/images/mysql/Locality_5.png)

合并之后，页#5包含自身旧数据和页#6的数据，而页#6则为空留待使用。
![页6](/images/mysql/Locality_6.png)

# Page Splits
上面提到过，但页使用满了，下一行数据会被写入下一页中。
但若我们遇到如下情景呢？
![页7](/images/mysql/Locality_7.png)

页#10剩余空间不足以存放新的数据行(或更新操作)，按照上面的下一页逻辑，该行数据应插入到下一页，但实际上：
![页9](/images/mysql/Locality_9.png)

页#11也满了，此时数据无法按既定的书序插入，该怎么办？
还记得上面提到的链表结构吗？此时，页#10含有前一页#9和后一页#11的指针。
Innodb只需要简单的如下操作：
1. 创建一个新的页
2. 找到数据源页（页#10）中应该从哪开始分裂(按数据行级别)。
3. 移动数据。
4. 重新定义页之间的指向。
![页8](/images/mysql/Locality_8.png)

创建一个新页#12。
![页10](/images/mysql/Locality_10.png)

页#11保持不变，改变的是页之间的指向关系：
1. 页#10将指向前一页#9和后一页#12。
2. 页#12将指向前一页#10和后一页#11。
3. 页#11将指向前一页#12和后一页#13。

此时，B+树的路径在逻辑上仍然是连续的，但物理上，页之间是无序的，通常都在不同的`extent`中。

Innodb使用`INFORMATION_SCHEMA.INNODB_METRICS`跟踪页分裂的次数。

一旦页分裂发生，只能通过删除新页数据达到<50%使用率来触发也合并来恢复。

或者通过`OPTIMIZE`优化表结构，这通常很消耗资源且需要很长时间。但有时也是唯一的办法（比如使用了uuid做主键）。

另外需要记住一点，当发生页分类或也合并时，Innodb会在索引上获取`x-latch`，在一个繁忙的系统中，这会是一个性能障碍。在Innodb中称为"悲观"更新，此时加的是悲观锁。这会造成索引上的锁竞争。若合并或分裂只操作了一页，被称为"乐观"更新，锁是乐观锁。

# 不同主键的比较
良好的主键不但对读数据重要，也能在写数据时正确的分布数据。

一例中我们使用简单的自增ID做主键。二例中主键使用了ID（取值范围1-200）且自增。三例中我们使用了同样的ID做主键，但该主键关联到UUID上。

插入数据时，页分裂的情况如下：
![页分裂的对比](/images/mysql/split_1.png)

前两例的数据分布更紧凑。也意味着它们有更好的空间利用率。例三有着大量空闲的页，意味着有大量的页分裂操作。

而在也合并的情况：
![页合并的对比](/images/mysql/merges_1.png)

在`插入-更新-删除`操作下，自增ID的例子中合并操作更少，更低的合并成功率9.45%。而使用UUID为主键的例子中，合并操作更多且合并成功率更高22.34%
