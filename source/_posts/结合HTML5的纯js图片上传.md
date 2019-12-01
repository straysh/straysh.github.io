---
title: 结合HTML5的纯js图片上传
date: 2013-10-20 20:28:08
tags: PHP
---
首次发长文，文辞简陋加之能力有限，若有错漏，望不吝赐教。

本文探讨的是图片（文件）上传的前端技术，涉及到html5（FileRader API）、js（常规DOM操作）以及ajax（模拟表单提交multipart/form-data数据）。后端使用的php语言，为简便，这里仅仅接收了ajax提交的数据。

首先让我们来回顾一下传统的使用表单上传文件的技术。
```html
<!-- The data encoding type, enctype, MUST be specified as below -->
<form enctype="multipart/form-data" action="__URL__" method="POST">
    <!-- MAX_FILE_SIZE must precede the file input field -->
    <input type="hidden" name="MAX_FILE_SIZE" value="30000" />
    <!-- Name of input element determines name in $_FILES array -->
    Send this file: <input name="userfile" type="file" />
    <input type="submit" value="Send File" />
</form>
```

传统表单上传的要点是：必须使用method="POST"；必须指定enctype="multipart/form-data"；包含&lt;input type="file" /&gt;表单元素。文件上传必须使用POST，这个不必多说，若有疑问请自行google或者点击[RFC2616](http://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html)。enctype指定了http协议头中的contentType值，它的缺省值为application/x-www-form-urlencoded，而multipart/form-data则是上传文件专用的编码方式，它指定了requestBody中的数据拼接和拆解的格式。关于协议的具体内容，请点击[multipart/form-data](http://www.ietf.org/rfc/rfc2388.txt)。[更多表单细节请点击](http://www.w3.org/TR/html401/interact/forms.html#adef-enctype)

后端接收文件使用$_FILES即可。

在上传多个文件时，就需要动态的添加&lt;input type="file" /&gt;，而取消某个文件时又要删除对应的表单元素。不论现实它是否复杂，传统的表单上传都有一个缺点：一次只能添加一个文件。如果要上传20个文件，就要至少点击20次，如果更多呢，例如100，想想就崩溃了。

在HTML5出现之前，就已经有大量的插件能够解决这个问题。例如我之前一直使用的swfupload。<a href="http://app.ifilmplus.com/m_attention/">在线demo</a>,点击标签微博发布器-&gt;定时微博。如果你能找到这个文件/app/m_attention/modules/clocksend/common/js/main.js，重点看看L16~L48以及L269，这是插件的调用方式。

上面说的这些插件都用到了flash或者其它技术来实现多文件选取，无法定制。好消息是，在HTML5中提供了一些API，使得单纯的使用JavaScript就可以访问选取的文件，不仅可以获得文件的文件名，物理路径，还能直接读取文件的内容。关于FileReader<a href="https://developer.mozilla.org/en-US/docs/Web/API/FileReader">请点击</a>。请复制下面的代码体验FileReader：
```html
<!DOCTYPE HTML>
<html>
<body>
<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
<form enctype="multipart/form-data" method='post'>
<input type='file' name="userfile" id="upfile" onchange="handleFiles(this.files)" />
<input type="submit" value="upload" id="submit"/>
</form>
<div id="imgcont"></div>
<script>
function handleFiles(files) {
    if (files.length) {
    var file = files[0];
        var reader = new FileReader();
        if (/text\/\w+/.test(file.type)) {
            reader.onload = function() {
                $('<pre>' + this.result + '</pre>').appendTo('#imgcont');
            }
            reader.readAsText(file);
        }else if(/image\/\w+/.test(file.type)){
            reader.onload=function(){
                    $("<img src='"+this.result+"' />").appendTo('#imgcont');
            }
            reader.readAsDataURL(file);
        }
    }
}
</script>
</body>
</html>
```

请注意上面代码中的第22行，这是一个技巧。传统的图片显示需要指定src为一个网络路径或者相对路径，而现代浏览器都支持一种新的方式，["data" url](http://tools.ietf.org/html/rfc2397)。它以消耗客户端性能为代价，将图片的base64编码替换成src的值，省去了一次对图片地址的http请求。然后，在我们的例子中，它实现了 __图片预览__ 的功能。

####Ajax上传文件
现在，我们已经使用JavaScript获取了待上传的文件，只需要点击Submit按钮，图片就会发送到服务器。接下来，我们来尝试使用ajax来上传文件。

在讲解技术之前，我先来科普几个Tips。

* `<input type="file" />` 的value值是只读的，无法修改，使用JavaScript修改该值会被告知一个SecurityError: The operation is insecure.的错误。
* 前面我们已经提过，文件上传的时候需要指定http协议头的contentType='multipart/form-data'，因此简单的向服务器post数据，服务器是无法正常接收图片的。即便使用jQuery，在\(.ajax()中使用\)('form').serialize()方法直接提交整个表单，也是无效的，即使同时指定ContentType:'multipart/form-data'同样无效。当然，你可以将图片的二进制数据（使用FileReader.readAsBinaryString()）post到服务器，当作普通的变量来接收，再将二进制数据写入到文件中来生成图片，但是这样做就不是上传图片了。 

这里插入一段个人提示。网络上有一篇文章《基于HTML5的可预览多图片Ajax上传》。我摘录了这边文章中的核心代码，然后我要指出这些技术中的不可取之处以及为何下面的代码是不建议使用的。

```js
//文件上传
funUploadFile: function() {
    var self = this;    
    if (location.host.indexOf("sitepointstatic") &gt;= 0) {
        //非站点服务器上运行
        return;    
    }
    for (var i = 0, file; file = this.fileFilter[i]; i++) {
        (function(file) {
            var xhr = new XMLHttpRequest();
            if (xhr.upload) {
                // 上传中
                xhr.upload.addEventListener("progress", function(e) {
                    self.onProgress(file, e.loaded, e.total);
                }, false);
                // 文件上传成功或是失败
                xhr.onreadystatechange = function(e) {
                    if (xhr.readyState == 4) {
                        if (xhr.status == 200) {
                            self.onSuccess(file, xhr.responseText);
                            self.funDeleteFile(file);
                            if (!self.fileFilter.length) {
                                //全部完毕
                                self.onComplete();    
                            }
                        } else {
                            self.onFailure(file, xhr.responseText);        
                        }
                    }
                };
                // 开始上传
                xhr.open("POST", self.url, true);
                xhr.setRequestHeader('content-type', 'multipart/form-data');
                xhr.setRequestHeader("X_FILENAME", file.name);
                xhr.send(file);
            }    
        })(file);    
    }    
},
```

```php
$fn = (isset($_SERVER['HTTP_X_FILENAME']) ? $_SERVER['HTTP_X_FILENAME'] : false);
if ($fn) {
    file_put_contents(
        'uploads/' . $fn,
        file_get_contents('php://input')
    );
echo "http://www.zhangxinxu.com/study/201109/uploads/$fn";
exit();
}
```

作者使用了ajax来发送数据。注意L34～L37,打开一个post连接，指定contentType为multipart-form-data，然后发送了一个额外的头部信息X_FILENAME=file.name，最后发送了图片的二进制代码触发发送动作。上述代码的特点：1、只能发送一张图片；2、requestBody中不能发送其它信息；3、若有额外信息需要发送，可以使用额外的头部新来装载，并在服务端使用$_SERVER['HTTP_变量名']来接收。上述代码是有很大不足的，首先使用php://input来接收数据倒还不如使用post来接收的方便（最少只需要简单的数行代码就能实现），另外根据<a href="http://php.net/manual/en/wrappers.php.php">php官方文档</a>中php://input一节有这么一句：php://input is not available with enctype="multipart/form-data"。经测试，注释L35上述代码不受影响。当然我也很佩服作者的编码能力，和想象力。但是同时我也要指出这篇文章中的错误，希望后来的读者在借鉴的同时能仔细甄别。

解决这个问题的方法有两种

* 第一种思路，使用XMLHttpRequest对象的FormData对象。请点击[FormData](https://developer.mozilla.org/zh-CN/docs/DOM/XMLHttpRequest/FormData)以及[使用FormData](https://developer.mozilla.org/zh-CN/docs/DOM/XMLHttpRequest/FormData/Using_FormData_Objects)，或者请看一篇中文博客文档[XMLHttpRequest Level 2 使用指南](http://www.ruanyifeng.com/blog/2012/09/xmlhttprequest_level_2.html)。这个思路的实现是比较简单的，但是它仍然有缺点：需要&lt;input type="file" /&gt;这个表单元素来存放图片，而且在向FormData对象添加文件时，必须使用该表单元素的DOM对象。使用jQuery的同学一定要注意这个问题。

* 第二种思路，自己拼装http协议。按照multipart/form-data的格式自己拼装http协议的内容。看上去这个思路颇具难度。但，相信稍稍了解http协议和ajax技术的同学都可以写出来。不过，好消息是，这部分内容早就有人实现并封装了，而且HTML5的drag和drop方法也一并封装了，我们只需要实现页面的DOM操作就可以了。[传送门](https://github.com/weixiyen/jquery-filedrop)

下面我会给出一demo，介绍这个jq插件的使用方法。
[暂时放出项目链接，有空再写](https://github.com/straysh/fileupload)