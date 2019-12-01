---
title: mysql_MySQL权威指南笔记（一）
date: 2013-09-29 10:44:10
tags: MySQL
categories:
- 博文
---
### SELECT语句的常用元素
* Literal
* Expression
* Column specification
* User variable
* System variable
* Case expression
* Scalar function
* Null value
* Cast expression
* Compaund expression
* Row expression
* <a href='#table-expression' />Table expression</a>
* Aggregation function
<a name='table-expression'></a>

一个table expression通常得到一个值，该表达式用在SELECT中以及SELECT语句的WHERE子句中。

我们通常按照表达式的数据类型或其值的复杂性或其形式来给表达式分类。表达式的数据类型和MySQL的数据类型是一致的，也包含数值型、字符型、时间型、十六进制和布尔类型。这时，表达式有一个确定的值，我们称其为标量scalar value。在按复杂性分类时，这些scalar value所表示的表达式被成为scalar expression。除此之外，还有row expression和table expression。需要注意的是，row expression是列表(有序)，而table expression是集合(无序)

表达式的第三种划分方式是以上面两种为基础的。通常来说，带有运算符的表达式就是compaund expression。与之对应的是单一表达式singular expression。在MySQL中table expression是可复合的(如只用UNION关键字)，而row expression是不可复合的。

### SELECT语句的定义

```sql
<select statement> ::=
	<table expression>

<table expression> ::=
	<select block head> [<select block tail>]

<select block head> ::=
	<select clause>
	[<from clause>
		[<where clause>][<group by clause>][<having clause>]]

<select block tail> ::=
	[<order by clause>][limit clause]
```

下面我们来分析一下SQL语句的执行过程。
```sql
SELECT `id`,`name`//最后一步，select子句从结果集中抽取指定的列，形成最终的结果集并返回
FROM `stu`//第一步，from子句指定了查询范围，并copy出一张临时表
WHERE `age`>18//第二步，where子句过滤出符合条件的row，缩小的临时表
GROUP BY `classid`//第三步，group by子句按指定的字段分组，这些字段在临时表中是唯一的，其他字段会形成列表
HAVING count(*)>1//第四步，having子句再次过滤出符合条件的row，缩小了临时表
ORDER BY `id`//第五步，order by子句把临时表按指定的字段排序，只改变了临时表的row顺序，不改变最终的结果集
LIMIT 10//第六步，limit子句从结果集中抽取指定的rows
```

上面的SQL语句最终的结果集就是一个table expression，就像之前说的，a table expression is a collection of rows。table expression的定义如下：
```sql
<table expression> ::=
	{<select block head>|(<table expression>)|<compaund table expression>}[select block tail]

<compaund table expression> ::=
	<table expression><set operator><table expression>

<set operator> ::= UNION
```
一个table expression可以是一条SELECT语句(singular expression)或者使用()括号将自身包起来，再或者是多个table expression使用一些关键字来复合(eg:UNION)，也就是所谓的compaund expression。而在使用UNION时，必须保证两个表表达式的度是相同的(列数相同)。

一个table expression可以调用另一个table expression(subquery或subselect)。理论上讲，table expression的嵌套可以是无限的。

```sql
SELECT *
	FROM (SELECT *
		FROM (SELECT *
			FROM (SELECT *
				FROM `stu`) AS tmp1) AS tmp2) AS tmp3
```
根据子查询返回的结果集的类型，子查询又被分为table subquery(返回的是table expression)、row subquery(返回的row expression)、column subquery(返回的是只有一列的row expression)、scalar subquery(返回值是一行一列，即一个标量)

### SELECT语句：FROM子句
一个table expression通常是从FROM子句开始执行的。除非它没有FROM子句，例如：select 1+2。FROM子句的定义如下：
```sql
<from clause> ::=
	FROM <table reference>[,<table reference>]...

<table reference> ::=
	<table specification>[[AS] <pseudonym>]
<table specification> ::=[<database name> . ]<table name>
<pseudonym> ::=<alias name>
```
定义看起来很复杂，用过MySQL的同学都知道这是很简单的。上面这段相当于：FROM 数据库名.表明 [AS] 别名。AS关键字可以省略。

上面这些规则同样适用于SELECT子句中的列。例如：SELECT 数据库名.表名.列名。需要注意的是，这些限定词都是可以使用别名替代的。例如：
```sql
SELECT `testdb`.`stu`.`id` FROM `testdb`.`stu` WHERE `id`=1
SELECT s.`id` FROM `testdb`.`stu` 's' WHERE `id`=1
SELECT s.`id` FROM `testdb`.`stu` AS 's' WHERE `id`=1
错误：SELECT s.`id` 'sid' FROM `testdb`.`stu` AS 's' WHERE sid=1
//在同一个select block head中列别名是不可用的
```
最后，剩下FROM子句的一个难点，JOIN。具体看下图的分析，应该比较明了了。页面太长了 - -、，换下一章。
![join详解](/images/mysql_join.jpg)