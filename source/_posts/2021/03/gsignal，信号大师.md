---
title: gsignal，信号大师
date: 2021-03-16 13:47:25
tags: 
- Golang
categories: 
- 博文
toc: true
fancybox: true
---
注：该文章基于Go 1.13
---

`signal`包提供了一些允许Go程序与信号量交互的方法。在深入前，我们先从这段监听器代码开始。

## 信号订阅
我们使用通道(`channel`)来订阅信号。以下代码监听`中断信号`或`终端缩放`：
```go
package main

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"
)

func main() {
	done := make(chan bool, 1)

	s1 := make(chan os.Signal, 1)
	signal.Notify(s1, syscall.SIGINT, syscall.SIGTERM)

	go func(){
		<-s1
		fmt.Println(`/!\ The program is going to exit...`)
		done <- true
	}()

	s2 := make(chan os.Signal, 1)
	signal.Notify(s2, syscall.SIGWINCH)

	go func(){
		for {
			<- s2
			fmt.Println(`/!\ The terminal has been resized.`)
		}
	}()

	<- done
}
```

每个通道都有自己的事件逻辑，如图：   
![](/images/golang/a_journey_with_go/signal_events_diagram.png)

Go也提供了停止向通道发送通知的方法`Stop(os.Signal)`，或者忽略信号的方法`Ignore(...os.Signal)`。举例：
```go
package main

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"
)

func main() {
	done := make(chan bool, 1)

	s2 := make(chan os.Signal, 1)
	signal.Notify(s2, syscall.SIGWINCH)
	signal.Ignore(syscall.SIGINT)

	go func(){
		<- s2
		fmt.Println(`/!\ The terminal has been resized.`)
		signal.Stop(s2)

		// will block forever since we stop listening
		<- s2
		done <- true
	}()

	<- done
}
```

这段程序无法通过`CTL+C`终止，而且在首次接收到终端缩放信号时，停止了该通道，导致其此后再接收不到任何信号。那么接下来，我们看看信号是如何被监听和处理的。

## gsignal
在初始化阶段，`signal`派生了一个在循环中处理信号量的消费者协程。该协程处在休眠状态，直到接收到通知。过程如图：   
![](/images/golang/a_journey_with_go/gsignal_spawn_loop.png)

当信号发到达程序时，信号句柄将该信号量代理给一个特殊的协程`gsignal`。这个协程初始化时使用了一个很大的栈空间(32k，为满足不同操作系统的要求)，该栈大小固定不会再增长。每一个线程(图中标以M)都有一个`gsignal`协程来处理信号量。如图：   
![](/images/golang/a_journey_with_go/gsignal_spawn_loop_2.png)

`gsignal`分析信号量并判断若能够被处理，则唤醒休眠的协程同时将信号量发送到队列。

同步信号量，如`SIGBUS`和`SIGFPE`，无法被处理并会导致panic。

然后，looping协程能够处理该信号。它找到订阅了该信号的第一个通道并将信号推送给它。   
![](/images/golang/a_journey_with_go/gsignal_spawn_loop_3.png)

处理信号的looping协程可以通过`go tool trace`可视化的观察。   
![](/images/golang/a_journey_with_go/gsignal_spawn_loop_5.png)

对`gsignal`加锁或阻塞会导致处理信号异常。同时因其有固定大小的栈空间，无法重分配内存。这就是为何在处理信号量的链路中需要两个独立的协程：一个协程将到达的信号尽快存储到队列，另一个协程循环的处理这个队列。

此时，我们可以对文中第一张图最终修改如下：   
![](/images/golang/a_journey_with_go/gsignal_spawn_loop_4.png)

---
- 原文 [Go: gsignal, Master of Signals](https://medium.com/a-journey-with-go/go-gsignal-master-of-signals-329f7ff39391)