---
title: laravel队列的使用(一)
date: 2016-07-06 16:11:28
tags: PHP
categories:
- 博文
---
一些对数据一致性要求不高的场景下(如行为日志、各种统计数字如浏览数/评论数),可以使用事件/监听将这部分代码从主逻辑上剥离出来.

优点有二:①提高主逻辑的效率/降低主逻辑的复杂度 ②这部分异步代码执行失败不会对中断主逻辑的执行.

在Lravel中使用event/listener很容易实现.但有时我们需要延时任务,例如用户注册成功5分钟后给用户发送一封邮件通知.这时就需要引入延时队列了.

参考: [Lavavel中的事件和任务, 各在什么场景下使用?](/article/laravel_event_vs_jobs)

## 一个同步执行的队列示例
同event一样,在`app/config/queue.php`中`'default' => env('QUEUE_DRIVER', 'sync'),` 设置默认的队列驱动.

当前Lravel支持的驱动列表在`app/config/queue.php::connections`数组中
```php
sync       => 同步模式,在主逻辑中直接执行,便于调试  
database   =>  使用mysql作为驱动,需要使用`./artisan queue:table && ./artisan migrate`创建jobs表
beanstalkd =>  beanstalkd(一个独立的队列服务)作为驱动, 在下篇文章中将详细讲解如何安装并使用beanstalkd
sqs        =>  Amazon SQS: aws/aws-sdk-php ~3.0
iron       =>  类似sql的云端队列服务
redis      =>  Redis: predis/predis ~1.0
```
Step1 在.env中设置`QUEUE_DRIVER=sync` 或者删除该行,启用同步队列

Step2 在`app/Jobs`目录中新建`BaseJob.php`
```php
<?php namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Bus\SelfHandling;

class BaseJob extends Job implements SelfHandling, ShouldQueue
{
    use InteractsWithQueue;

}
```

Step3 在`app/Jobs`目录中新建`DemoJob.php`
```php
<?php namespace App\Jobs;

use Illuminate\Contracts\Mail\Mailer;
use Illuminate\Support\Facades\Log;

class DemoJob extends BaseJob
{
    public $mailer;

    function __construct($username, $email)
    {
        $this->username = $username;
        $this->email = $email;
    }

    public function handle(Mailer $mailer)
    {
        $this->mailer = $mailer;
        $this->register();
        return TRUE;
    }


    //发送注册邮件
    private function register()
    {
        // 为简便我们把邮件写入log中
        Log::info("mail sent by DemoJob");
    }

}
```

Step4 生产一个队列任务.在任意可访问的api中添加如下方法,
```php
use App\Jobs\DemoJob;

class TestController extends Controller
{
    public function getIndex()
    {
        dd($this->dispatch( new DemoJob("username", "jobhancao@gmail.com") ));
    }
}
```
log输出如下:
```
[2016-07-06 16:07:30] local.INFO: mail to username/jobhancao@gmail.com sent by DemoJob
```