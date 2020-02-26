---
title: Mysql_索引
date: 2020-02-24 18:12:01
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
