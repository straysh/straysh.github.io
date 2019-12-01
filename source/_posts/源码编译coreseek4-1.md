---
title: 源码编译coreseek4_1
date: 2015-09-07 13:49:53
tags: Sphinx
categories:
- 博文
---
# 准备工作
```bash
$yum install make gcc g++ gcc-c++ libtool autoconf automake imake mysql-devel libxml2-devel expat-devel
```

# 下载源代码
```bash
$wget http://www.coreseek.cn/uploads/csft/4.0/coreseek-4.1-beta.tar.gz
$tar zxf coreseek-4.1-beta.tar.gz
$cd coreseek-4.1-beta
$$ls
csft-4.1  mmseg-3.2.14  README.txt  testpack
```

# 安装mmseg
```bash
$cd mmseg-3.2.14
$./bootstrap    #输出的warning信息可以忽略，如果出现error则需要解决
$./configure --prefix=/usr/local/mmseg3
$make
$make install
$cd ..
```

# 安装coreseek
```bash
$cd csft-4.1
$sh buildconf.sh #按照官方文档执行该命令会报错.需要做以下修改:
```

1. vim buildconf.sh, 将 `&& automake --foreign \` 修改为 `&& automake --foreign --add-missing \`
2. vim configure.ac, 
将 `AM_INIT_AUTOMAKE([-Wall -Werror foreign])` 修改为 `AM_INIT_AUTOMAKE([-Wall foreign])`, 即删除 `-Werror`
并在 `AC_PROG_RANLIB` 的下一行加上 `AM_PROG_AR`
3. vim src/sphinxexpr.cpp 
将 `T val = ExprEval ( this->m_pArg, tMatch );` 修改为 `T val = this->ExprEval ( this->m_pArg, tMatch );`, 需修改3处
4. 重新执行 `sh buildconf.sh`

```bash
$./configure --prefix=/usr/local/coreseek  --without-unixodbc --with-mmseg --with-mmseg-includes=/usr/local/mmseg3/include/mmseg/ --with-mmseg-libs=/usr/local/mmseg3/lib/ --with-mysql
$make 
$make install
$cd ..
```

# 测试mmseg分词, coreseek搜索
```bash
$cd testpack
$cat var/test/test/xml #应该正确显示中文,否则需要设置字符集zh_CN.UTF-8
$mmseg -d /usr/local/mmseg3/etc var/test/test.xml #注意确保mmseg3/etc下有uni.lib, 且此处测试时test.xml引用的是相对路径
$indexer -c etc/csft.conf --all
$search -c etc/csft.conf 网络搜索
Coreseek Fulltext 4.1 [ Sphinx 2.0.2-dev (r2922)]
Copyright (c) 2007-2011,
Beijing Choice Software Technologies Inc (http://www.coreseek.com)

 using config file 'etc/csft.conf'...
index 'xml': query '网络搜索 ': returned 1 matches of 1 total in 0.000 sec

displaying matches:
1. document=1, weight=1590, published=Thu Apr  1 22:20:07 2010, author_id=1

words:
1. '网络': 1 documents, 1 hits
2. '搜索': 2 documents, 5 hits
```

# 开发环境样本配置文件
```bash
#
# Sphinx configuration file sample
#
# WARNING! While this sample file mentions all available options,
# it contains (very) short helper descriptions only. Please refer to
# doc/sphinx.html for details.
#

#############################################################################
## 商家索引 data source definition
#############################################################################

source restaurant_src
{
	type			= mysql
	sql_host		= localhost
	sql_user		= root
	sql_pass		= 123456
	sql_db			= lifemenu_restaurant
	sql_port		= 3306	# optional, default is 3306
	sql_query_pre   = SET NAMES UTF8

	sql_query_range = SELECT MIN(id),MAX(id) FROM restaurant_sphinx
    sql_range_step  = 10000
#    				CONCAT(suburb, ' ', postcode) as suburb_postcode \
	sql_query = select id, id as restaurant_id, restaurant_name, phone, price, rating,  \
    				city_id, address \
    			from restaurant_sphinx \
    			WHERE id>=$start AND id<=$end

    sql_field_string   = restaurant_name
    sql_field_string   = phone

#    sql_attr_multi = uint cuisine from ranged-query; \
#        SELECT restaurant_id as id, cuisine_id as cuisine FROM restaurant_cuisine WHERE id>=$start AND id<=$end; \
#        SELECT MIN(id), MAX(id) FROM restaurant_cuisine;
#    sql_attr_uint      = country_id
#    sql_attr_uint      = state_id
    sql_attr_uint      = city_id
#    sql_attr_string    = suburb_postcode
    sql_attr_uint      = price
    sql_attr_float     = rating
    sql_attr_string    = address
#    sql_attr_uint      = collected_amount
#    sql_attr_uint      = tabletalk_amount
}

#############################################################################
## index definition
#############################################################################

index restaurant_index
{
    source = restaurant_src
    path = /usr/local/coreseek/var/data/restaurant
    docinfo = extern
    mlock = 0
    morphology   = none
    min_word_len = 1
    dict=crc
    html_strip   = 0

    #以下配置为中文分词核心配置
    #stopwords = /path/to/stopwords.txt
    #uni.lib词典的制作 http://www.coreseek.cn/opensource/mmseg/
    charset_dictpath = /usr/local/mmseg3/etc/
    charset_type = zh_cn.utf-8
    # 中文分词中以下两行必须严格一致
    #charset_table = ...
    ngram_len = 0
}


#############################################################################
## indexer settings
#############################################################################

indexer
{
	# memory limit, in bytes, kiloytes (16384K) or megabytes (256M)
	# optional, default is 128M, max is 2047M, recommended is 256M to 1024M
	mem_limit		= 1024M

	# maximum IO calls per second (for I/O throttling)
	# optional, default is 0 (unlimited)
	#
	# max_iops		= 40


	# maximum IO call size, bytes (for I/O throttling)
	# optional, default is 0 (unlimited)
	#
	# max_iosize		= 1048576


	# maximum xmlpipe2 field length, bytes
	# optional, default is 2M
	#
	# max_xmlpipe2_field	= 4M


	# write buffer size, bytes
	# several (currently up to 4) buffers will be allocated
	# write buffers are allocated in addition to mem_limit
	# optional, default is 1M
	#
	# write_buffer		= 1M


	# maximum file field adaptive buffer size
	# optional, default is 8M, minimum is 1M
	#
	# max_file_field_buffer	= 32M


	# how to handle IO errors in file fields
	# known values are 'ignore_field', 'skip_document', and 'fail_index'
	# optional, default is 'ignore_field'
	#
	# on_file_field_error = skip_document


	# how to handle syntax errors in JSON attributes
	# known values are 'ignore_attr' and 'fail_index'
	# optional, default is 'ignore_attr'
	#
	# on_json_attr_error = fail_index


	# whether to auto-convert numeric values from strings in JSON attributes
	# with auto-conversion, string value with actually numeric data
	# (as in {"key":"12345"}) gets stored as a number, rather than string
	# optional, allowed values are 0 and 1, default is 0 (do not convert)
	#
	# json_autoconv_numbers = 1


	# whether and how to auto-convert key names in JSON attributes
	# known value is 'lowercase'
	# optional, default is unspecified (do nothing)
	#
	# json_autoconv_keynames = lowercase


	# lemmatizer cache size
	# improves the indexing time when the lemmatization is enabled
	# optional, default is 256K
	#
	# lemmatizer_cache = 512M
}

#############################################################################
## searchd settings
#############################################################################

searchd
{
    listen              = 9312
    listen			    = 127.0.0.1:9306:mysql41
    listen			    = 192.168.1.125:9307:mysql41
    read_timeout        = 5
    max_children        = 30
    max_matches         = 1000
    seamless_rotate     = 0
    preopen_indexes     = 0
    unlink_old          = 1

    #query_log_format	= sphinxql

    pid_file            = /usr/local/coreseek/var/log/searchd.pid
    log                 = /usr/local/coreseek/var/log/searchd.log
    query_log           = /usr/local/coreseek/var/log/query.log
    binlog_path         = # disable binlog

    #覆盖默认参数,因为以下参数已经废弃
    compat_sphinxql_magics = 0
}

#############################################################################
## common settings
#############################################################################

# --eof--

```

参考资料:
* [coreseek常见问题](http://www.coreseek.cn/products-install/faq/#qa1)
