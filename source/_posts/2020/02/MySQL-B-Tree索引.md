---
title: MySQL_B+Tree索引
date: 2020-02-27 20:50:08
tags:
- Mysql
categories:
- 博文
---
索引是提高查询效率的，在MySQL中以B+树索引为主（绝大部分MySQL数据库引擎都是用的Innodb，而Innodb默认使用B+树）。
B+树索引又分为聚簇索引和非聚簇索引，本文着重介绍聚簇索引。

# 聚簇索引
聚簇索引并不是单独的索引类型（索引类型包含：主键索引、唯一索引、单列索引、聚合索引等），而是一种数据存储方式。其非叶子节点仅包含索引列，数据行存储在叶子节点上。
Innodb只保证相同页上的数据是连续的，但不同的页可能相距甚远。

# 结构
1. 类似平衡二叉查找树：节点有序(左节点<根节点<右节点)，树是平衡的不会单边增长。
2. 节点上存有多个索引值，控制树的深度，稳定查询效率。
3. 节点大小是一个页4KB。

## B-Tree和B+Tree的对比
**B-Tree**
![B树](/images/mysql/b-Tree.webp)

**B+Tree**
![B+树](/images/mysql/b+Tree.webp)

# 聚簇索引的优点
1. 叶子节点包含数据行，因此聚簇索引比非聚簇索引更快。
2. 叶子节点中的数据是连续的，实现范围查找效率更高（叶子节点之间有顺序指针）。
![叶子节点之间有顺序指针](/images/mysql/b+tree_seq_ptr.webp)

# 聚簇索引的缺点
1. 更新聚簇索引代价很高，以为需要移动数据行到新的位置。
2. 可能导致[页分裂](/2020/02/28/MySQL-页分裂/)，从而某时刻导致大量的I/O操作。

---
参考资料：
1. [8.3.1 How MySQL Uses Indexes](https://dev.mysql.com/doc/refman/8.0/en/mysql-indexes.html)
2. [8.3.9 Comparison of B-Tree and Hash Indexes](https://dev.mysql.com/doc/refman/8.0/en/index-btree-hash.html)
3. [8.3.6 Multiple-Column Indexes](https://dev.mysql.com/doc/refman/8.0/en/multiple-column-indexes.html)
4. [covering index](https://dev.mysql.com/doc/refman/8.0/en/glossary.html#glos_covering_index)
5. [Mysql索引简明教程](https://mp.weixin.qq.com/s?__biz=MzI4Njg5MDA5NA==&mid=2247486057&idx=1&sn=eec75a0f6f2c408c8188658011c38e07&chksm=ebd74b68dca0c27e90096f0017ba5479774ae7643f2cecd72b011823df1411ab1659ea889b37&mpshare=1&scene=1&srcid=0227wKqrRDn5WWOWC5hOZnrW&sharer_sharetime=1582784840625&sharer_shareid=0a5f0581869913747e54ca097f77ea2b&key=e1d18effe01e13c45e831bca7ce32424fbdfcd17afd7bd8529258d0dbbde26ef9685b7359cbad4b5df760219307def5f806daf7c611d12fe08d4f7b5ffe113045975d784908d381965b74a306162d71d&ascene=1&uin=MTA4MTU0ODIyMg%3D%3D&devicetype=Windows+7&version=6208006f&lang=zh_CN&exportkey=ARKOykk77XHXzE9b6n4W5k0%3D&pass_ticket=LfdlJsZTmXBQdrVYQljTmpWvFMzoeQx6Wi9ewOu4ScxuKyysIBvhLO%2F8k6ZGN7MK)
6. [聚簇索引及 InnoDB 与 MyISAM 数据分布对比](https://mp.weixin.qq.com/s?__biz=MzU4MzU4NzI5OA==&mid=2247483843&idx=2&sn=27c6d378f92635875a7ed050b8cc477d&chksm=fda7854ecad00c5829d4900630da7e0743e4939f0b0f725380de7ecc628f87e233e5eeec68bf&mpshare=1&scene=1&srcid=0227ui0mH6TQVfmAevkgdUeY&sharer_sharetime=1582784826674&sharer_shareid=0a5f0581869913747e54ca097f77ea2b&key=b75e9a2bedf85391600cf4de5ae4f18cbedc1b6042691e4a69bbd980e81afb35f3d12972039e7cf2f33db60509f07785dfe862de04514c2cb8223958d65ab05235af3eab5a7c76673629541c1c13c085&ascene=1&uin=MTA4MTU0ODIyMg%3D%3D&devicetype=Windows+7&version=6208006f&lang=zh_CN&exportkey=AQPGhtcoIKYENMY5ov%2Bdq2E%3D&pass_ticket=LfdlJsZTmXBQdrVYQljTmpWvFMzoeQx6Wi9ewOu4ScxuKyysIBvhLO%2F8k6ZGN7MK)
7. [不准犹豫！再有人问你为什么MySQL用B+树做索引，就把这篇文章发给她](https://mp.weixin.qq.com/s?__biz=Mzg2NzA4MTkxNQ==&mid=2247486251&idx=1&sn=296f07b65b5a73a15337541fb4bc6572&key=e1d18effe01e13c43433cc33c5161f00872a430ca41b577f513fa082b7f46bd37471f7cfe2954afa430e0eaf04288da8b98daa275053c639d985c27ec0dd8b286dcf0196305776d4004cac349def25e0&ascene=1&uin=MTA4MTU0ODIyMg%3D%3D&devicetype=Windows+7&version=6208006f&lang=zh_CN&exportkey=AZxQ0x8eUrIpA2TZSIvCers%3D&pass_ticket=eYprKboj%2F%2FVkb9z2n1rVgrNb833slBE0lMIXwN27FvVBipjBM67fSOf2ZckEmBBo)
