---
title: laravel队列的使用(三)-beanstalk-driver
date: 2016-07-06 16:16:53
tags: PHP
categories:
- 博文
---
## 数据库驱动的队列示例
这次增加对失败的队列任务的处理,详细内容从Step5开始

Step1 在.env中设置`QUEUE_DRIVER=database` ,启用数据库驱动

Step2 生成jobs表
```bash
php artisan queue:table
php artisan migrate
```
Step3 其他代码不变.现在通过浏览器访问api, 生产一个测试队列任务,在jobs表中:
```sql
mysql> select * from jobs \G
*************************** 1. row ***************************
          id: 1
       queue: default
     payload: {"job":"Illuminate\\Queue\\CallQueuedHandler@call","data":{"command":"O:16:\"App\\Jobs\\DemoJob\":6:{s:6:\"mailer\";N;s:5:\"queue\";N;s:5:\"delay\";N;s:6:\"\u0000*\u0000job\";N;s:8:\"username\";s:8:\"username\";s:5:\"email\";s:19:\"jobhancao@gmail.com\";}"}}
    attempts: 0
    reserved: 0
 reserved_at: NULL
available_at: 1467793393
  created_at: 1467793393
1 row in set (0.00 sec)
```

Step4 消费队列不需要额外的代码编写,只需要在终端执行以下代码:
```bash
./artisan queue:listen --timeout=30 --tries=3
或者
./artisan queue:work --daemon --tries=3
```
`queue:work`若以--daemon方式启动,将不需要重复绑定和注册框架的服务,CPU利用率更高.但此模式下,如文件句柄、画图句柄一定要及时释放,避免内存溢出.

Step5 对失败队列的处理.下面我们来模拟队列失败的场景.在这之前,先执行以下命令创建`failed_jobs`表:
```bash
php artisan queue:failed-table
```
Step6 在`DemoJob::register()`函数中手动抛出异常,模拟代码出现bug
```php
    //发送注册邮件
    private function register()
    {
        throw new \Exception("测试异常");
        // 为简便我们把邮件写入log中
        Log::info("mail to {$this->username}/{$this->email} sent by DemoJob");
    }
```

Step7 重复Step3-Step4 生产一个队列任务并消费之
```bash
$./artisan queue:listen --timeout=30 --tries=3            
  [Exception]  
  测试异常     
                              
  [Exception]  
  测试异常     
                             
  [Exception]  
  测试异常     
              
Failed: Illuminate\Queue\CallQueuedHandler@call
```

Step8 在`failed_jobs`表中:
```sql
mysql> select * from failed_jobs \G
*************************** 1. row ***************************
        id: 1
connection: database
     queue: default
   payload: {"job":"Illuminate\\Queue\\CallQueuedHandler@call","data":{"command":"O:16:\"App\\Jobs\\DemoJob\":6:{s:6:\"mailer\";N;s:5:\"queue\";N;s:5:\"delay\";N;s:6:\"\u0000*\u0000job\";N;s:8:\"username\";s:8:\"username\";s:5:\"email\";s:19:\"jobhancao@gmail.com\";}"}}
 failed_at: 2016-07-06 16:48:04
1 row in set (0.00 sec)
```

Step9 `failed_job`表中记录着失败的队列任务,在生产环境中可以用来debug, 对于已经失败的任务,执行以下命令重新将之压入队列并消费:
```bash
./artisan queue:retry all
```
