---
title: go协程是如何回收的
date: 2021-03-16 13:46:25
tags: 
- Golang
categories: 
- 博文
toc: true
fancybox: true
---
注：该文章基于Go 1.13
---
![](/images/golang/a_journey_with_go/go_recycle_01.png)

协程很容易创建，有很小的初始栈空间，以及快速切换的上下文。大家都爱协程，但创建大量短命的协程，要花费时间去创建和销毁它们。

## 协程的生命周期
下面通过一个小例子说明协程是如何被复用的。这是Go文档中的[一个示例](https://play.golang.org/p/9U22NfrXeq)。  
![](/images/golang/a_journey_with_go/go_recycle_02.png)

程序中创建了大量的协程去过滤素数，Go负责这些协程的创建和销毁。实际上，Go维护了一个空闲协程的列表：    
![](/images/golang/a_journey_with_go/go_recycle_03.png)

每一个`P`维护自己的本地队列，在管理空闲协程时无需加锁。一个协程退出时，会被放置到本地队列中。  
![](/images/golang/a_journey_with_go/go_recycle_04.png)

但为了更高效的分发协程，调度器也有自己的列表。实际上是两个列表：一个基于栈实现的列表，一个非栈的列表。   
![](/images/golang/a_journey_with_go/go_recycle_05.png)

因为任何线程都可以访问他们，使用了锁来保护这两个列表，。当`P`的协程数超过64时，调度器从`P`的本地队列中获取协程放入中央列表。一次转移会抽取半数协程，那么`P`中将只剩于半数：   
![](/images/golang/a_journey_with_go/go_recycle_06.png)

从上面的描述中，这个工作流非常直白，但实际工作中根据协程的内存分配情况会有不同的操作对则。

## 条件
回收协程能够节省再分配的开销。但，协程的栈空间是动态的，其工作时可能分配了很大的栈。回收协程时，Go不会保留其栈(超过默认2k时)。

上面计算素数的程序很简单，且不会增长协程的栈空间，Go可以直接重用它们。此处为压测结果：   
```
With recycling               Without recycling
name           time/op       name           time/op
PrimeNumber     12.7s ± 3%   PrimeNumber     12.1s ± 3%
PrimeNumber-8   2.27s ± 4%   PrimeNumber-8   2.13s ± 3%

name           alloc/op      name           alloc/op
PrimeNumber    1.83MB ± 0%   PrimeNumber    5.82MB ± 4%
PrimeNumber-8  1.52MB ± 7%   PrimeNumber-8  5.90MB ±21%
```

没有关闭协程回收的方法，作者通过直接修改go标准库来测试的。可以看见，协程回收减少了3M内存分配。

让我们再来看另一个使用大栈空间的例子：
```
func ping() {
   for i := 0; i < 10; i++ {
      var wg sync.WaitGroup
      for g := 0; g < 10; g++ {
         wg.Add(1)
         go func() {
            _, err := http.Get(`https://httpstat.us/200`)
            if err != nil {
               panic(err)
            }
            wg.Done()
         }()
      }
      wg.Wait()
   }
}
```

压测结果如下：
```
With recycling               Without recycling
name           time/op       name           time/op
PingUrl     12.8s ± 2%       PingUrl     12.8s ± 3%
PingUrl-8   12.6s ± 0%       PingUrl-8   12.7s ± 3%

name           alloc/op      name           alloc/op
PingUrl    9.21MB ± 0%       PingUrl    9.44MB ± 0%
PingUrl-8  9.28MB ± 0%       PingUrl-8  9.43MB ± 0%
```

由于栈空间很大，这里实际效果不明显。

---
- 原文 [Go: How Does Go Recycle Goroutines?](https://medium.com/a-journey-with-go/go-how-does-go-recycle-goroutines-f047a79ab352)