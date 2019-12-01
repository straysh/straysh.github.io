---
title: Sphinx进阶
date: 2015-07-20 13:40:49
tags: Sphinx
categories:
- 博文
---
# 安装
1. 在官网下载[源码包](http://sphinxsearch.com/downloads/release/)
2. 解压,然后就是常规的源码编译:

```bash
$ tar xzvf sphinx-2.2.8-release.tar.gz
$ cd sphinx
$ ./configure
$ make
$ make install
```

在执行`./configure`的时候,可以指定一些选项,这些选项可以通过 `--help`来查看.最重要的一些选项是:

* `--prefix` 指定了要将sphinx安装到何位置,例如 `--prefix=/usr/local/sphinx`
* `--with-mysql` 指定了在自动检测失败时,到何处可以找到MySQL的include和library文件.
* `--with-static-mysql` 将Sphinx编译为使用静态Mysql链接.
* `--with-pgsql` 使用PostgreSQL
* `--with-static-pgsql` 使用静态PostgreSQL

编者注: 本文使用SphinxQL方式,不需要在php上再编译sphinxClient扩展,而是使用php-mysql扩展.

# Sphinx快速使用指南
假定sphinx安装于目录`/usr/local/sphinx`中(下文相同)
```
$ cd /usr/local/sphinx/etc
$ cp sphinx.conf.dist sphinx.conf
$ vi sphinx.conf
$ mysql -u test < /usr/local/sphinx/etc/example.sql
$ cd /usr/local/sphinx/etc
$ /usr/local/sphinx/bin/indexer --all
$ mysql -h0 -P9306
SELECT * FROM test1 WHERE MATCH('my document');
INSERT INTO rt VALUES (1, 'this is', 'a sample text', 11);
INSERT INTO rt VALUES (2, 'some more', 'text here', 22);
SELECT gid/11 FROM rt WHERE MATCH('text') GROUP BY gid;
SELECT * FROM rt ORDER BY gid DESC;
SHOW TABLES;
SELECT *, WEIGHT() FROM test1 WHERE MATCH('"document one"/1');SHOW META;
SET profiling=1;SELECT * FROM test1 WHERE id IN (1,2,4);SHOW PROFILE;
SELECT id, id%3 idd FROM test1 WHERE MATCH('this is | nothing') GROUP BY idd;SHOW PROFILE;
SELECT id FROM test1 WHERE MATCH('is this a good plan?');SHOW PLAN;
SELECT COUNT(*) c, id%3 idd FROM test1 GROUP BY idd HAVING COUNT(*)>1;
SELECT COUNT(*) FROM test1;
CALL KEYWORDS ('one two three', 'test1');
CALL KEYWORDS ('one two three', 'test1', 1);
```

# 全文索引|Full-text fields
全文本字段(或简称字段),是被Sphinx索引的文档中的文字内容,并可以通过关键字来快速搜索.

字段是命名的,可以限制只搜索一个字段(例如搜索'title'字段)或者多个字段(如仅'title'和'abstract'字段).Sphinx的索引结构最多支持256个字段.但,<=2.0.1-beta,被强制限制为32个字段.

注意,字段用之来构建全文索引(一个特殊的数据结构,用来通过关键字快速搜索), 其原始内容不会存储在索引中.之后原始的文本内容就被丢弃了.这些原始的内容需要到数据源中(MySQL)中重新查询.

另外,想要重构原始文本内容是不可能的,因为指定的(配置文件中指定的)空白字符/大小写/标点符号在建立索引时都被丢失了.

# 属性|Attributes
`属性`是和文档关联的额外的值,可以用来过滤和排序.

全文检索通常不仅仅是匹配文档id和相关度的排序(rank), 还要处理基于每个文档的许多参数.例如,希望先按时间再按相关度排序来显示新闻,或者在指定的价格区间搜索商品,或限制搜索指定用户发布的博客,或者按照月份分组.为了高效的做到这一点,Sphinx允许向每个文档添加一系列的`属性`,并在全文索引中存储这些`属性`的值.然后就可以使用这些值在全文搜索时来过滤/排序/分组.

`属性`与`索引`不同,他们不是全文索引的.他们存储在索引中,但不能将他们当做全文索引来搜索,尝试这样做会引发错误.

例如,假设`column`列是`属性`,则不能使用`@column 1`来搜索`column`值为1的文档. `and this is still true even if the numeric digits are normally indexed.`

`属性`可以用来做过滤,限制返回的行数,同样也可以做排序或者结果分组.简单的基于`属性`的排序,且不使用相关度工具是完全可行的.另外,`属性`会通过`search daemon`返回,而`索引`则不会.

对于`属性`的最佳例子是论坛的post表.假设只有`title`和`content`字段需要全文检索,但有时也需要检索特定用户或子论坛的帖子.或者按照发布日期排序.或者按照发布日期来分组检索的结果并计算每个分组的数量.

# 多值属性|MVA (multi-valued attributes)
`多值属性`是Sphinx中非常重要的文档`属性`.`多值属性`可以给文档添加数值集合.用来实现文章标签/商品分类非常合适.在`多值属性`上可以过滤/分组(排序不能).

集合的规模是无限制的,只要内存允许你可以添加.(包含MVA的.spm文件会在searchd预缓存到内存中).MVA的数据源可以是独立的查询或者文档的字段.对于第一种方式,查询需要返回一对值:文档id和MVA值,第二种方式字段会被解析为整数.对输入的数据的顺序完全没有要求.在构建索引时,MVA值会被自动按照文档id分组(并在内部排序).

过滤时,MVA值中的任意一个符合过滤条件,文档就会被匹配.(因此,对于排他过滤器,返回的文档不会包含任何被禁止的值).


**TODO**
---

http://wenku.baidu.com/view/4ebf3505bed5b9f3f90f1caf.html
http://www.douban.com/group/topic/30286342/

试了一下，美团前台的搜索是索引了套餐的标题（包括网站编辑加上的部分）、店名、地址，其中套餐标题拆词也能搜到相应结果，而地址拆词搜不到。应该是用了两种方式，地址部分经过了分词用的是类似Xunsearch的分词索引插件，标题和店名是Sphinx之类的全文索引。

后台借了个账号看了下，单子、商家、套餐，都是按地址和标题搜索，和前台用的一个搜索接口，只是多个了ID。

考虑到Mongo对全文检索的响应速度，折中的解决方法是分词入MySQL，准确率一般，完美的方法只能是整合搜索引擎。热门、推荐、位置类别那些都好说。


---

商品搜索的话，这个重点在于商品页面的主题提取 和 查询推荐

再具体点就是对每个页面抽取主题、关键词

比如上面例子如果能发现页面主题是“衣服”，归类到服饰类别

然后搜索面膜时，主动就给分类到“化妆品”类了

通过在搜索结果的相关性排序中加入类别参数，不能保证完全不出现，但是可以通过权重让靠谱的结果出现在前边

ps：如果是问sphinx里面怎么操作的话，没有具体用过

直接简单的文本聚类、分类算法就行，也可以去搞一个商品分类语料库