---
title: 'PHP 5.4 on CentOS/RHEL 7.0, 6.5 and 5.10 via Yum'
date: 2014-11-17 13:46:09
tags: PHP
categories:
- 博文
---
###PHP 5.4 on CentOS/RHEL 7.0, 6.5 and 5.10 via Yum###
[原文](https://webtatic.com/packages/php54/)

PHP 5.4.33 has been released on PHP.net on 18th September 2014, and is also available for CentOS/RHEL 5.10 and 6.5 at Webtatic via Yum.

 **Update 2013-07-21** – A new package “php54w-mysqlnd” has been added as an alternative to “php54w-mysql”. This will instead provide mysql, mysqli, and pdo_mysql built against the PHP MySql native driver rather than the system default libmysqlclient. It will replace “php54w-mysql55″, as it will work with MySQL 5.0/5.1/5.5 server)    
 **Update 2013-06-20** – Webtatic now has released [PHP 5.5.0 for CentOS/RHEL 5 and 6](https://webtatic.com/packages/php55/)  
 **Update 2013-05-26** – CentOS/RHEL 5.x now supported.  
 **Update 2013-05-18** – A new package “php54w-pecl-zendopcache” has been added, Zend Optimizer Plus opcode cache. 
 **Update 2012-08-26** – APC is stable enough now and so the extension has been added  
 **Update 2012-07-22** – memcache and xdebug extensions have been added  
 **Update 2012-04-29** – mcrypt, tidy, mssql, interbase have been added back in to the repository.  

PHP 5.4.0 adds new features such as:

* Traits
* Built-in web server
* Array short notation
* Array return value de-referencing
* Finally killing off magic-quotes and safe-mode

To see what else has been added, check out the [changelog](http://php.net/ChangeLog-5.php).

To install, first you must add the Webtatic EL yum repository information corresponding to your CentOS/RHEL version to yum:

CentOS/RHEL 7.x:
```bash
rpm -Uvh https://mirror.webtatic.com/yum/el7/epel-release.rpm
rpm -Uvh https://mirror.webtatic.com/yum/el7/webtatic-release.rpm
```

CentOS/RHEL 6.x:
```bash
rpm -Uvh https://mirror.webtatic.com/yum/el6/latest.rpm
```

CentOS/RHEL 5.x:
```bash
rpm -Uvh https://mirror.webtatic.com/yum/el5/latest.rpm
```

Now you can install php by doing:
```bash
yum install php54w
```

If you would like to upgrade php to this version it is recommended that you check that your system will support the upgrade, e.g. making sure any CPanel-like software can run after the upgrade.

Unless you know what you are doing, it is risky upgrading an existing system. It’s much safer to do this by provisioning a separate server to perform the upgrade as a fresh install instead.

If you know what you are doing, you can upgrade PHP by:
```bash
yum install yum-plugin-replace
 
yum replace php-common --replace-with=php54w-common
```

It will likely give you a message “WARNING: Unable to resolve all providers …”. This is normal, and you can continue by tying “y“. You will be given a chance to see what packages will be installed and removed before again being given a chance to confirm.
Packages

>**Package** Provides  
**php54w** 	mod_php, php54w-zts  
**php54w-bcmath** 	
**php54w-cli 	php-cgi, php-pcntl, php-readline
**php54w-common 	php-api, php-bz2, php-calendar, php-ctype, php-curl, php-date, php-exif, php-fileinfo, php-ftp, php-gettext, php-gmp, php-hash, php-iconv, php-json, php-libxml, php-openssl, php-pcre, php-pecl-Fileinfo, php-pecl-phar, php-pecl-zip, php-reflection, php-session, php-shmop, php-simplexml, php-sockets, php-spl, php-tokenizer, php-zend-abi, php-zip, php-zlib  
**php54w-dba** 	
**php54w-devel** 	
**php54w-embedded** 	php-embedded-devel  
**php54w-enchant** 	
**php54w-fpm** 	
**php54w-gd** 	
**php54w-imap** 	
**php54w-interbase** 	php_database, php-firebird  
**php54w-intl**	
**php54w-ldap** 	
**php54w-mbstring** 	
**php54w-mcrypt** 	
**php54w-mssql** 	
**php54w-mysql** 	php-mysqli, php_database  
**php54w-mysqlnd** 	php-mysqli, php_database  
**php54w-odbc** 	php-pdo_odbc, php_database  
**php54w-pdo**	
**php54w-pecl-apc**	
**php54w-pecl-gearman**	
**php54w-pecl-geoip** 	
**php54w-pecl-memcache** 	
**php54w-pecl-zendopcache** 	
**php54w-pecl-xdebug**	
**php54w-pgsql** 	php-pdo_pgsql, php_database  
**php54w-process** 	php-posix, php-sysvmsg, php-sysvsem, php-sysvshm  
**php54w-pspell** 	
**php54w-recode** 	
**php54w-snmp** 	
**php54w-soap**	  
**php54w-tidy** 	 
**php54w-xml** 	php-dom, php-domxml, php-wddx, php-xsl  
**php54w-xmlrpc** 	

Opcode Caches

A precompiled PHP APC package is available as an opcode cache, which is recommended for performance reasons. It can be installed via:
```shell
yum install php54w-pecl-apc
```

Zend have now released Zend Optimizer Plus opcode cache as open source, and is now known as Zend OPcache. As it’s more actively maintained than APC, it has been added as a package to the Webtatic EL6 repository. It can be installed via:

```shell
yum install php54w-pecl-zendopcache
```

#####error_reporting E_ALL now includes E_STRICT#####

You may get a lot more errors coming out of your error logs if by default your error_reporting is set to E_ALL now without explicitly turning off E_STRICT. The default php.ini that comes with the PHP package turns this off by default, but if you are upgrading from an existing installation, your php.ini may not be updated, meaning this will likely be turned on.

***
<h1 class="justcenter">Cent-OS 6 安装LAMP 精简版本</h1>
```shell
# 更新Linux到最新内核
yum update -y

# 安装时间同步
yum install ntpdate
# 同步时间
ntpdate 210.72.145.44

# CentOS6 增加PHP5.4源（推荐）
rpm -Uvh http://mirror.webtatic.com/yum/el6/latest.rpm
# CentOS5 增加PHP5.4源
rpm -Uvh http://mirror.webtatic.com/yum/el5/latest.rpm

# 安装LAMP
yum install php54w.x86_64 php54w-cli.x86_64 php54w-devel.x86_64 php54w-intl.x86_64 php54w-mysqlnd.x86_64 php54w-pdo.x86_64 php54w-soap.x86_64 php54w-tidy.x86_64 php54w-xml.x86_64 php54w-xmlrpc.x86_64 php54w-zts.x86_64 php54w-gd.x86_64 php54w-mbstring.x86_64 php54w-pecl-apc.x86_64 php54w-mcrypt.x86_64 httpd.x86_64 httpd-devel.x86_64 httpd-tools.x86_64 mysql.x86_64 mysql-devel.x86_64 mysql-server.x86_64 vsftpd.x86_64 unzip.x86_64 -y

# 添加自启动
chkconfig httpd on
chkconfig mysqld on

# 启动Apache和mysql
service httpd start
service mysqld start
# 当然要简单直接
reboot
```

***
参考：
[sudo apt-get install lamp-server^](https://help.ubuntu.com/community/ApacheMySQLPHP "Ubuntu安装LAMP官方指南")
[CentOS6.3关于LAMP的配置apache-2.4.3、php-5.4.7、phpMyAdmin3.5(系列博文) ](http://blog.csdn.net/damaibao/article/details/8057860)