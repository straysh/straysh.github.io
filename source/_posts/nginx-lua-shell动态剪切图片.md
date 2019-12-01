---
title: nginx+lua+shell动态剪切图片
date: 2015-08-04 10:15:03
tags: Nginx
categories:
- 博文
---
假设http://static.yumcircle.com/1.jpg这个是源图片

那么在调用缩略图时，使用http://static.yumcircle.com/1!200×100.jpg 就会生成一张200宽100高的图片 !200×100就是具体的参数

ok，下面说一下我定义的参数:

#### 1.固定尺寸缩放(这个参数会将源图强制缩放到这个尺寸，所以可能会有所变形)
* !200×100 将源图缩放为宽200x高100
* !200 将源图缩放为宽200x高200
* !200×100-50 将源图缩放为宽200x高100 并且图片质量为50 （这个是为了给手机端使用的，因为手机端可能需要图片的size更小一些)
* !200-50 将源图缩放为宽200x高200 并且图片质量为50

#### 2.等比缩放
* :w200 将源图宽缩放为200，高度=原图宽高比自适应，（意思是，强制将源图的宽缩到200，高按原图比例缩放)
* :h200 将源图高缩放为200，宽自适应
* :m200 将源图以（宽，高那个值大，以哪个为准，进行缩放，比如源图是300×400，那就会以高为准，先将高缩到200），但是如果宽高都没有达到，而不处理
同时也支持 :w200-50 :h200-50 :m200-50 的图片质量

#### 3.中心剪辑
* @200×300 将源图以（宽，高那个值小，以哪个为准，进行缩放，并在缩放后的图片，以另一边中间点（就是正中间，进行剪辑）
* @200×300-50 同时支持图片质量


```nginx
#固定大小
location ~ (.*)!(\d+)x(\d+).(gif|jpg|jpeg|png)$ {
    root   /data0/www/yumCircle/public;

    #bucketname = static
    set $bucketname static;
    #原图片路径
    set $srcPath /data0/www/yumCircle/public;
    #目标图片路径
    set $destPath /data0/www/yumCircle/public;

    #处理类型
    set $type 1;

    if (!-f $request_filename){
        #rewrite ~* /public/images/tpl-design/profile-photo-02.jpg;
        rewrite_by_lua_file conf/image_resize_thumb.lua;
    }
    #expires 30d;
}

#宽高相等
location ~ (.*)!(\d+).(gif|jpg|jpeg|png)$  {
    root   /data0/www/yumCircle/public/images/uploaded/thumbnails;

    #bucketname = static
    set $bucketname static;
    #原图片路径
    set $srcPath /data0/www/yumCircle/public/images/uploaded/origin;
    #目录图片路径
    set $destPath /data0/www/yumCircle/public/images/uploaded/thumbnails;

    #处理类型
    set $type 3;

    if (!-f $request_filename) {
        rewrite_by_lua_file /data0/www/yumCircle/image_resize_thumb.lua;
    }
    #expires 30d;
}

#宽高相等 质量
location ~ (.*)!(\d+)-(\d+).(gif|jpg|jpeg|png)$  {
    root   /data0/www/yumCircle/public/images/uploaded/thumbnails;

    #bucketname = static
    set $bucketname static;
    #原图片路径
    set $srcPath /data0/www/yumCircle/public/images/uploaded/origin;
    #目录图片路径
    set $destPath /data0/www/yumCircle/public/images/uploaded/thumbnails;

    #处理类型
    set $type 4;

    if (!-f $request_filename) {
        rewrite_by_lua_file /data0/www/yumCircle/image_resize_thumb.lua;
    }
    #expires 30d;
}

#宽高指定且等比
location ~ (.*):(w|h|m)(\d+).(gif|jpg|jpeg|png)$  {
    root   /data0/www/yumCircle/public/images/uploaded/thumbnails;

    #bucketname = static
    set $bucketname static;
    #原图片路径
    set $srcPath /data0/www/yumCircle/public/images/uploaded/origin;
    #目录图片路径
    set $destPath /data0/www/yumCircle/public/images/uploaded/thumbnails;

    #处理类型
    set $type 5;

    if (!-f $request_filename) {
        rewrite_by_lua_file /data0/www/yumCircle/image_resize_thumb.lua;
    }
    #expires 30d;
}

#宽高指定且等比 质量
location ~ (.*):(w|h|m)(\d+)-(\d+).(gif|jpg|jpeg|png)$  {
    root   /data0/www/yumCircle/public/images/uploaded/thumbnails;

    #bucketname = static
    set $bucketname static;
    #原图片路径
    set $srcPath /data0/www/yumCircle/public/images/uploaded/origin;
    #目录图片路径
    set $destPath /data0/www/yumCircle/public/images/uploaded/thumbnails;

    #处理类型
    set $type 6;

    if (!-f $request_filename) {
        rewrite_by_lua_file /data0/www/yumCircle/image_resize_thumb.lua;
    }
    #expires 30d;
}

#宽高指定且剪切
location ~ (.*)\@(\d+)x(\d+).(gif|jpg|jpeg|png)$  {
    root   /data0/www/yumCircle/public/images/uploaded/thumbnails;

    #bucketname = static
    set $bucketname static;
    #原图片路径
    set $srcPath /data0/www/yumCircle/public/images/uploaded/origin;
    #目录图片路径
    set $destPath /data0/www/yumCircle/public/images/uploaded/thumbnails;

    #处理类型
    set $type 7;

    if (!-f $request_filename) {
        rewrite_by_lua_file /data0/www/yumCircle/image_resize_thumb.lua;
    }
    #expires 30d;
}

#宽高指定且剪切 质量
location ~ (.*)\@(\d+)x(\d+)-(\d+).(gif|jpg|jpeg|png)$  {
    root   /data0/www/yumCircle/public/images/uploaded/thumbnails;

    #bucketname = static
    set $bucketname static;
    #原图片路径
    set $srcPath /data0/www/yumCircle/public/images/uploaded/origin;
    #目录图片路径
    set $destPath /data0/www/yumCircle/public/images/uploaded/thumbnails;

    #处理类型
    set $type 8;

    if (!-f $request_filename) {
        rewrite_by_lua_file /data0/www/yumCircle/image_resize_thumb.lua;
    }
    #expires 30d;
}
```