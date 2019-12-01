---
title: oAuth授权的过程
date: 2014-11-28 22:35:02
tags: PHP
---
[查看原文，点击这里](https://developers.google.com/accounts/docs/OAuth2)

####使用OAuth 2.0访问Google APIs####

Google APIs使用OAuth 2.0来认证和授权。Google APIs支持常用的OAuth 2.0场景，例如网页应用，需要安装的本地应用，和客户端应用。

OAuth 2.0 是一个相对简单的协议。首先，你需要从[Google Developers Console](https://console.developers.google.com/)获取OAuth 2.0的凭证（译注：client_id、client_secret、redirect_uri等）。然后你的客户端应用程序从Google身份认证服务器请求一个accesss token，从http响应中解析出一个token，最后将携带这个token去访问google API。

这个页面给出了Google支持的OAuth 2.0身份认证场景的概览，并提供了更详细的链接。OAuth 2.0身份认证的详细文档，请点击[OpenID Connect](https://developers.google.com/accounts/docs/OpenIDConnect)。

> 既要正确实现功能又要保证安全，外面强烈推荐您在与Google OAuth 2.0终端交互时使用OAuth 2.0的库文件。使用这些比人well-debug过的代码是最佳实践，并且它能保护你的服务器和你的用户。更多信息，参考[Client libraries](https://developers.google.com/accounts/docs/OAuth2#libraries)。

####基础步骤####
***
所有的应用在访问Google OAuth 2.0时都遵循一个模式。从高层次上来说，你需要4个步骤：

##### 1. 从Google开发者控制台获取到凭证#####
至少你需要获取到client_id，可能也需要client_secret（译注：详细请参看上一篇文章[创建Google App](http://www.straysh.info/article/27)）。需要哪些值取决于你在Google开发者控制台创建的是何种app。例如，一个javascript应用不需要client_secret，但是网页应用需要。

##### 2. 从Google身份认证服务器上获取一个access token#####
在你的应用程序能使用Google API访问私有数据之前，你需要获取一个准许访问该API的token。单单一个access token能准许对多个API各种等级的访问权限。变量参数scope控制access token准许访问的一系列资源和操作。在获取access-token期间，你的应用程序会发送一个或者多个scope值。

有多种方法来发送这个请求，并且它们根据你创建的应用而变化。例如，一个javascript应用会使用浏览器跳转到google来获取token，而在设备上安装的应用程序则因没有浏览器转而使用web service请求token。

在用户使用google账户登陆时，需要数个授权步骤。在正确登陆之后，用户会被询问是否准许应用程序获取这些权限。这个过程称之为user consent。

若用户准许了这些权限，Google身份认证服务器会给你的应用程序发送一个access token（或者你可以用来获取access token的一个授权code）。若用户拒绝，则服务器返回一个error。

通常，增量的请求scope是最佳的实践：在需要时请求相应的scope，而不是在最开始就请求。例如，一个需要支持支付的应用就应该在用户点击"购买"时才请求访问Google钱包的权限。详情查看[Incremental authorization](https://developers.google.com/accounts/docs/OAuth2WebServer#incrementalAuth)。

##### 3. 将access token 发送给一个API#####
应用获取到access token之后，它会在http身份认证头中发送token到Google API上。在URI的查询字符串中发送token也是可以的，单并不推荐。因为URI参数会被记录到日志文件中因此并不安全。一个良好的REST实践是：避免非必须的URI参数。

access token只能访问在获取该token时指定的scope中描述的资源和操作。例如，若token是为Google+ API产生的，它不被准许访问Google 联系人API。但是，你可以向Google+ API多次发送同一个token。

##### 4. 如果需要，刷新access token#####
access token有有限的生命时间。若你的应用程序需要在超出生命时间之后访问Google API，它可以获取一个refresh token。refresh token允许你的应用程序获取一个新的access token。

> 将refresh token保存在一个长期的存储介质中，并在它有效时继续使用它。refresh token的数量是有限制的(这句不会翻译 囧)。若应用程序获取的refresh token超量，旧的refresh token将会失效。

to be continued ... ...