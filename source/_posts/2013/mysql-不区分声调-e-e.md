---
title: mysql 不区分声调 'e' 'é'
date: 2013-12-17 23:26:53
tags: MySQL
categories:
- 博文
---
<p>遇到这个问题的通常情况是数据字符涉及到多国语言。大家往往认为在创建数据库或表格时指定charset=utf8，数据库就能识别所有字符，结果实际情况却并非这样</p>
<p>mysql使用charset指定字符如果存储，却依靠另外一个参数--collation--来指定排序规则。这个collation正是mysql是否区分大小学，是否区分声调字符的关键。每个charset有一个默认collation。utf8的默认collation是utf8_general_ci，ci表示case insensitive，即不区分大小写。通过测试，该collation也不区分'e' 和'é'，'ü'和'u'。 而实际上绝大多collation都不区分，或者部分区分这些带声调或特殊地区的特殊字符。如果一个数据集必须保证区分这类字符，可以指定charset=utf8 collation=utf8_bin</p>