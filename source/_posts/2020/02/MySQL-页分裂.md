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
假设有张表名为`windmills`，其数据文件目录结构可能如下：
```
data/
  windmills/
      wmills.ibd
      wmills.frm
```

数据存储在一个叫`wills.ibd`的文件中。该文件由N个`segments`组成，每个`segments`都关联着索引。

在删除数据行是，该文件的尺寸不会改变，`segment`自身会增大或缩小取决于其名为`extent`的子元素。一个`extent`只能存在于`segment`中并且固定大小为1MB（若page是默认页大小时）。一个`page`是`extent`的子元素且有默认16KB的大小。

因此，`extent`最多有64`pages`。一个页可以包含2~N的数据行。具体的行数取决于行的大小（在表结构中定义了）。Innodb中有一个强制固定，即一个页至少要包含两个数据行，由此有了另一个规定：数据行不能超过8000字节。
![segment-extent-page](/images/mysql/segment_extent-e1491345857803.png)
