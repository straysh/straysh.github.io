---
title: BlowFish_Gin源码阅读
date: 2020-03-08 18:34:40
tags: 
- Golang
categories: 
- 博文
---
持续整理中，不适合阅读
# GIN版本 commithash a71af9c144f9579f6dbe945341c1df37aaf09c0d

# Gin框架的特点
- 快：路由使用`radix trie`实现，检索路径短。无反射。API性能可预测。
- 支持中间件：请求可以有多个中间件逐个处理，最后交给业务处理。例如：`Logger`,`Authorization`,`GZIP`,最后写入数据库。
- 若发生了`panic`，Gin可以捕获并恢复错误，因此服务并不会终止，且可有机会介入错误恢复的过程。
- JSON校验：Gin可以解析并校验请求的json数据，例如检查字段值。
- 路由分组：更好的组织路由。通过分组将需要鉴权和不需鉴权的路由分开，分组可以无限嵌套且不影响性能。
- 错误管理：Gin可以和很方便的收集错误信息。最后使用中间件将错误写入文件或数据库或发送到网络上。
- 内置视图渲染：提供了易用的接口来渲染`JSON`，`XML`和`HTML`。
- 可扩展：自定义中间件非常容易。

# 路由
## `Trie`
`trie`译为字典树或单词查找树或前缀树。这是一种搜索树——存储动态集合或关联数组的有序的树形数据结构，且通常使用字符串做键。与二叉搜索树不同，其节点上并不直接存键。其在树中的位置决定了与其关联的键。所有的子节点都有相同的前缀，而根节点对应的是空字符串。键只与叶子节点关联。

`trie`术语的发明者念`/ˈtriː/`(tree)，而有些作者念为`/ˈtraɪ/`以便和tree区别。

下图是一颗字典树，描述了键值为`A`、`to`、`tea`、`ted`、`ten`、`i`、`in`、`inn`的情况。（图中节点并不是完全有序的，虽然应该如此：如root节点与`t`节点）
![wiki字典树](/images/gin/Trie_example.svg)

不难想象，字典树典型的应用场景是单词计数。

### `trie`通常用来取代`hash table`，因为有如下优势：
- 在最坏的情况下，`trie`的时间复杂度是`O(m)`，其中m是字符串的长度。但哈希表有`key`碰撞的情况，最坏的情况下其复杂度是`O(N)`，虽然通常是`O(1)`，且计算哈希的复杂度是`O(m)`。
- `trie`中没有碰撞。
- 当`trie`中一个`key`对应多个值时，会使用`buckets`来存储多个值，与哈希表中发生碰撞时使用的桶相似。
- 不论有多少个`key`，都不需哈希函数或重哈希函数。
- `key`的路径是有序的。

### 但同时，相对哈希表，`trie`有如下缺点：
- `trie`的搜索通常比哈希表慢，特别是需要从硬盘上加载数据时。
- 浮点数做`key`通常导致链路过长。
- 有些`trie`可能比哈希表需要更多的空间，因为每一个字符都要分配内存。而哈希表只需要申请一块内存。

![trie_001](/images/gin/trie_example_001.png)

## `Radix Tree`
`radix tree`也叫`radix trie`或`compact prefix trie`。在字典树中，每一个字符都要占一个节点，这样造成树过高。`radix trie`则将唯一的子节点压缩到自身来降低树的高度。

---
参考资料：
1. [字典树](https://en.wikipedia.org/wiki/Trie)
1. [Radix树](https://en.wikipedia.org/wiki/Radix_tree)
1. [Trie Data Structure Tutorial - Introduction to the Trie Data Structure](https://www.youtube.com/watch?v=CX777rfuZtM)
1. [Trie and Patricia Trie Overview](https://www.youtube.com/watch?v=jXAHLqQthKw)
1. [图解Redis中的Radix树](https://mp.weixin.qq.com/s/HzGS0ekNFubJGjj19NxlEw)
1. [Linux 内核数据结构：Radix树](https://mp.weixin.qq.com/s/4DWC9Upv2UEXKssb8DDwVw)

# 解析请求参数

# 渲染JSON

# session & cookie

# URL重定向

# goroutin inside a middleware

# 日志模块
## debug日志
`/debug.go#L55`
```golang
func debugPrint(format string, values ...interface{}) {
    if IsDebugging() {
        if !strings.HasSuffix(format, "\n") {
            format += "\n"
        }
        // DefaultWriter是在项目bootstrap阶段配置的写句柄
        // 可以通过DefaultWriter=io.MultiWriter(...)自定义
        // 也可以使用默认值os.Stdout见/mode.go#L31-38
        fmt.Fprintf(DefaultWriter, "[GIN-debug] "+format, values...)
    }
}
```

`/debug.go#L97`
```golang
func debugPrintError(err error) {
    if err != nil {
        if IsDebugging() {
            // DefaultErrorWriter is the default io.Writer used by Gin to debug errors
            fmt.Fprintf(DefaultErrorWriter, "[GIN-debug] [ERROR] %v\n", err)
        }
    }
}
```

## 路由日志
`/logger.go#L131`
```golang
// defaultLogFormatter is the default log format function Logger middleware uses.
var defaultLogFormatter = func(param LogFormatterParams) string {
    var statusColor, methodColor, resetColor string
    if param.IsOutpu123456
    or() {
        statusColor = param.StatusCodeColor()
        methodColor = param.MethodColor()
        resetColor = param.ResetColor()
    }

    if param.Latency > time.Minute {
        // Truncate in a golang < 1.8 safe way
        param.Latency = param.Latency - param.Latency%time.Second
    }
    // 默认日志格式：
    //             [GIN] 时间戳|HTTP_Code|响应时间|客户IP| http_verb url 错误信息 
    return fmt.Sprintf("[GIN] %v |%s %3d %s| %13v | %15s |%s %-7s %s %#v\n%s",
        param.TimeStamp.Format("2006/01/02 - 15:04:05"),
        statusColor, param.StatusCode, resetColor,
        param.Latency,
        param.ClientIP,
        methodColor, param.Method, resetColor,
        param.Path,
        param.ErrorMessage,
    )
}
```

`/logger.go#L203`
```golang
// LoggerWithConfig instance a Logger middleware with config.
func LoggerWithConfig(conf LoggerConfig) HandlerFunc {
    formatter := conf.Formatter
    if formatter == nil {
        formatter = defaultLogFormatter
    }

    out := conf.Output
    if out == nil {
        out = DefaultWriter
    }

    notlogged := conf.SkipPaths

    isTerm := true

    if w, ok := out.(*os.File); !ok || os.Getenv("TERM") == "dumb" ||
        (!isatty.IsTerminal(w.Fd()) && !isatty.IsCygwinTerminal(w.Fd())) {
        isTerm = false
    }

    var skip map[string]struct{}

    if length := len(notlogged); length > 0 {
        skip = make(map[string]struct{}, length)

        for _, path := range notlogged {
            skip[path] = struct{}{}
        }
    }

    return func(c *Context) {
        // Start timer
        start := time.Now()
        path := c.Request.URL.Path
        raw := c.Request.URL.RawQuery

        // Process request
        c.Next()

        // Log only when path is not being skipped
        if _, ok := skip[path]; !ok {
            param := LogFormatterParams{
                Request: c.Request,
                isTerm:  isTerm,
                Keys:    c.Keys,
            }

            // Stop timer
            param.TimeStamp = time.Now()
            param.Latency = param.TimeStamp.Sub(start)

            param.ClientIP = c.ClientIP()
            param.Method = c.Request.Method
            param.StatusCode = c.Writer.Status()
            param.ErrorMessage = c.Errors.ByType(ErrorTypePrivate).String()

            param.BodySize = c.Writer.Size()

            if raw != "" {
                path = path + "?" + raw
            }

            param.Path = path

            fmt.Fprint(out, formatter(param))
        }
    }
}
```

# Build a single binary with templates
See a complete example in the https://github.com/gin-gonic/examples/tree/master/assets-in-binary directory.

# http2 server push
https on port 8080

# go服务要不要配nginx前端


---
参考阅读:
1. [Gin的路由为什么这么快?]()

---
参考资料:
