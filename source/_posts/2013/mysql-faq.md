---
title: mysql_faq
date: 2013-12-22 21:15:48
tags: MySQL
categories:
- 博文
---
#### int(5) 的含义，存储时使用多岁字节？最大能存放的数是多少？

以前，为一直认为int(5)表示最多能存放5个字符长的数字，即99,999能存进去，但是100,000会被截断。又例如当我们有一个字段is_onuse(1)，它有2个值0/1表示禁用/启用，我也一直认为这样定义字段会节省空间。

但实际上，这些“认为”都是想当然的，都是错误的。在MySQL中数值类型的存储空间是预定义的，例如对于tinyint(1)来说，不论你存储的是0还是1还是100，它都是占用一个字节的空间（当然超过127会被截断）。对于int(5)，同样的，不论99,999还是100,000都是占用4个字节的空间。从这点上看，与字符串的定义varchar(5)是截然不同的两个概念（varchar(5)的确是只能存储5个字符）。详细的官方文档，请点击查看
#### mysql 不区分声调 'e' 'é'

遇到这个问题的通常情况是数据字符涉及到多国语言。大家往往认为在创建数据库或表格时指定charset=utf8，数据库就能识别所有字符，结果实际情况却并非这样

mysql使用charset指定字符如果存储，却依靠另外一个参数--collation--来指定排序规则。这个collation正是mysql是否区分大小学，是否区分声调字符的关键。每个charset有一个默认collation。utf8的默认collation是utf8_general_ci，ci表示case insensitive，即不区分大小写。通过测试，该collation也不区分'e' 和'é'，'ü'和'u'。 而实际上绝大多collation都不区分，或者部分区分这些带声调或特殊地区的特殊字符。如果一个数据集必须保证区分这类字符，可以指定charset=utf8 collation=utf8_bin

例如：
```sql
CREATE TABLE data_state(
id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
country VARCHAR(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
state VARCHAR(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
url VARCHAR(255) NOT NULL,
c_time INT UNSIGNED DEFAULT '0'
)ENGINE=MYISAM DEFAULT CHARSET=utf8;
CREATE TABLE data_city(
id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
state_id INT UNSIGNED NOT NULL,
city VARCHAR(32) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
url VARCHAR(255) NOT NULL,
c_time INT UNSIGNED DEFAULT '0'
)ENGINE=MYISAM DEFAULT CHARSET=utf8;
```

#### 查看MySQL当前连接数
1) 
```bash
straysh ~]$mysqladmin status
Uptime: 17863  Threads: 1  Questions: 2932  Slow queries: 0  Opens: 57  Flush tables: 1  Open tables: 50  Queries per second avg: 0.164
```

2) 
```bash
mysql> show status like 'Conn%';
+-----------------------------------+-------+
| Variable_name                     | Value |
+-----------------------------------+-------+
| Connection_errors_accept          | 0     |
| Connection_errors_internal        | 0     |
| Connection_errors_max_connections | 0     |
| Connection_errors_peer_address    | 0     |
| Connection_errors_select          | 0     |
| Connection_errors_tcpwrap         | 0     |
| Connections                       | 281   |
+-----------------------------------+-------+
7 rows in set (0.00 sec)
```

#### ERROR 1054 (42S22): Unknown column 'plugin' in 'mysql.user'
see [MySQL service stops after trying to grant privileges to a user](http://dba.stackexchange.com/questions/78923/mysql-service-stops-after-trying-to-grant-privileges-to-a-user/78927#78927)

to be continue. .. ...