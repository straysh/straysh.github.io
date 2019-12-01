---
title: Scrapy爬虫系列-预备篇
date: 2016-07-14 11:31:02
tags: PHP
---
以前一直是在Web开发框架下(YII、Laravel)的Console模块中开发自己的爬虫,再结合shell脚本,发起多进程并发抓取数据.这一套下来,复杂且艰难之处在于要在shell和php之间来回调试,并且我对shell的错误处理甚是粗陋,再加上诸如`find`、`grep`、`awk`各种命令的参数繁多,整个开发的过程痛并快乐着.

最近开始研究python的爬虫框架Scrapy.与专业的爬虫框架相比,我以前的工作模式说是刀耕火种都不为过呀!

我会有数篇文章来记录Scrapy的学历历程,但是首先,介绍一些预备知识(不涉及语言本身)


## 一、 新人不要使用virtualenv
virtualenv很好用.但是对新人而言,费时费力的维护不同版本的python就是舍本逐末的行为.在安装virtualenv之前请先执行`python --version`检查系统自带的pytohn版本.若是`2.7.*`,就直接使用系统的python就好了;否则安装[2.7版本的python](https://www.python.org/downloads/release/python-2712/).

**P.S.:为什么要**`2.7.*`,因为Scrapy[只支持pyton2.7](http://scrapy-chs.readthedocs.io/zh_CN/0.24/faq.html)
> Scrapy支持那些Python版本？
>   
> Scrapy仅仅支持Python 2.7。 Python2.6的支持从Scrapy 0.20开始被废弃了。

## 二、python中的编码问题unicode/utf-8/gbk/ascii
#### 1. 什么是ASCII
ASCII(美国信息交换标准代码),最后一次更新则是在1986年，至今为止共定义了128个字符,包括26个基本拉丁字母、阿拉伯数目字和英式标点符号.并且最多只能表示256个字符.`ascii`是单字节的

#### 2.什么是gbk
256个字符显然不可能支持中文、俄文、韩文、日文等,所以几乎每个语言都有自己的一套编码标准,例如GBK\*/BIG\*.`gbk`是两字节的.

#### 3.什么是utf-8
各个语言各自有一套编码标准,但是各个标准之间是不兼容的.utf-8解决了这个问题,世界一统,大家都用utf-8.`utf-8`是(最多)三字节的.除了`utf-8`,还有`utf-16`,`utf-32`

#### 4.什么是unicode
其实上面说的不太准确,世界一统的字符集叫`unicode`,理论上unicode可以无限扩充.但unicode有个致命缺点:浪费存储空间!所以才有了utf-8,`utf-8`是为了解决这个问题,对`unicode`的`传输`和`存储`的规则.然而对于我们面向应用的开发者,保持utf-8整齐划一就可以了,不需要再向上操作unicode.

#### 5.python中的unicode/utf-8
按上文所述,`unicode`才是真正的字符串, `utf-8`是更底层的存储格式用可阅读的形式(humanreadable)打印出来的字符串.因此,在python中:
* unicode->encode('utf-8')得到普通字符串 是正确的
* 普通字符串->decode('utf-8')得到unicode字符串 是正确的
* 对`unicode`字符串`decode('utf-8')` 是错误的!!
* 对普通字符串`encode('utf-8')` 也是错误的!!
```python
# coding=utf-8
foo = u'中'  # unicode字符串
print repr(foo)  # u'\u4e2d'
print len(foo)   # 1
print repr(foo.encode('utf-8'))  # '\xe4\xb8\xad'
print len(foo.encode('utf-8'))   # 3
```

## 三、为了全部统一使用utf-8,我们应该做什么?--python和mysql之间的编码问题
* 首先在python文件首行添加`# coding=utf-8`
* 连接数据库时,指定`charset=utf-8`
* 连接数据库后,立即执行`set names utf-8`
* mysql的配置文件中,理论上是不需要更改的(在每一处需要指定字符集的地方都显示的指定utf-8),但为避免疏漏出错,你需要
```mysql
[mysqld]
character-set-server=utf8
collation-server=utf8_general_ci
```
## 四、 `Incorrect string value: '\xF0\x9F\x98\x82' for column ...` 或者 `Invalid utf8 character string: 'F09F98'`
这是Mysql在处理四字节的`utf-8`字符串造成的错误.`Mysql>=5.5`开始,声称解决了这个问题:增加了一个叫做`utf8mb4`的编码.utf8mb4是扩充之后的unicode,实际上还是utf8,同php、python2.7中的utf8.

换句话说,若需要支持`utf8mb4`,在php和python中你不需要做任何更改,仍然正常使用`utf-8`即可;但是在mysql中你需要: **在建表语句中明确表示使用`utf8mb4`**
```sql
create table demo_douban_book.all_books (
    ... ...
)engine=innodb default charset=utf8mb4 collate utf8mb4_unicode_ci;
```
需要特别注意的是, 使用了utf8mb4之后,会对索引产生影响(mysql对索引有最大字节长度限制,而使用utf8mb4在相同字节长度下字符个数却少了)

另外,如果遇到了`LookupError: unknown encoding: utf8mb4`这个错误,连接数据库之前:
```python
import codecs
codecs.register(lambda name: codecs.lookup('utf8') if name == 'utf8mb4' else None)
```
因为根本没有utf8mb4这种东西,需要给它加个别名,告诉python`utf8mb4`就是`utf-8`
