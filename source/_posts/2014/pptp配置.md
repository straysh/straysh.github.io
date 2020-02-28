---
title: pptp配置
date: 2014-03-13 13:25:26
tags: Linux
categories:
- 博文
---
```bash
1.yum -y install ppp pptp
2.vim /etc/ppp/chap-secrets
# Secrets for authentication using CHAP
# client    server  secret          IP addresses
vpn帐号   vpnIP vpn密码 *

3.vim /etc/ppp/peers/phpcurl
pty 'pptp vpnIP --nolaunchpppd'
name vpn帐号
remotename vpnIP
require-mppe-128
file /etc/ppp/options.pptp
ipparam phpcurl

4.vim /etc/ppp/options.pptp

lock
noauth
refuse-pap
refuse-eap
refuse-chap
nobsdcomp
nodeflate
require-mppe-128

5.pppd call phpcurl
6.route del default dev eth0
7.route add default dev ppp0
```
