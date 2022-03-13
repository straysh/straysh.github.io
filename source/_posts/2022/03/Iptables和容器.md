---
title: Iptables和容器
date: 2022-03-13 11:01:46
tags:
- Linux
- Docker
categories:
- 博文
- 笔记
toc: true
fancybox: true
---

# 复习网络七层模型
![](/images/linux/OSI_7_layers.jpg)

# 简介
在Linux中防火墙全称为`Netfilter/Iptables`。`Netfilter`工作在内核空间，负责根据规则执行具体的动作如数据包过滤、网络地址转换、数据包内容修改等。`Iptables`位于用户空间，是一个命令行工具，用来设定各种规则从而操作`Netfilter`。
![](/images/linux/iptables_overview_01.png)

iptables有五条链：
- PREROUTING 路由前
- INPUT 流入
- FORWARD 转发
- OUTPUT 流出
- POSTROUTING 路由后

以及四张表：
- Raw
- Mangle 主要负责修改数据包标记
- Nat 主要负责网络地址转换
- Filter 主要负责过滤

表和链的组合设定多条规则，实现对数据包的控制。iptables中四张表按优先级执行 raw -> mangle -> nat -> filter。
![](/images/linux/iptables_overview_02.png)

# 命令
```
iptables -t 表名 <-A/I/D/R/L/F> 规则链名 [规则号] <-i/o 网卡名> -p 协议名 <-s 源IP> --sport 源端口 <-d 目标IP> --dport 目标端口 -j 动作  

-t 指定表名，未指定表名时默认为 Filter 表
-A和-I都是添加规则，-A增加的规则放在现有规则的最后，-I添加的规则放在规则号指定的位置，该位置原先的规则往后顺位。
-D 删除规则号指定的规则
-R 替换规则号指定的规则
-L 查看相应的规则
-F 清楚某条链或者表的规则
-i/o 指定输入和输出的网卡
-p 指定数据包协议，如 tcp、udp、icmp 等，这里支持简单的表达式，如 -p !tcp 去除 tcp 外的所有协议
-s和-sport分别指定数据包源 IP 地址及端口
-d和-dport分别指定数据包目标 IP 地址及端口
-j 指定前述的参数匹配上数据包以后执行的动作。常用的处理动作包括 ACCEPT 放行、REJECT 拒绝、DROP 丢弃、REDIRECT 重定向、DNAT 修改目的 IP 及端口、SNAT 修改源 IP 及端口等等
```

iptables规则示例
1. 禁用SSHD默认的22端口
```shell
iptables -t filter -A INPUT -p tcp --dport 22 -j DROP
```
2. 只允许特定网段10.160.0.0/16访问本机的10.160.100.1的SSHD(22端口)服务
```shell
#设置默认的drop，再允许特定的网段进入和出去
iptables -P INPUT DROP
iptables -P OUTPUT DROP
iptables -P FORWARD DROP

iptables -t filter -A INPUT -s 10.160.0.0/16 -d 10.160.100.1 -p tcp --dport 22 -j ACCEPT
iptables -t filter -A OUTPUT -s 10.160.100.1 -d 10.160.0.0/16 -p tcp --dport 22 -j ACCEPT
```
3. 过滤掉状态有问题的http包。只允许http80端口且限定连接状态为Established和Related的数据包
```shell
iptables -A INPUT -p tcp  --sport 80 -m state --state ESTABLISHED,RELATED -j ACCEPT
```
4. 开启儿童上网模式，星期一到星期五的8:00-21:00禁止游戏相关网页”game“
```shell
iptables -I FORWARD -s 192.168.0.0/24 -m string --string "game" -m time --timestart 8:00 --timestop 21:00 --days Mon,Tue,Wed,Thu,Fri -j DROP
```
5. 生产环境mysql数据库仅允许内网特定ip访问
```shell
iptables –A INPUT –s 10.160.41.1 –p tcp –dport 3306 –j ACCEPT
```
6. 将目的IP为10.160.132.55且目的端口为9090的我们做DNAT修改目标地址处理，重定向到10.162.37.1:8080
```shell
iptables  -A INPUT -d 10.160.132.55 -p tcp --dport 9090 -j DNAT --to 10.162.37.1:8080
```
7. 拦截所有入站tcp80端口和8080端口数据包重定向到某个代理服务的15001端口进行统一处理
```shell
iptables -A INPUT -p tcp --dport 80,8080 -j REDIRECT --to-ports 15001
```

# Docker的iptables
## 列出所有nat规则
```shell
$ iptables -L -nvt nat
```
![](/images/linux/docker_iptables_nat.png)

## 列出所有filter规则
```shell
$ iptables -L -nvt filter
```
![](/images/linux/docker_iptables_filter.png)

---
- 原文[从 iptables 谈 ServiceMesh 流量拦截](https://mp.weixin.qq.com/s/nRTMu4J9eBOu1ydkII_toQ)