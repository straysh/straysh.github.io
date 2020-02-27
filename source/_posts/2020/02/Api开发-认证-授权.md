---
title: Api开发_认证_授权
date: 2020-02-27 15:21:53
toc: true
tags: 
- PHP
categories: 
- 博文
---

在接口开发中，第一步要解决的问题就是认证和授权。

# Authentication - 认证
即使用某种凭证来证明身份的过程。如用户使用账号+密码，使用手机号+短信码，使用指纹识别等。

# Authorization - 授权
将某种凭证(一般非原始认证信息，且有过期时间、使用次数、使用频率等限制)给予第三方使用的过程。如允许微信使用相册的能力，允许小程序读取微信基本信息的能力

# Credential - 凭证
用于认证或授权的信息。如账号、密码、短信码、cookie、session、token等。

## Cookie and Session
本质上，cookie存储在客户端（一般是浏览器），session存储在服务端。
但session同时依赖于session-id（存储在客户端）来和客户端关联（一个请求到达服务端，依赖session-id来定位到具体的session）。因此Cookie和Session

## Token
用户认证成功后，由服务器签发的凭证（一般有过期时间、使用频率等限制），在今后调用api时使用。

## JWT - Token的一种实现方式
[JWT规范](https://tools.ietf.org/html/rfc7519)
[Auth0社区资料](https://jwt.io/introduction/)

## Oauth2.0 - Token实现的一种方式
现流行的实现开放API的授权方案。
[Oauth2.0社区技术资料](https://oauth.net/2/)
