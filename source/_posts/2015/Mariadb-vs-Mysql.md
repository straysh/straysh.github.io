---
title: Mariadb vs Mysql
date: 2015-10-07 10:47:45
tags: MySQL
categories:
- 博文
---
#### 遇到的问题 `Headers and client library minor version mismatch. Headers:50544 Library:50627`
```
CentOS Linux release 7.1.1503 (Core)
Linux y125 3.10.0-229.11.1.el7.x86_64 #1 SMP Thu Aug 6 01:06:18 UTC 2015 x86_64 x86_64 x86_64 GNU/Linux

;已安装的php以及mysql rpm包
root@lm01 ~]$rpm -qa|grep mysql
php56w-mysql-5.6.13-1.w7.x86_64
mysql-community-client-5.6.26-2.el7.x86_64
mysql-community-common-5.6.26-2.el7.x86_64
mysql-community-devel-5.6.26-2.el7.x86_64
mysql-community-libs-5.6.26-2.el7.x86_64
mysql-community-server-5.6.26-2.el7.x86_64
mysql-community-release-el7-5.noarch
root@lm01 ~]$rpm -qa|grep php
php56w-pdo-5.6.13-1.w7.x86_64
php56w-pecl-imagick-3.1.2-1.w7.x86_64
php56w-mysql-5.6.13-1.w7.x86_64
php56w-cli-5.6.13-1.w7.x86_64
php56w-mbstring-5.6.13-1.w7.x86_64
php56w-xml-5.6.13-1.w7.x86_64
php56w-intl-5.6.13-1.w7.x86_64
php56w-common-5.6.13-1.w7.x86_64
php56w-opcache-5.6.13-1.w7.x86_64
php56w-process-5.6.13-1.w7.x86_64
php56w-5.6.13-1.w7.x86_64
php56w-pear-1.9.4-2.w7.noarch

;php-mysqli扩展
mysqli

MysqlI Support => enabled
Client API library version => 5.6.26
Active Persistent Links => 0
Inactive Persistent Links => 0
Active Links => 0
Client API header version => 5.5.44-MariaDB
MYSQLI_SOCKET => /var/lib/mysql/mysql.sock
```

如上, php5.6我安装的是php56w-mysql, Client API header version和Mysql版本不一致,会提示如下错误:
```
Headers and client library minor version mismatch. Headers:50544 Library:50627
```

网上有人说使用php56w-mysqlnd可以解决问题,然而并没有什么卵用(或许是coreseek的sphinx源码bug?):
```
Warning: mysql_connect(): Server sent charset (0) unknown to the client

```

持续digging之下,感觉有以下途径或许可以尝试:
* 最简单的办法,但是尚未搜索到合适的答案,[可以参考这里](https://mariadb.com/kb/en/mariadb/installation-issues-with-php5/)
* 将mysql版本降至Mysql5.5,并重新编译php的mysql扩展
* 使用Mariadb替换Mysql

权衡之下,使用方案二.过程如下
```
yum remove mysql*
;rpm -qa|grep mysql 检查是否卸载干净了
;检查/etc/yum.repos.d/目录下有没有mysql*文件,删除之

yum -y install http://dev.mysql.com/get/mysql-community-release-el6-5.noarch.rpm
/etc/yum.repos.d/mysql-community.repo
;找到 Mysql5.5 section,将enabled=0修改为1,将其他Mysql源全部关闭,如下:

```

```
[mysql-connectors-community]
name=MySQL Connectors Community
baseurl=http://repo.mysql.com/yum/mysql-connectors-community/el/6/$basearch/
enabled=1
gpgcheck=1
gpgkey=file:/etc/pki/rpm-gpg/RPM-GPG-KEY-mysql

[mysql-tools-community]
name=MySQL Tools Community
baseurl=http://repo.mysql.com/yum/mysql-tools-community/el/6/$basearch/
enabled=1
gpgcheck=1
gpgkey=file:/etc/pki/rpm-gpg/RPM-GPG-KEY-mysql

# Enable to use MySQL 5.5
[mysql55-community]
name=MySQL 5.5 Community Server
baseurl=http://repo.mysql.com/yum/mysql-5.5-community/el/6/$basearch/
enabled=1
gpgcheck=1
gpgkey=file:/etc/pki/rpm-gpg/RPM-GPG-KEY-mysql

# Enable to use MySQL 5.6
[mysql56-community]
name=MySQL 5.6 Community Server
baseurl=http://repo.mysql.com/yum/mysql-5.6-community/el/6/$basearch/
enabled=0
gpgcheck=1
gpgkey=file:/etc/pki/rpm-gpg/RPM-GPG-KEY-mysql

# Note: MySQL 5.7 is currently in development. For use at your own risk.
# Please read with sub pages: https://dev.mysql.com/doc/relnotes/mysql/5.7/en/
[mysql57-community-dmr]
name=MySQL 5.7 Community Server Development Milestone Release
baseurl=http://repo.mysql.com/yum/mysql-5.7-community/el/6/$basearch/
enabled=0
gpgcheck=1
gpgkey=file:/etc/pki/rpm-gpg/RPM-GPG-KEY-mysql
```

接下来
```
yum install mysql mysql-devel mysql-server
```

Mysql5.5已经安装完毕,下一步,安装php的mysql扩展
```
yum install php56w-mysql
;不幸的事故再次发生
Package 1:mariadb-libs-5.5.44-1.el7_1.x86_64 is obsoleted by mysql-community-libs-5.5.46-2.el6.x86_64 which is already installed
```

忽然想起我的ubuntu上php也是5.6,而Mysql正好是5.5,直接拷贝so文件过来使用,但是编译过的default_socket位置不一致,于是
```
ln -s /var/lib/mysql/mysqld.sock /var/run/mysqld/mysqld.sock
;最后
systemctl restart httpd.service

mysqli

MysqlI Support => enabled
Client API library version => 5.5.46
Active Persistent Links => 0
Inactive Persistent Links => 0
Active Links => 0
Client API header version => 5.5.44
MYSQLI_SOCKET => /var/run/mysqld/mysqld.sock
```

问题暂时解决了!

后记: 降版本并不是最佳的选择, 以后还是要时常关注这方面的消息.或许迁移道Mariadb是更好的选择.