---
title: mysql导出select结果到文件
date: 2013-12-16 09:54:22
tags: MySQL
categories:
- 博文
---
```sql
mysql -h{ip} -u{account} -p -e "query statement" db > file 
```
例如：
```sql
mysql -uroot -p -e "select * from a" test > 1.txt
```
这样会输出列名信息，如果不想输出列名信息： 
```sql
mysql -uroot -p -Ne "select * from a" test > 1.txt 
或
root>mysql -uroot -p test 
>select * from table into outfile '1.txt'; 
```

两种方法效果一样的  
第二种方式的mysql文档：  
```sql
SELECT [select options go here] INTO {OUTFILE | DUMPFILE} filename 
EXPORT_OPTIONS 
FROM table_references [additional select options go here] 
```

例如：
```sql
mysql -uroot -p 
select * from a into outfile "1.txt" fields terminated by '\t' lines terminated by '\r\n' 
```
第一种方法和第二种方法的结合：使用 mysql -e执行导出到文件的sql语句 

`mysql -hxx -uxx -pxx -e "query statement" db`

例如:  
```sql
mysql -uroot -p -e"select * from a into outfile '1.txt' fields terminated by ',' lines terminated by '\r\n'" test
```

如果不想输出列名信息：
```sql
mysql -uroot -p -Ne"select * from a into outfile '1.txt' fields terminated by ',' lines terminated by '\r\n'" test
```
默认情况下， mysql -e导出的文件，列是用"\t"分隔，行是用"\r\n"分隔(windows)，行是用"\n"分隔(unix)

追加一种方式：
```sql
select col002,col005,col004,col008 
    into outfile 'e:/mysql/i0812.txt' fields terminated by '|' lines terminated by '\r\n' 
from test where col003 in (select col001 from qdbm) order by col005;
```