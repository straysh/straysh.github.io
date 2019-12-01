---
title: laravel队列的使用(四)-beanstalk-driver
date: 2016-07-07 10:45:11
tags: PHP
categories:
- 博文
---
## Beanstalk驱动的队列示例
在开始介绍如何在Laravel中使用Beanstalkd之前,我们先安装一个Beanstalkd的Web版管理工具.在文章的最后,会介绍队列中常用的其他几个api.
```bash
# composer会将Beanstalk Console以及它的所有依赖库安装到beanstalk_console目录.
composer create-project ptrofimov/beanstalk_console -s dev beanstalk_console
# 启动管理后台服务
php -S localhost:7654 -t public
# 启动beanstalkd
beanstalkd -l 127.0.0.1 -p 11300 &
```

Step0 首先,一定确保beanstalkd已经启动且端口是3000, 一定确保beanstalk_console已经启动.通过浏览器访问localhost:7654.点击Add server,添加一个beanstalkd服务器.

Step1 在.env中设置`QUEUE_DRIVER=beanstalkd` ,启用beanstalkd驱动

Step2 将`DemoJob::register()`中抛异常的测试代码注释掉,然后通过浏览器访问api,生产一个队列任务.在beanstalk_console中,你将看到:
![beanstalkd_01](http://images.straysh.com/laravel_beanstalkd_001.png)

Step3 消费队列不需要额外的代码编写,只需要在终端执行以下代码:
```bash
./artisan queue:listen --timeout=30 --tries=3
或者
./artisan queue:work --daemon --tries=3
```

Step4 在管理后台可以看到,队列任务已经被消费掉了

## Laravel队列常用API
在`DemoJob`类中,可以调用以下API,更加精确的控制队列操作
* $this->relase($waitSeconds) $waitSeconds秒后,将任务重新压入队列.(压入队列后任务不一定立即执行,取决于优先级等其他因素)
* $this->delete() 将任务从队列中移除.如本例中当检查email字段发现其格式不正确时,就应当删除该队列任务并return
* $this>attempts() 这个函数中包含了最大尝试的逻辑,最大尝试次数是通过命令启动队列时传入的`--tries=3`.通常这个api不需要手动调用,除非你要定制该函数.


另外,通过`$this->job`可以拿到`Illuminate\Queue\Jobs\BeanstalkdJob`对象,从而调用独属于Beanstalkd的api.具体的api可以查看源代码.
![beanstalkd_02](http://images.straysh.com/laravel_beanstalkd_002.png)
