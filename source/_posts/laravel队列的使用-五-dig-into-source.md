---
title: laravel队列的使用(五)-dig-into-source
date: 2016-07-07 11:46:09
tags: PHP
---
## Laravel队列源代码解析
这边文章中,将简单梳理一下Laravel队列的源代码,主要弄清楚代码的执行流.

我们将从消费队列的两个终端命令开始并以`queue:work`为重点

#### 一、./artisan queue:listen --timeout=30 --tries=3
首先打开项目根下的`artisan`文件,可以看到调用了`Illuminate\Console\Kernel`对象的handle()方法
```php
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$status = $kernel->handle(
    $input = new Symfony\Component\Console\Input\ArgvInput,
    new Symfony\Component\Console\Output\ConsoleOutput
);

```

定位到`Illuminate\Console\Kernel::handle()`函数, try-catch中的主代码只有两行.其中`$this->bootstrap()`启动/绑定/延迟启动 一些系统服务.
```php
$this->bootstrap();
return $this->getArtisan()->run($input, $output);
```

继续定位到`getArtisan()`函数, 这里实例化了一个`Artisan`对象并返回.结合上面的代码,知道这里依次执行了`Artisan::resolveCommands()`和`Artisan::run()`
```php
use Illuminate\Console\Application as Artisan;
...
if (is_null($this->artisan)) {
    return $this->artisan = (new Artisan($this->app, $this->events, $this->app->version()))
                        ->resolveCommands($this->commands);
}
return $this->artisan;
```

继续dig, 在`Artisan`的父类`Symfony\Component\Console\Application as SymfonyApplication`中找到`run`方法

`run`方法中`$exitCode = $this->doRun($input, $output);`

`doRun`方法中`$exitCode = $this->doRunCommand($command, $input, $output);`

`doRunCommand`方法中`$exitCode = $command->run($input, $output);`

到这里,看到调用了$command对象的run方法.$command来自`doRun`方法中`$command = $this->find($name);`.这里不再继续调试,直接给出$command对象的一些信息
```php
Illuminate\Queue\Console\ListenCommand {#634
  #name: "queue:listen"
  #description: "Listen to a given queue"
  #listener: Illuminate\Queue\Listener {#635
    #environment: null
    #sleep: 3
    #maxTries: 0
    #workerCommand: "'/usr/bin/php5' 'artisan' queue:work %s --queue=%s --delay=%s --memory=%s --sleep=%s --tries=%s"
    #outputHandler: null
  }
... ...
```

追踪`Illuminate\Queue\Console\ListenCommand::fire()`
```php
$this->listener->listen(
    $connection, $queue, $delay, $memory, $timeout
);
```

其中的`$this->listener`
```php
Illuminate\Queue\Listener {#635
  #environment: "local"
  #sleep: 3
  #maxTries: "3"
  #workerCommand: "'/usr/bin/php5' 'artisan' queue:work %s --queue=%s --delay=%s --memory=%s --sleep=%s --tries=%s"
  #outputHandler: Closure {#22
    class: "Illuminate\Queue\Console\ListenCommand"
    this: Illuminate\Queue\Console\ListenCommand {#634 …}
    parameters: array:2 [
      "$type" => []
      "$line" => []
    ]
    line: "107 to 109"
  }
}
```

追踪到`listen`函数
```php
public function listen($connection, $queue, $delay, $memory, $timeout = 60)
{
    $process = $this->makeProcess($connection, $queue, $delay, $memory, $timeout);
    while (true) {
        $this->runProcess($process, $memory);
    }
}
```

追踪`runProcess`函数,找到Process类的
```php
public function run($callback = null)
{
    $this->start($callback);
    return $this->wait();
}
# start函数中,最终看到执行了命令
'/usr/bin/php5' 'artisan' queue:work '' --queue='default' --delay=0 --memory=128 --sleep=3 --tries=3 --env='local'
```

到这里,已经很清楚了.`./artisan queue:listen`启动了一个死循环, 不停的尝试执行`./artisan queue:work`

#### 二、./artisan queue:work --daemon --tries=3
同上, 不同之处在于, `doRunCommand`方法中`$exitCode = $command->run($input, $output);`中$command
```php
Illuminate\Queue\Console\WorkCommand {#610
  #name: "queue:work"
  #description: "Process the next job on a queue"
  #worker: Illuminate\Queue\Worker {#611
... ...
```

追踪`Illuminate\Queue\Console\WorkCommand::fire()`
```php
$response = $this->runWorker(
    $connection, $queue, $delay, $memory, $this->option('daemon')
);
```

```php
protected function runWorker($connection, $queue, $delay, $memory, $daemon = false)
{
    if ($daemon) {
        $this->worker->setCache($this->laravel['cache']->driver());

        $this->worker->setDaemonExceptionHandler(
            $this->laravel['Illuminate\Contracts\Debug\ExceptionHandler']
        );

        return $this->worker->daemon(
            $connection, $queue, $delay, $memory,
            $this->option('sleep'), $this->option('tries')
        );
    }

    return $this->worker->pop(
        $connection, $queue, $delay,
        $this->option('sleep'), $this->option('tries')
    );
}
```

`runWorker`中的`$this->worker`
```php
Illuminate\Queue\Worker {#611
  #manager: Illuminate\Queue\QueueManager {#612
    #app: Illuminate\Foundation\Application {#3
```

首先对于不带`--daemon`的命令,那么上文中最后提到`./artisan queue:work`执行的就是`$this->worker->pop`.从队列列表中pop一个任务出来执行.执行完成之后sleep若干秒,进入while(true)死循环,无限重试pop.或者在内存使用超过`--memory`限制时,调用`die`终止进程.

然后, 继续dig `--daemon`模式, 找到`Illuminate\Queue\Worker::daemon()`
```php
public function daemon($connectionName, $queue = null, $delay = 0, $memory = 128, $sleep = 3, $maxTries = 0)
{
    $lastRestart = $this->getTimestampOfLastQueueRestart();

    while (true) {
        if ($this->daemonShouldRun()) {
            $this->runNextJobForDaemon(
                $connectionName, $queue, $delay, $sleep, $maxTries
            );
        } else {
            $this->sleep($sleep);
        }

        if ($this->memoryExceeded($memory) || $this->queueShouldRestart($lastRestart)) {
            $this->stop();
        }
    }
}
```

这里还是一个死循环.依次执行
* 尝试`daemonShouldRun()`, 若网站启用了`maintaince`模式则返回FALSE,否则广播`'illuminate.queue.looping'`事件
* `runNextJobForDaemon()`函数中,仍然是尝试从队列列表中pop任务出来执行
* 若`daemonShouldRun()`检测到FALSE, sleep若干秒
* 内存检测,在内存使用超过`--memory`限制时,调用`die`终止进程.