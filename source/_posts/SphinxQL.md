---
title: SphinxQL
date: 2015-07-20 13:41:17
tags: Sphinx
---
# 配置文件
参考页底的配置文件

# 命令行方式
```bash
$mysql -h127.0.0.1 -P9306
mysql> SELECT * FROM `restaurant_index` WHERE MATCH('(@name a)') ORDER BY `id` ASC LIMIT 0, 10;
+------+--------------------------------+--------------------------------+-------+----------+------------------+------------------+----------+----------+------------+---------+
| id   | name                           | social_name                    | price | rating   | collected_amount | tabletalk_amount | city     | state_id | country_id | cuisine |
+------+--------------------------------+--------------------------------+-------+----------+------------------+------------------+----------+----------+------------+---------+
|  150 | A Bite To Eat, A Drink As Well | A Bite To Eat, A Drink As Well |     2 | 4.400000 |           691623 |           885097 | Chifley  |        1 |          1 | 5,25,28 |
|  437 | Just a Bite                    | Just a Bite                    |     1 | 0.600000 |           835971 |           913061 | Mawson   |        1 |          1 | 5,6     |
|  886 | Wok In A Box Canberra          | Wok In A Box Canberra          |     1 | 0.300000 |            80784 |           124537 | Canberra |        1 |          1 | 2,12,25 |
|  902 | A. Baker                       | A. Baker                       |     3 | 3.300000 |           593557 |           197168 | Canberra |        1 |          1 | 7,22    |
| 1007 | A Hereford Beefstouw           | A Hereford Beefstouw           |     4 | 2.300000 |           435698 |           401660 | Adelaide |        5 |          1 | 53      |
| 1043 | A Mother's Milk                | A Mother's Milk                |     1 | 2.600000 |           637110 |           825623 | Unley    |        5 |          1 | 5,6,85  |
| 1336 | Signature A Fusion Of Coffee   | Signature A Fusion Of Coffee   |     1 | 3.900000 |           415182 |           771096 | Adelaide |        5 |          1 | 5,6,10  |
| 1347 | Zero - A little slice of Italy | Zero - A little slice of Italy |     1 | 4.600000 |           269857 |            11684 | Maylands |        5 |          1 | 6,28,37 |
| 1500 | Thai in a Wok                  | Thai in a Wok                  |     2 | 3.800000 |           465388 |            70699 | Adelaide |        5 |          1 | 4       |
| 1631 | Michelangelos Dial a Pizza     | Michelangelos Dial a Pizza     |     1 | 4.300000 |           325638 |           339890 | Adelaide |        5 |          1 | 28      |
+------+--------------------------------+--------------------------------+-------+----------+------------------+------------------+----------+----------+------------+---------+
10 rows in set (0.00 sec)
```

# 使用php
[https://github.com/FoolCode/SphinxQL-Query-Builder](https://github.com/FoolCode/SphinxQL-Query-Builder)



```conf
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
	sql_db			= yumCircle
	sql_port		= 3306	# optional, default is 3306
	sql_query_pre   = SET NAMES UTF8

	sql_query_range = SELECT MIN(id),MAX(id) FROM restaurant
    sql_range_step  = 10000
	sql_query = select id, id as restaurant_id, name, social_name, telephone, price, rating, collected_amount, tabletalk_amount, photo_amount,  \
    				locality, suburb, street, city, state_id, country_id, postcode, \
    				CONCAT(suburb, ' ', postcode) as suburb_postcode \
    			from restaurant \
    			WHERE id>=$start AND id<=$end

    sql_field_string   = name
    sql_field_string   = social_name

    sql_attr_multi = uint cuisine from ranged-query; \
        SELECT restaurant_id as id, cuisine_id as cuisine FROM restaurant_cuisine WHERE id>=$start AND id<=$end; \
        SELECT MIN(id), MAX(id) FROM restaurant_cuisine;
    sql_attr_uint      = country_id
    sql_attr_uint      = state_id
    sql_attr_string    = city
    sql_attr_string    = suburb_postcode
    sql_attr_uint      = price
    sql_attr_float     = rating
    sql_attr_uint      = collected_amount
    sql_attr_uint      = tabletalk_amount
}

#############################################################################
## index definition
#############################################################################

index restaurant_index
{
    source = restaurant_src
    path = /home/straysh/softwares/sphinx/var/data/restaurant
    docinfo = extern
    #dict   = keywords
    mlock = 0
    morphology   = none
    min_word_len = 1
    min_infix_len = 1
    html_strip   = 0
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
	# [hostname:]port[:protocol], or /unix/socket/path to listen on
	# known protocols are 'sphinx' (SphinxAPI) and 'mysql41' (SphinxQL)
	#
	# multi-value, multiple listen points are allowed
	# optional, defaults are 9312:sphinx and 9306:mysql41, as below
	#
	# listen			= 127.0.0.1
	# listen			= 192.168.0.1:9312
	# listen			= 9312
	# listen			= /var/run/searchd.sock
	listen			    = 9312
	listen			    = localhost:9306:mysql41

	# log file, searchd run info is logged here
	# optional, default is 'searchd.log'
	log			= /home/straysh/softwares/sphinx/var/log/searchd.log

	# query log file, all search queries are logged here
	# optional, default is empty (do not log queries)
	query_log		= /home/straysh/softwares/sphinx/var/log/query.log

	# client read timeout, seconds
	# optional, default is 5
	read_timeout		= 5

	# request timeout, seconds
	# optional, default is 5 minutes
	client_timeout		= 300

	# maximum amount of children to fork (concurrent searches to run)
	# optional, default is 0 (unlimited)
	max_children		= 30

	# maximum amount of persistent connections from this master to each agent host
	# optional, but necessary if you use agent_persistent. It is reasonable to set the value
	# as max_children, or less on the agent's hosts.
	persistent_connections_limit	= 30

	# PID file, searchd process ID file name
	# mandatory
	pid_file		= /home/straysh/softwares/sphinx/var/log/searchd.pid

	# seamless rotate, prevents rotate stalls if precaching huge datasets
	# optional, default is 1
	seamless_rotate		= 1

	# whether to forcibly preopen all indexes on startup
	# optional, default is 1 (preopen everything)
	preopen_indexes		= 1

	# whether to unlink .old index copies on succesful rotation.
	# optional, default is 1 (do unlink)
	unlink_old		= 1

	# attribute updates periodic flush timeout, seconds
	# updates will be automatically dumped to disk this frequently
	# optional, default is 0 (disable periodic flush)
	#
	# attr_flush_period	= 900


	# MVA updates pool size
	# shared between all instances of searchd, disables attr flushes!
	# optional, default size is 1M
	mva_updates_pool	= 1M

	# max allowed network packet size
	# limits both query packets from clients, and responses from agents
	# optional, default size is 8M
	max_packet_size		= 8M

	# max allowed per-query filter count
	# optional, default is 256
	max_filters		= 256

	# max allowed per-filter values count
	# optional, default is 4096
	max_filter_values	= 4096


	# socket listen queue length
	# optional, default is 5
	#
	# listen_backlog		= 5


	# per-keyword read buffer size
	# optional, default is 256K
	#
	# read_buffer		= 256K


	# unhinted read size (currently used when reading hits)
	# optional, default is 32K
	#
	# read_unhinted		= 32K


	# max allowed per-batch query count (aka multi-query count)
	# optional, default is 32
	max_batch_queries	= 32


	# max common subtree document cache size, per-query
	# optional, default is 0 (disable subtree optimization)
	#
	# subtree_docs_cache	= 4M


	# max common subtree hit cache size, per-query
	# optional, default is 0 (disable subtree optimization)
	#
	# subtree_hits_cache	= 8M


	# multi-processing mode (MPM)
	# known values are none, fork, prefork, and threads
	# threads is required for RT backend to work
	# optional, default is threads
	workers			= threads # for RT to work


	# max threads to create for searching local parts of a distributed index
	# optional, default is 0, which means disable multi-threaded searching
	# should work with all MPMs (ie. does NOT require workers=threads)
	#
	# dist_threads		= 4


	# binlog files path; use empty string to disable binlog
	# optional, default is build-time configured data directory
	#
	# binlog_path		= # disable logging
	# binlog_path		= /home/straysh/softwares/sphinx/var/data # binlog.001 etc will be created there


	# binlog flush/sync mode
	# 0 means flush and sync every second
	# 1 means flush and sync every transaction
	# 2 means flush every transaction, sync every second
	# optional, default is 2
	#
	# binlog_flush		= 2


	# binlog per-file size limit
	# optional, default is 128M, 0 means no limit
	#
	# binlog_max_log_size	= 256M


	# per-thread stack size, only affects workers=threads mode
	# optional, default is 64K
	#
	# thread_stack			= 128K


	# per-keyword expansion limit (for dict=keywords prefix searches)
	# optional, default is 0 (no limit)
	#
	# expansion_limit		= 1000


	# RT RAM chunks flush period
	# optional, default is 0 (no periodic flush)
	#
	# rt_flush_period		= 900


	# query log file format
	# optional, known values are plain and sphinxql, default is plain
	#
	# query_log_format		= sphinxql


	# version string returned to MySQL network protocol clients
	# optional, default is empty (use Sphinx version)
	#
	# mysql_version_string	= 5.0.37


	# trusted plugin directory
	# optional, default is empty (disable UDFs)
	#
	# plugin_dir			= /usr/local/sphinx/lib


	# default server-wide collation
	# optional, default is libc_ci
	#
	# collation_server		= utf8_general_ci


	# server-wide locale for libc based collations
	# optional, default is C
	#
	# collation_libc_locale	= ru_RU.UTF-8


	# threaded server watchdog (only used in workers=threads mode)
	# optional, values are 0 and 1, default is 1 (watchdog on)
	#
	# watchdog				= 1

	
	# costs for max_predicted_time model, in (imaginary) nanoseconds
	# optional, default is "doc=64, hit=48, skip=2048, match=64"
	#
	# predicted_time_costs	= doc=64, hit=48, skip=2048, match=64


	# current SphinxQL state (uservars etc) serialization path
	# optional, default is none (do not serialize SphinxQL state)
	#
	# sphinxql_state			= sphinxvars.sql


	# maximum RT merge thread IO calls per second, and per-call IO size
	# useful for throttling (the background) OPTIMIZE INDEX impact
	# optional, default is 0 (unlimited)
	#
	# rt_merge_iops			= 40
	# rt_merge_maxiosize		= 1M


	# interval between agent mirror pings, in milliseconds
	# 0 means disable pings
	# optional, default is 1000
	#
	# ha_ping_interval		= 0


	# agent mirror statistics window size, in seconds
	# stats older than the window size (karma) are retired
	# that is, they will not affect master choice of agents in any way
	# optional, default is 60 seconds
	#
	# ha_period_karma			= 60


	# delay between preforked children restarts on rotation, in milliseconds
	# optional, default is 0 (no delay)
	#
	# prefork_rotation_throttle	= 100


	# a prefix to prepend to the local file names when creating snippets
	# with load_files and/or load_files_scatter options
	# optional, default is empty
	#
	# snippets_file_prefix		= /mnt/common/server1/
}

#############################################################################
## common settings
#############################################################################

common
{

	# lemmatizer dictionaries base path
	# optional, defaut is /usr/local/share (see ./configure --datadir)
	#
	# lemmatizer_base = /usr/local/share/sphinx/dicts

	# path to RLP root directory
	# optional, defaut is /usr/local/share (see ./configure --datadir)
	#
	# rlp_root = /usr/local/share/sphinx/rlp

	# path to RLP environment file
	# optional, defaut is /usr/local/share/rlp-environment.xml (see ./configure --datadir)
	#
	# rlp_environment = /usr/local/share/sphinx/rlp/rlp/etc/rlp-environment.xml
}

# --eof--

```