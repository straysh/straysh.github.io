---
title: Mysql_索引
date: 2020-02-24 18:12:01
toc: true
tags: 
- MySQL
categories: 
- 博文
---
# explain
![explain_eg01](/images/mysql/explain_eg01.png)

> - id (query id) - 查询执行的顺序
- select_type (type of statement) - 查询的类型
  1. `SIMPLE`，简单查询，不使用UNION或子查询等。
  2. `PRIMARY`，子查询中的最外层查询。
  3. `UNION`，UNION中的第二个或后面的select查询。
  4. `SUBQUERY`，子查询中的第一个select，结果不依赖于外部查询。
  5. `DEPENDENT SUBQUERY`，子查询中的第一个select，结果依赖于外部查询。
  6. `DERIVED`，派生表的select,from子句的子查询。
- table (table referenced) - 使用的表名，可能是表的别名。
- type (join type) - 连接的类型
  1. `ALL` - Full Table Scan，全表查询
  2. `index` - Full Index Scan，只遍历索引树。
  3. `range` - 只检索给定范围的行且使用索引。
  4. `ref` - 连接匹配条件，即哪些列或常量被用于查找索引列上的值。
  5. `eq_ref` - 类似ref，区别是使用的索引是唯一索引，对于每个索引值表中只有一条记录匹配。
  6. `const`、`system` - 当mysql对查询某部分优化并转换为一个常量时，使用这些类型访问。例如将主键置于where条件中，MySQL就能将该查询转换为一个常量。system是const的特例，当查询表中只有一行记录时。
  7. `NULL` - 优化后甚至不需要访问表或索引，如取最小值可通过单独索引完成查找。
- possible_keys (which keys could have been used) - 可能使用到的索引
- key (key that was used) - 实际使用到的索引，若没有任何索引则显示为null
- key_len (length of used key) - (实际使用的)索引的长度
  1. 表示索引中使用的字节数（通过定义得到的理论值）
- ref (columns compared to index) - 列与索引的比较，表示上述表的连接匹配条件，即哪些列或常量被用于查找索引列上的值
- **rows** (amount of rows searched) - 扫描的行数
- **Extra** (additional information) - 额外的信息
  1. `Using index` - 使用了索引覆盖。
  1. `Using where` - 不用读取表中的数据，只通过索引就能完成查询。即通常所说的`索引覆盖`。
  2. `Using filesort` - 当含有`order by`操作，且无法通过索引完成排序。
  3. `Using join buffer` - 连接条件没有使用索引，且需要连接缓冲区来存储中间结果。通常是一个需要优化的信号。
  4. `Impossible where` - where语句可能导致没有符合条件的行。
  5. `Select tables optimized away` - 仅通过使用索引，优化器可能仅从聚合函数结果中返回一行。如MIN/MAX/MyISAM引擎中的Count(*)
  6. `No tables used` - Query语句中使用from dual（即空表）或不含任何from子句

# 索引
用以高效查询数据的数据结构。

# Hash索引
底层数据结构是哈希表，只能用于等值查询，在碰撞场景下效率低，无法利用索引完成排序，没有最左匹配特性。

# B+树索引 - Innodb
底层数据结构是多路平衡查询树，节点天然有序，额外的适用于范围查询。
[不准犹豫！再有人问你为什么MySQL用B+树做索引，就把这篇文章发给她](https://mp.weixin.qq.com/s?__biz=Mzg2NzA4MTkxNQ==&mid=2247486251&idx=1&sn=296f07b65b5a73a15337541fb4bc6572&key=e1d18effe01e13c43433cc33c5161f00872a430ca41b577f513fa082b7f46bd37471f7cfe2954afa430e0eaf04288da8b98daa275053c639d985c27ec0dd8b286dcf0196305776d4004cac349def25e0&ascene=1&uin=MTA4MTU0ODIyMg%3D%3D&devicetype=Windows+7&version=6208006f&lang=zh_CN&exportkey=AZxQ0x8eUrIpA2TZSIvCers%3D&pass_ticket=eYprKboj%2F%2FVkb9z2n1rVgrNb833slBE0lMIXwN27FvVBipjBM67fSOf2ZckEmBBo)

## 聚簇索引
即主键索引。索引所在的页储存了数据行。

## 非聚簇索引
非主键索引。索引所在的页只存储了主键值，若需要其他数据需要回表查询。

## 联合索引的索引覆盖

## 联合索引的最左匹配原则
<table><tr><th>假设索引idx_a_b_c(`a`,`b`,`c`)</th><th>索引是否使用</th></tr><tr><td>where a=3</td><td></td></tr><tr><td>where a=3 and b=4</td><td></td></tr><tr><td>where a=3 and b=4 and c=5</td><td></td></tr><tr><td>where c=5 and a=3 and b=4</td><td></td></tr><tr><td>where b=4 / where b=4 and c=5 /<br>where c=5</td><td></td></tr><tr><td>where a=3 and c=5</td><td></td></tr><tr><td>where a=3 and b&gt;4 and c=5</td><td></td></tr><tr><td>where a is null and b is not null</td><td></td></tr><tr><td>where a &lt;&gt; 3 and b=4</td><td></td></tr><tr><td>where a^3&gt;0</td><td></td></tr><tr><td>where a=3 and b like 'k%' and c=5</td><td></td></tr><tr><td>where a=3 and b like '%k%' and c=5</td><td></td></tr><tr><td>where a=3 and b like 'k%k%' and c=5</td><td></td></tr></table>

## 索引下推 - Index Condition Pushdown Optimization

## 索引失效场景
[不看后悔的腾讯面试题：SQL语句为什么执行的很慢？](https://mp.weixin.qq.com/s?__biz=MzI4NTA1MDEwNg==&mid=2650777604&idx=1&sn=9a0cfd88cfe15e9f198a7be02e2db3f6&chksm=f3f91d91c48e9487f0f815a77e3ab35e2bd7172e5e4a06deff7ea6d819748283e6e6db78f9d0&mpshare=1&scene=1&srcid=0226IIHf7SrQUneNI0PUIVBL&sharer_sharetime=1582723108055&sharer_shareid=0a5f0581869913747e54ca097f77ea2b&key=e6296972ac076826e6bb923456fb1df47326c43fe252e5b370eb168cb3ea72f9b988f65af9d04dfa654dac6a14bd6967cb08ce845ee7dd30a255d230ed38975133d7d9dd10f3a01fb011d037222eb5e2&ascene=1&uin=MTA4MTU0ODIyMg%3D%3D&devicetype=Windows+7&version=6208006f&lang=zh_CN&exportkey=AQthZutP%2Bxc63SO0tW7U5NY%3D&pass_ticket=eYprKboj%2F%2FVkb9z2n1rVgrNb833slBE0lMIXwN27FvVBipjBM67fSOf2ZckEmBBo)
