---
title: MySQL分区
date: 2014-11-12 16:50:53
tags: MySQL
categories:
- 博文
---
http://dev.mysql.com/doc/refman/5.5/en/partitioning-limitations-partitioning-keys-unique-keys.html

19.5.1 分区索引，主键索引，和唯一索引

这一节讨论了分区索引同主键索引、唯一索引的关系。 掌握这一关系的基本原则可以表述如下：在分区表的分区表达式中所用到的列必须是该表的每一个唯一索引的一部分。

换而言之，该表的每一个唯一索引都必须使用了分区表达式中的每一列。（`唯一索引`也包括主键索引，因为从定义上将主键也是唯一索引。这个特殊的例子在后面后讨论。）如下例，下面的建表语句都是无效的。

```sql
CREATE TABLE t1 (
    col1 INT NOT NULL,
    col2 DATE NOT NULL,
    col3 INT NOT NULL,
    col4 INT NOT NULL,
    UNIQUE KEY (col1, col2)
)
PARTITION BY HASH(col3)
PARTITIONS 4;

CREATE TABLE t2 (
    col1 INT NOT NULL,
    col2 DATE NOT NULL,
    col3 INT NOT NULL,
    col4 INT NOT NULL,
    UNIQUE KEY (col1),
    UNIQUE KEY (col3)
)
PARTITION BY HASH(col1 + col3)
PARTITIONS 4;
```

上述两例中，目标表将至少有一个唯一索引不是分区表达式中指定的列。

下面的例子时有效的，并指出了正确修改上述无效例子的方法：
```sql
CREATE TABLE t1 (
    col1 INT NOT NULL,
    col2 DATE NOT NULL,
    col3 INT NOT NULL,
    col4 INT NOT NULL,
    UNIQUE KEY (col1, col2, col3)
)
PARTITION BY HASH(col3)
PARTITIONS 4;

CREATE TABLE t2 (
    col1 INT NOT NULL,
    col2 DATE NOT NULL,
    col3 INT NOT NULL,
    col4 INT NOT NULL,
    UNIQUE KEY (col1, col3)
)
PARTITION BY HASH(col1 + col3)
PARTITIONS 4;
```

下面的例子是错误的：
```sql
mysql> CREATE TABLE t3 (
    ->     col1 INT NOT NULL,
    ->     col2 DATE NOT NULL,
    ->     col3 INT NOT NULL,
    ->     col4 INT NOT NULL,
    ->     UNIQUE KEY (col1, col2),
    ->     UNIQUE KEY (col3)
    -> )
    -> PARTITION BY HASH(col1 + col3)
    -> PARTITIONS 4;
ERROR 1491 (HY000): A PRIMARY KEY must include all columns in the table's partitioning function
```

上述建表语句失败了，原因在于col1和col3这两列都在目标分区索引中，但是，没有任何一列出现在该表的全部唯一索引中。
如下时一种可能的改进方案：
```sql
mysql> CREATE TABLE t3 (
    ->     col1 INT NOT NULL,
    ->     col2 DATE NOT NULL,
    ->     col3 INT NOT NULL,
    ->     col4 INT NOT NULL,
    ->     UNIQUE KEY (col1, col2, col3),
    ->     UNIQUE KEY (col3)
    -> )
    -> PARTITION BY HASH(col3)
    -> PARTITIONS 4;
Query OK, 0 rows affected (0.05 sec)
```
这个例子中，col3是该表每一个唯一索引的一部分。因此上述语句成功了。

下面这个建表语句时无法分区的，因为分区索引中不能有某列出现的该表的每一个唯一索引中。
```sql
CREATE TABLE t4 (
    col1 INT NOT NULL,
    col2 INT NOT NULL,
    col3 INT NOT NULL,
    col4 INT NOT NULL,
    UNIQUE KEY (col1, col3),
    UNIQUE KEY (col2, col4)
);
```

由于主键也是被定义为唯一索引的，若表有主键，上述的限制页适用与主键。下述两例均是无效的：
```sql
CREATE TABLE t5 (
    col1 INT NOT NULL,
    col2 DATE NOT NULL,
    col3 INT NOT NULL,
    col4 INT NOT NULL,
    PRIMARY KEY(col1, col2)
)
PARTITION BY HASH(col3)
PARTITIONS 4;

CREATE TABLE t6 (
    col1 INT NOT NULL,
    col2 DATE NOT NULL,
    col3 INT NOT NULL,
    col4 INT NOT NULL,
    PRIMARY KEY(col1, col3),
    UNIQUE KEY(col2)
)
PARTITION BY HASH( YEAR(col2) )
PARTITIONS 4;
```
两例中，主键都未包含分区表达式中的列。然而，下面的两例都是有效的：
```sql
CREATE TABLE t7 (
    col1 INT NOT NULL,
    col2 DATE NOT NULL,
    col3 INT NOT NULL,
    col4 INT NOT NULL,
    PRIMARY KEY(col1, col2)
)
PARTITION BY HASH(col1 + YEAR(col2))
PARTITIONS 4;

CREATE TABLE t8 (
    col1 INT NOT NULL,
    col2 DATE NOT NULL,
    col3 INT NOT NULL,
    col4 INT NOT NULL,
    PRIMARY KEY(col1, col2, col4),
    UNIQUE KEY(col2, col1)
)
PARTITION BY HASH(col1 + YEAR(col2))
PARTITIONS 4;
```

如果一张表没有唯一索引（该情形包括没有主键），则上述限制不再生效，那么只要列类型兼容分区类型，可以在分区表达式中适用任何列。

基于同样的道理，不能在分区之后给分区表加唯一索引，除非该索引包含分区表达式中所有的列。思考下面的例子：
```sql
mysql> CREATE TABLE t_no_pk (c1 INT, c2 INT)
    ->     PARTITION BY RANGE(c1) (
    ->         PARTITION p0 VALUES LESS THAN (10),
    ->         PARTITION p1 VALUES LESS THAN (20),
    ->         PARTITION p2 VALUES LESS THAN (30),
    ->         PARTITION p3 VALUES LESS THAN (40)
    ->     );
Query OK, 0 rows affected (0.12 sec)
```
使用下面的ALTER语句给t_no_pk表增加主键是可行的：
```sql
#  possible PK
mysql> ALTER TABLE t_no_pk ADD PRIMARY KEY(c1);
Query OK, 0 rows affected (0.13 sec)
Records: 0  Duplicates: 0  Warnings: 0

# drop this PK
mysql> ALTER TABLE t_no_pk DROP PRIMARY KEY;
Query OK, 0 rows affected (0.10 sec)
Records: 0  Duplicates: 0  Warnings: 0

#  use another possible PK
mysql> ALTER TABLE t_no_pk ADD PRIMARY KEY(c1, c2);
Query OK, 0 rows affected (0.12 sec)
Records: 0  Duplicates: 0  Warnings: 0

# drop this PK
mysql> ALTER TABLE t_no_pk DROP PRIMARY KEY;
Query OK, 0 rows affected (0.09 sec)
Records: 0  Duplicates: 0  Warnings: 0
```
但是，下面这条语句是无效的，因为c1是分区索引的一部分，却不是主键的一部分：
```sql
#  fails with error 1503
mysql> ALTER TABLE t_no_pk ADD PRIMARY KEY(c2);
ERROR 1503 (HY000): A PRIMARY KEY must include all columns in the table's partitioning function
```
因为t_no_pk表的分区索引中只含有c1列，因此尝试将c2设置为唯一索引是无效的。但是，你可以设置一个同时使用c1和c2的主键。

上述规则也适用于你期望使用 ALTER TABLE ... PARTITION BY 来分区的当前非分区表。思考如下建表语句：
```sql
mysql> CREATE TABLE np_pk (
    ->     id INT NOT NULL AUTO_INCREMENT,
    ->     name VARCHAR(50),
    ->     added DATE,
    ->     PRIMARY KEY (id)
    -> );
Query OK, 0 rows affected (0.08 sec)
```
下面的ALTER语句是无效的，因为added列不是该表中任何唯一索引的一部分：
```sql
mysql> ALTER TABLE np_pk
    ->     PARTITION BY HASH( TO_DAYS(added) )
    ->     PARTITIONS 4;
ERROR 1503 (HY000): A PRIMARY KEY must include all columns in the table's partitioning function
```
但是，使用id列作为分区索引时可行的，如下例：
```sql
mysql> ALTER TABLE np_pk
    ->     PARTITION BY HASH(id)
    ->     PARTITIONS 4;
Query OK, 0 rows affected (0.11 sec)
Records: 0  Duplicates: 0  Warnings: 0
```
在np_pk这个例子中，能被用于分区表达式中的只有id列；若你想在分区表达式中使用任何表中其他列，你必须先修改表，或将待分区的列加入主键，或直接删除主键。