---
title: bash FAQ
date: 2015-08-06 10:16:31
tags: Linux
categories:
- 博文
---
* pstree
```bash
straysh ~]$ps -ef|grep nginx
root      7342  1962  0 10:11 ?        00:00:00 nginx: master process nginx
www       7343  7342  0 10:11 ?        00:00:00 nginx: worker process
www       7344  7342  0 10:11 ?        00:00:00 nginx: worker process
www       7345  7342  0 10:11 ?        00:00:00 nginx: worker process
www       7346  7342  0 10:11 ?        00:00:00 nginx: worker process
www       7347  7342  0 10:11 ?        00:00:00 nginx: worker process
www       7348  7342  0 10:11 ?        00:00:00 nginx: worker process
www       7349  7342  0 10:11 ?        00:00:00 nginx: worker process
www       7350  7342  0 10:11 ?        00:00:00 nginx: worker process
straysh   7595  7328  0 10:17 pts/4    00:00:00 grep --color=auto nginx
straysh ~]$pstree -ph 7342
nginx(7342)─┬─nginx(7343)
            ├─nginx(7344)
            ├─nginx(7345)
            ├─nginx(7346)
            ├─nginx(7347)
            ├─nginx(7348)
            ├─nginx(7349)
            └─nginx(7350)
```

* ps 
```bash
straysh ~]$ps -Lf 1656
UID        PID  PPID   LWP  C NLWP STIME TTY      STAT   TIME CMD
root      1656     1  1656  0    1 08:52 ?        Ss     0:00 /usr/sbin/apache2 -k start
```

* pstack
```bash
$ pstack 4551
Thread 7 (Thread 1084229984 (LWP 4552)):
#0  0x000000302afc63dc in epoll_wait () from /lib64/tls/libc.so.6
#1  0x00000000006f0730 in ub::EPollEx::poll ()
#2  0x00000000006f172a in ub::NetReactor::callback ()
#3  0x00000000006fbbbb in ub::UBTask::CALLBACK ()
#4  0x000000302b80610a in start_thread () from /lib64/tls/libpthread.so.0
#5  0x000000302afc6003 in clone () from /lib64/tls/libc.so.6
#6  0x0000000000000000 in ?? ()
```

* find and mv
```bash
find cache_bak/ -type f |xargs -i mv '{}' cache/
```

* quick delete files
```bash
find . -type f -d
```

* 重命名文件
```bash
rename -v 's/1_//' *.html
```

* 去除重复的行
```bash
awk '!x[$0]++' 8.txt > 8_no_dup.txt
```

* 删除文件
```
find . -type f -exec grep -H '您要查看的商户不存在' {} \; -delete
```

* 从文本中匹配特定的字符串
```bash
curl -s "http://www.baidu.com/s?ie=utf-8&f=8&rsv_bp=0&rsv_idx=1&tn=baidu&wd=热干面&rsv_pq=bd5722370004bbe0&rsv_t=5d19sLQJWuSZFFDWWaH%2Bd%2BVzn9pzgmbLu23Z%2FnUrfAjj%2FaEyTSFswdcEbX0&rsv_enter=1&rsv_sug3=12&rsv_sug1=2&rsv_sug2=0&inputT=3330&rsv_sug4=3628" | sed -nr 's/.*百度为您找到相关结果约(.*)个.*/\1/p'
```

* 字符串替换
```bash
#http://tldp.org/LDP/abs/html/string-manipulation.html
result=1,280,000
result=${result//,/}
echo ${result} #1280000
```