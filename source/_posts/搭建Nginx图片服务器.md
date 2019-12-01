---
title: 搭建Nginx图片服务器
date: 2014-11-13 10:46:55
tags: Nginx
---
### Part-I 安装Nginx ####
1. 安装PCRE
2. 下载 ngx_cache_purge 并解压，用来清除缓存
3. 下载Nginx并解压
4. cd nginx-1.7.7
5.  编译，--prefix使用默认值，则nginx安装在/usr/local/nginx
```bash
./configure    --user=www    --group=www    --add-module=../ngx_cache_purge-1.0 
    --with-http_stub_status_module    --with-http_ssl_module
make && make install
```

###Part-II 配置###
vim /usr/local/nginx/conf/nginx.conf，并编辑如下：
```conf
user  www www;
worker_processes  8;

error_log  /data3/nginx/error.log  crit;
#error_log  logs/error.log;
#error_log  logs/error.log  notice;
#error_log  logs/error.log  info;

pid        /usr/local/nginx/nginx.pid;


events {
	use epoll;
    worker_connections  65535;
}


http {
    include       mime.types;
    default_type  application/octet-stream;
	charset utf-8;
	
	server_names_hash_bucket_size 128;
	client_header_buffer_size 32k;
	large_client_header_buffers 4 32k;
	client_max_body_size 300m;

	sendfile on;
	tcp_nopush on;
	keepalive_timeout 60;
	tcp_nodelay on;

	client_body_buffer_size 512k;
	proxy_connect_timeout 5;
	proxy_read_timeout 60;
	proxy_send_timeout 5;
	proxy_buffer_size 16k;
	proxy_buffers 4 64k;
	proxy_busy_buffers_size 128k;
	proxy_temp_file_write_size 128k;

	gzip on;
	gzip_min_length 1k;
	gzip_buffers 4 16k;
	gzip_http_version 1.1;
	gzip_comp_level 2;
	gzip_types text/plainapplication/x-javascript text/css application/xml;
	gzip_vary on;

# proxy_temp_path 和 proxy_cache_path 必须在同一分区
	proxy_temp_path /data0/proxy_temp_dir;
# 设置web缓存区名称为cahche_one，内存缓存空间大小为200M,1天没有被访问的内容自动清除硬盘缓存空间大小为300G
	proxy_cache_path /data0/proxy_cache_dir levels=1:2 keys_zone=cache_one:200m inactive=1d max_size=30g;

#	upstream backend_server{
#		server 192.168.1.121:80 weight=1 max_fail=2 fail_timeout=30s;	
#		server 192.168.1.122:80 weight=1 max_fail=2 fail_timeout=30s;	
#		server 192.168.1.123:80 weight=1 max_fail=2 fail_timeout=30s;	
#	}

#以下为缓存服务器

	log_format cache '***$time_local \n'
					'   $upstream_cache_status \n'
					'   $remote_addr, $http_x_forwarded_for \n'
					'   Cache-Control: $upstream_http_cache_control \n'
					'   Expires: $upstream_http_expires \n'
					'   "$request"($status) \n'
					'   "$http_user_agent" \n';

    server {
        listen       80;
        server_name  192.168.1.120;

        location / {
			proxy_cache cache_one;
			# 对不同的HTTP状态码设置不同的缓存时间
			proxy_cache_valid 200 304 12h;
			#以域名、URI、参数组合成web服务器的key值，Ngnix根据key值哈希，存储缓存内容到二级缓存目录内
			proxy_cache_key  $host$uri$is_args$args;
			proxy_set_header Host $host;
			proxy_set_header X-Forwarded-For $remote_addr;
			#此处跳转到真实图片服务器
			proxy_pass http://192.168.1.120:8080;

			access_log /data3/nginx/cache.log cache;

			expires 1d;
        }

		location ~ /purge(/.*){
            #设置只允许指定的ip或ip段才可以清除url缓存  
            #allow 127.0.0.1;
            #allow 192.168.0.0/16;
            #deny  all;
            proxy_cache_purge cache_one $host$1$is_args$args;
        }

#		#扩展名为.php、.jsp、.cig结尾的动态应用程序不缓存
#		location ~.*\.(php|jsp|cgi)?$
#		{
#			proxy_set_header Host $host;
#			proxy_set_header X-Forwarded-For $remote_addr;
#			proxy_pass http://backend_server;
#		}

		access_log off;

        #error_page  404              /404.html;

        # redirect server error pages to the static page /50x.html
        #
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }

        # proxy the PHP scripts to Apache listening on 127.0.0.1:80
        #
        #location ~ \.php$ {
        #    proxy_pass   http://127.0.0.1;
        #}

        # pass the PHP scripts to FastCGI server listening on 127.0.0.1:9000
        #
        #location ~ \.php$ {
        #    root           html;
        #    fastcgi_pass   127.0.0.1:9000;
        #    fastcgi_index  index.php;
        #    fastcgi_param  SCRIPT_FILENAME  /scripts$fastcgi_script_name;
        #    include        fastcgi_params;
        #}

        # deny access to .htaccess files, if Apache's document root
        # concurs with nginx's one
        #
        #location ~ /\.ht {
        #    deny  all;
        #}
    }

	#真实的图片服务器
	server{
		listen 8080;
		server_name localhost;
		location /{
			root /data0/images/;	
		}

		#访问日志，一般都off掉
		access_log /data3/nginx/access.log combined;
	}


    # another virtual host using mix of IP-, name-, and port-based configuration
    #
    #server {
    #    listen       8000;
    #    listen       somename:8080;
    #    server_name  somename  alias  another.alias;

    #    location / {
    #        root   html;
    #        index  index.html index.htm;
    #    }
    #}


    # HTTPS server
    #
    #server {
    #    listen       443 ssl;
    #    server_name  localhost;

    #    ssl_certificate      cert.pem;
    #    ssl_certificate_key  cert.key;

    #    ssl_session_cache    shared:SSL:1m;
    #    ssl_session_timeout  5m;

    #    ssl_ciphers  HIGH:!aNULL:!MD5;
    #    ssl_prefer_server_ciphers  on;

    #    location / {
    #        root   html;
    #        index  index.html index.htm;
    #    }
    #}

}

```
到此，Nginx图片服务区搭建完毕。
在/data0/images/下放入一张图片 200.jpg测试之
访问 http://192.168.1.120/200.jpg，
cache_log记录如下：
```log
***12/Nov/2014:16:15:26 +0800 
   MISS 
   192.168.1.19, - 
   Cache-Control: - 
   Expires: - 
   "GET /200.jpg HTTP/1.1"(200) 
   "Mozilla/5.0 (X11; Linux x86_64; rv:30.0) Gecko/20100101 Firefox/30.0" 

***12/Nov/2014:16:15:38 +0800 
   HIT 
   192.168.1.19, - 
   Cache-Control: - 
   Expires: - 
   "GET /200.jpg HTTP/1.1"(200) 
   "Mozilla/5.0 (X11; Linux x86_64; rv:30.0) Gecko/20100101 Firefox/30.0"
```

访问 http://192.168.1.120/purge/200.jpg 清除缓存

【参考资料】：
[http://nginx.org/en/docs/configure.html](http://nginx.org/en/docs/configure.html "官方安装指南")
[http://nginx.org/cn/#basic_http_features](http://nginx.org/cn/#basic_http_features "Nginx中文文档")