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
> Indexes are used to find rows with specific column values quickly.

<!--more-->
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
  
## 高级用法
explain FORMAT=JSON select xxx from yyy where zzz;
[查看用例](/2020/02/24/Mysql-索引/#联合索引的索引覆盖)

# 索引
用以高效查询数据的数据结构。

# Hash索引
底层数据结构是哈希表，只能用于等值查询，在碰撞场景下效率低，无法利用索引完成排序，没有最左匹配特性。

# B+树索引 - Innodb
底层数据结构是多路平衡查询树，节点天然有序，额外的适用于范围查询。
[详细讨论参考另一篇文章](/2020/02/27/MySQL-B-Tree索引/)

## 聚簇索引
通常就是主键索引。索引所在的页储存了数据行。

## 非聚簇索引
除聚簇索引之外其他的索引都称为非聚簇索引。索引所在的页只存储了主键值，若需要其他数据需要回表查询。

## 联合索引的索引覆盖
创建测试数据库
```sql
Create Table: CREATE TABLE `teacher` (
  `id` int(11) NOT NULL,
  `name` varchar(32) NOT NULL DEFAULT '',
  `age` int(11) NOT NULL DEFAULT 0,
  `subject` varchar(32) NOT NULL DEFAULT '',
  `salary` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`),
  KEY `idx_name_subject_salary` (`name`,`subject`,`salary`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO `teacher` VALUES 
(10101,'Srinivasan',30,'Comp. Sci.',65000),
(12121,'Wu',26,'Finance',90000),
(15151,'Mozart',50,'Music',40000),
(22222,'Einstein',76,'Physics',95000),
(32343,'El Said',35,'History',80000),
(33456,'Gold',49,'Physics',87000),
(45565,'Katz',42,'Comp. Sci.',75000),
(58583,'Califieri',38,'History',60000),
(76543,'Singh',33,'Finance',80000),
(76766,'Crick',46,'Biology',72000),
(83821,'Brandt',29,'Comp. Sci.',92000),
(98345,'Kim',31,'Elec. Eng.',80000);
```

`explain FORMAT=JSON select subject,salary from teacher where name="Mozart";`
输出:
```json
{
  "query_block": {
    "select_id": 1,
    "table": {
      "table_name": "teacher",
      "access_type": "ref",
      "possible_keys": ["idx_name", "idx_name_subject_salary"],
      "key": "idx_name_subject_salary",
      "key_length": "130",
      "used_key_parts": ["name"],
      "ref": ["const"],
      "rows": 1,
      "filtered": 100,
      "attached_condition": "teacher.`name` = 'Mozart'",
      "using_index": true //索引覆盖
    }
  }
}
```
> Using index (JSON property: using_index)
> 
> The column information is retrieved from the table using only information in the index tree without having to do an additional seek to read the actual row.

- 索引如何加速排序
- Mysql的ICP（Index Condition Pushdown Optimization）
- 索引的存储和缓存
- 索引区分度和索引长度
- ...

## 联合索引的最左匹配原则
<table><tr><th>假设索引idx_a_b_c(`a`,`b`,`c`)</th><th>索引是否使用</th></tr><tr><td>where a=3</td><td></td></tr><tr><td>where a=3 and b=4</td><td></td></tr><tr><td>where a=3 and b=4 and c=5</td><td></td></tr><tr><td>where c=5 and a=3 and b=4</td><td></td></tr><tr><td>where b=4 / where b=4 and c=5 /<br>where c=5</td><td></td></tr><tr><td>where a=3 and c=5</td><td></td></tr><tr><td>where a=3 and b&gt;4 and c=5</td><td></td></tr><tr><td>where a is null and b is not null</td><td></td></tr><tr><td>where a &lt;&gt; 3 and b=4</td><td></td></tr><tr><td>where a^3&gt;0</td><td></td></tr><tr><td>where a=3 and b like 'k%' and c=5</td><td></td></tr><tr><td>where a=3 and b like '%k%' and c=5</td><td></td></tr><tr><td>where a=3 and b like 'k%k%' and c=5</td><td></td></tr></table>

## 索引下推 - Index Condition Pushdown Optimization

## 索引失效场景
[不看后悔的腾讯面试题：SQL语句为什么执行的很慢？](https://mp.weixin.qq.com/s?__biz=MzI4NTA1MDEwNg==&mid=2650777604&idx=1&sn=9a0cfd88cfe15e9f198a7be02e2db3f6&chksm=f3f91d91c48e9487f0f815a77e3ab35e2bd7172e5e4a06deff7ea6d819748283e6e6db78f9d0&mpshare=1&scene=1&srcid=0226IIHf7SrQUneNI0PUIVBL&sharer_sharetime=1582723108055&sharer_shareid=0a5f0581869913747e54ca097f77ea2b&key=e6296972ac076826e6bb923456fb1df47326c43fe252e5b370eb168cb3ea72f9b988f65af9d04dfa654dac6a14bd6967cb08ce845ee7dd30a255d230ed38975133d7d9dd10f3a01fb011d037222eb5e2&ascene=1&uin=MTA4MTU0ODIyMg%3D%3D&devicetype=Windows+7&version=6208006f&lang=zh_CN&exportkey=AQthZutP%2Bxc63SO0tW7U5NY%3D&pass_ticket=eYprKboj%2F%2FVkb9z2n1rVgrNb833slBE0lMIXwN27FvVBipjBM67fSOf2ZckEmBBo)

参考资料：
1. [15.6.2.1 Clustered and Secondary Indexes](https://dev.mysql.com/doc/refman/8.0/en/innodb-index-types.html)
1. [8.3.1 How MySQL Uses Indexes](https://dev.mysql.com/doc/refman/8.0/en/mysql-indexes.html)
2. [8.3.9 Comparison of B-Tree and Hash Indexes](https://dev.mysql.com/doc/refman/8.0/en/index-btree-hash.html)
3. [8.3.6 Multiple-Column Indexes](https://dev.mysql.com/doc/refman/8.0/en/multiple-column-indexes.html)
4. [covering index](https://dev.mysql.com/doc/refman/8.0/en/glossary.html#glos_covering_index)
5. [Mysql索引简明教程](https://mp.weixin.qq.com/s?__biz=MzI4Njg5MDA5NA==&mid=2247486057&idx=1&sn=eec75a0f6f2c408c8188658011c38e07&chksm=ebd74b68dca0c27e90096f0017ba5479774ae7643f2cecd72b011823df1411ab1659ea889b37&mpshare=1&scene=1&srcid=0227wKqrRDn5WWOWC5hOZnrW&sharer_sharetime=1582784840625&sharer_shareid=0a5f0581869913747e54ca097f77ea2b&key=e1d18effe01e13c45e831bca7ce32424fbdfcd17afd7bd8529258d0dbbde26ef9685b7359cbad4b5df760219307def5f806daf7c611d12fe08d4f7b5ffe113045975d784908d381965b74a306162d71d&ascene=1&uin=MTA4MTU0ODIyMg%3D%3D&devicetype=Windows+7&version=6208006f&lang=zh_CN&exportkey=ARKOykk77XHXzE9b6n4W5k0%3D&pass_ticket=LfdlJsZTmXBQdrVYQljTmpWvFMzoeQx6Wi9ewOu4ScxuKyysIBvhLO%2F8k6ZGN7MK)
