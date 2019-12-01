---
title: Configuring MySQL To Use UTF-8
date: 2013-12-10 10:02:26
tags: MySQL
categories:
- 博文
---
<p>A project I’m working on at the moment is going to have multiple language options available, not all of which use the same alphabet (e.g. Russian and Chinese).</p>
<p>
To lessen the pain commonly associated with internationalisation on the web, it’s beneficial to use the UTF-8 character set. This short summary from the Unicode Consortium may help explain better;</p>
<p>
Unicode provides a unique number for every character, no matter what the platform, no matter what the program, no matter what the language. … Unicode enables a single software product or a single website to be targeted across multiple platforms, languages and countries without re-engineering. It allows data to be transported through many different systems without corruption</p>
<p>
Thankfully MySQL has supported Unicode for quite some time now, even if it’s not configured to use it by default.</p>
<p>
First, let’s check what our settings are at the moment;</p>
```sql
mysql> SHOW VARIABLES LIKE 'collation%';
+----------------------+-------------------+
| Variable_name        | Value             |
+----------------------+-------------------+
| collation_connection | latin1_swedish_ci |
| collation_database   | latin1_swedish_ci |
| collation_server     | latin1_swedish_ci |
+----------------------+-------------------+
3 rows in set (0.01 sec)
mysql> SHOW VARIABLES LIKE 'character_set%';
+--------------------------+----------------------------+
| Variable_name            | Value                      |
+--------------------------+----------------------------+
| character_set_client     | latin1                     | 
| character_set_connection | latin1                     | 
| character_set_database   | latin1                     | 
| character_set_filesystem | binary                     | 
| character_set_results    | latin1                     | 
| character_set_server     | latin1                     | 
| character_set_system     | utf8                       | 
| character_sets_dir       | /usr/share/mysql/charsets/ | 
+--------------------------+----------------------------+
8 rows in set (0.00 sec)
```
That’s to be expected, but it’s not really what we wanted.
<p>
Find your MySQL configuration file (on most Linux/BSD systems it’s /etc/my.cnf) and make sure it’s got the following statements under the relevant headers.</p>
```sql
[mysqld]
default-character-set=utf8
default-collation=utf8_general_ci
character-set-server=utf8
collation-server=utf8_general_ci
init-connect='SET NAMES utf8'

[client]
default-character-set=utf8
```
Restart MySQL and make sure it’s working;
<p>
service mysql restart</p>
```sql
mysql> SHOW VARIABLES LIKE 'collation%';
+----------------------+-----------------+
| Variable_name        | Value           |
+----------------------+-----------------+
| collation_connection | utf8_general_ci | 
| collation_database   | utf8_general_ci | 
| collation_server     | utf8_general_ci | 
+----------------------+-----------------+
3 rows in set (0.00 sec)
```

```sql
mysql> SHOW VARIABLES LIKE 'character_set%';
+--------------------------+----------------------------+
| Variable_name            | Value                      |
+--------------------------+----------------------------+
| character_set_client     | utf8                       | 
| character_set_connection | utf8                       | 
| character_set_database   | utf8                       | 
| character_set_filesystem | binary                     | 
| character_set_results    | utf8                       | 
| character_set_server     | utf8                       | 
| character_set_system     | utf8                       | 
| character_sets_dir       | /usr/share/mysql/charsets/ | 
+--------------------------+----------------------------+
8 rows in set (0.00 sec)
```
Update: Demonstrating setting the charset and collation when creating tables, as suggested by Mo:
```sql
CREATE TABLE `content` (
  `id` int(11) NOT NULL auto_increment,
  `language` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `title` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL default '',
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM CHARACTER SET utf8 COLLATE utf8_general_ci;
```