---
title: go协程是如何启动和退出的
date: 2021-03-16 13:44:25
tags: 
- Golang
categories: 
- 博文
toc: true
fancybox: true
---
注：该文章基于Go 1.14
---

在Go语言中，go协程是携带当前运行程序信息(诸如栈、程序计数器、或其当前OS线程)的结构体。Go调度器依据这些信息给其分配运行时间。调度器也需要关注这些协程的开始与退出，这两个阶段需要非常细致的管理。

关于栈和程序计数器，推荐阅读作者的另一篇文章[Go: What Does a Goroutine Switch Actually Involve?](https://medium.com/a-journey-with-go/go-what-a-goroutine-switch-actually-involve-394c202dddb7)

## 协程启动
启动协程非常简单。用代码举例：
```go
package main

import "sync"

func main() {
	var wg sync.WaitGroup
	wg.Add(1)

	go func(){
		println("goroutine is running...")
		wg.Done()
	}()

	println("main is running...")
	
	wg.Wait()
}
```

`main`程序在打印之前启动了一个协程。由于Go协程有其自己的运行时间，Go通知运行时(`runtime`)创建一个新的协程即：
- 创建stack
- 收集当前程序的计数器或调用方的数据。
- 更新协程的内部数据，如`ID`或`状态`。

但协程并不会立即获得运行时间。新创建的协程会入队到本地队列列首，并在调度器的下一轮调度时执行。下图是该状态的图示：   
![](/images/golang/a_journey_with_go/goroutine_scheduler_running.png)

将其放置在队首使得该协程在当前协程结束后会首先被执行。该协程要么在当前线程被执行，要么在其他线程执行(若发生了[线程窃取](https://medium.com/a-journey-with-go/go-what-a-goroutine-switch-actually-involve-394c202dddb7))。

协程创建过程在汇编代码中也能找到：  
![](/images/golang/a_journey_with_go/goroutine_creation_assembly.png)

一旦协程被创建且入队后，就继续执行`main`函数的后续代码。

## 协程退出
一个协程终止时，为避免浪费CPU时间，Go必须调度其他协程继续工作。也会保留这个协程以便之后[重用](https://medium.com/a-journey-with-go/go-how-does-go-recycle-goroutines-f047a79ab352)。

Go需要一种方式来感知到协程的退出。该控制方法在协程创建时已确定。当协程创建时，在将程序计数器指向真实被调函数前，Go在栈中设置了`goexit`函数。则巧妙的使得协程终止工作时一定会调用`goexit`函数。下面的代码可以观察这个过程：
```go
package main

import (
	"fmt"
	"runtime"
	"sync"
)

func main() {
	var wg sync.WaitGroup
	wg.Add(1)

	go func(){
		var skip int

		for {
			_, file, line, ok := runtime.Caller(skip)
			if !ok {
				break
			}
			fmt.Printf("%s:%d\n", file, line)
			skip++
		}
		wg.Done()
	}()

	println("main is running...")

	wg.Wait()
}
```

输出结果为其调用栈信息:
```
/app/straysh/docs/translation/1.go:17
/home/uos/.gvm/gos/go1.14/src/runtime/asm_amd64.s:1373
```

`src/runtime/asm_amd64.s`的代码如下  
![](/images/golang/a_journey_with_go/asm_amd64_assembly.png)

然后Go会切换到`go`去调度另一个协程。

也可以通过手动调用`runtime.Goexit()`来结束一个协程:
```go
package main

import (
	"runtime"
	"sync"
)

func main() {
	var wg sync.WaitGroup
	wg.Add(1)

	go func(){
		defer wg.Done()
		runtime.Goexit()
		println("never executed")
	}()

	println("main is running...")

	wg.Wait()
}
```

该函数会首先执行defer函数，然后继续执行调用该协程前的函数。

---
- 原文 [Go: How Does a Goroutine Start and Exit?](https://medium.com/a-journey-with-go/go-how-does-a-goroutine-start-and-exit-2b3303890452)