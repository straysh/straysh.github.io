---
title: apache_faqs
date: 2015-08-04 10:16:47
tags: Apache
category: 博文
---
* 反向代理
```
<VirtualHost *:80>
    ... ...
    
    #反向代理设置
    ProxyPass /dev http://activity.lifemenu.local:8010
    ProxyPassReverse /dev http://activity.lifemenu.local:8010
</VirtualHost>
<VirtualHost *:8010>
    ServerName activity.lifemenu.local
    DocumentRoot /data0/www/Lifemenu/branches/weixin_20151026/public

    ErrorLog /data3/logs/apache/error.log
    CustomLog /data3/logs/apache/access.log combined
    <Directory /data0/www/Lifemenu/branches/weixin_20151026/public>
        AllowOverride All
        Options -Indexes +FollowSymLinks -MultiViews
        Require all granted
    </Directory>
</VirtualHost>
#针对单独的ip做反向代理
<Location /bar>
    Allow from 1.2.3.4 2.3.4.5 ...
    ProxyPass http://example.com/bar
    ProxyPassReverse http://example.com/bar
</Location>
```
