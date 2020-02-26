---
title: MySQL锁
date: 2018-09-18 21:29:44
tags: MySQL 锁
categories:
- 博文
mathjax: true
---

# Myisam表锁
## 锁模式
1. 共享锁（S锁，亦读锁）：如果事务T对数据A加上共享锁后，则其他事务只能对A再加共享锁，不能加排它锁。获取共享锁的事务只能读数据，不能写数据。
2. 排它锁（X锁，亦写锁）：如果事务T对数据A加上排它锁后，则其他事务不能再对A加任务类型的锁。获取排它锁的事务既能读数据，也能写数据。

第一行为请求锁模式， 第一列为当前锁模式  

|| None   |      读锁     |  写锁 |
|------|--------|:-------------:|------:|
|读锁  | 是     |      是       |   否 |
|写锁  | 是     |      否       |   否 |
1. 当前锁为读锁，请求锁为读锁，正常读取。（图1）
2. 当前锁为读锁，请求锁为写锁，阻塞。（图2）
3. 当前锁为写锁，请求锁为读锁，阻塞。（图3）
4. 当前锁为写锁，请求锁为写锁，阻塞。（图4）

<!--more-->

![图1](/images/mysql/lock_read_read.png)
图1.

![图2](/images/mysql/lock_read_write.png)
图2.

![图2](/images/mysql/lock_write_read.png)
图3.

![图3](/images/mysql/lock_write_write.png)
图4.

简而言之: 
1. Myisam表的读操作，不会阻塞对同一表的读操作，但是会阻塞写操作。
2. Myisam表的写操作，会阻塞对同一表的读、写操作。
3. Myisam表的读、写操作之间，以及写操作之间是串行的。

一般，Myisam在执行查询前，会自动执行表的加锁、解锁操作，不需要用户手动加锁、解锁。  
但下例不同，请思考：
```sql
select sum(t1.score) as 'score' from t1;
select sum(t2.score) as 'score' from t2;
```

上面的sql是有问题的。因为读完t1表再读t2表时，t2表的数据可能已经发生的变化，不再是期望的`同一时刻的状态`，修改为：
```sql
lock table t1 read, t2 read;
select sum(t1.score) as 'score' from t1;
select sum(t2.score) as 'score' from t2;
unlock tables;
```

## 并发插入
通常Myisam的新数据会插入到数据文件的末尾，但是当做一些upate、delete操作之后，数据文件不再是连续的，数据文件中会有空洞。此时再插入新数据，会先检查这些空洞是否能容纳新数据。如果可以，则插入空洞，否则插入文件末尾。

Myisam里读写是串行的，为了降低锁竞争的频率，需要设置`concurrent_insert`:
1. concurrent_insert=0，不允许并发插入
2. concurrent_insert=1，允许对没有空洞的表并发插入，新数据位于末尾。
3. concurrent_insert=2，不管表有没有空挡，都允许在数据文件末尾插入。

缺省情况下，写操作优先级高于读操作。即使是先发送的读请求，后发送的写请求，此时也会有限处理写。这样，当连续多个写时，所有的读请求会被阻塞。因此：
1. max_write_lock_count=1，当处理完一个写后，暂停写，给读操作流出机会。
2. low-priority-updates=1，直接降低写操作的优先级，给读操作更高的优先级

# Innodb表锁
## Innodb与Myisam的不同
1. 支持事务
2. 采用行级锁
3. 不支持全文索

## Innodb行锁模式以及加锁方式
* 共享锁（S锁）：允许一个事务去读一行，阻止其他事务获取相同数据集的排它锁。
* 排它锁（X锁）：允许获得排它锁的事务更新数据，阻止其他事务获得相同数据集的共享读锁和排他写锁。
* 意向共享锁（IS锁）：
* 意向排它锁（IX锁）：

|  |  X   |  IX |  S   |  IS |
|--|------|-----|:----:|:---:|
| X |冲突 | 冲突 | 冲突 | 冲突 |
| IX|冲突 | 兼容 | 冲突 | 兼容 |
| S |冲突 | 冲突 | 兼容 | 兼容 |
| IS|冲突 | 兼容 | 兼容 | 兼容 |

如果请求锁模式和当前锁模式兼容，则并发；否则阻塞。意向锁是Innodb自动加的，不需要手动操作。对于UPDATE、DELEE、INSERT语句，Innodb会自动加排它锁；对普通的SELECT语句，不加锁。  
手动显示的使用锁：
1. 共享锁： SELECT * FROM `t` WHERE ... LOCK IN SHARE MODE;
2. 排它锁： SELECT * FROM `t` WHERE ... FOR UPDATE;

## Innodb行锁实现方式
Innodb的行锁是通过给索引加锁实现的。因此，仅当通过索引条件检索，Innodb才使用行锁，否则使用表锁

![图1](/images/mysql/innodb_S_X_block.png)

当一个事务加锁时，另一个事务在同一索引上再加锁则阻塞：
![图2](/images/mysql/innodb_S_X_sime_index_block.png)