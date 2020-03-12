---
title: BlowFish_Gin源码阅读
date: 2020-03-08 18:34:40
tags: 
- Golang
categories: 
- 博文
toc: true
fancybox: true
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

# 源代码阅读
## 服务启动
### Socket Server VS HTTP Server
HTTP是[应用层协议](/2020/02/27/网络-tcp-udp/#TCP-UDP工作在传输层)；Socket是系统提供的抽象接口，它直接操作传输层协议(如`TCP`、`UDP`等)来工作。它们不是一个层级上的概念。
所以，只要Socket两端不主动关闭连接，就可以通过TCP连接来双向通信。
而HTTP服务器则按照HTTP协议来通信：`建立TCP连接 🡺 客户端发送报文 🡺 服务器相应报文 🡺 客户端或服务器关闭连接`。每一个请求都要重复这个过程。虽说TCP协议是长连接的，但上层的HTTP协议会主动关闭它。
另外HTTP中有一个`Connection: keep-alive`头信息，来重用连接，减少创建连接的消耗。它受到重用次数和超时时间的限制(服务器设置)，触发限制时仍会主动断开连接。因此这个所谓的"长连接"和Socket长连接的本质是不同的。

Socket Server例子，内层的for循环读并不会主动关闭连接(不发生panic时)
```golang
func main() {
    srv, err := net.Listen("tcp", ":8080") // 协议，端口
    if err != nil {
        panic(err)
    }
    defer srv.Close()

    for {
        conn, err := srv.Accept() // 监听连接
        if err != nil {
            fmt.Println("accept failed:", err.Error())
            continue
        }

        go func(c net.Conn){
            defer c.Close()
            buf := make([]byte, 1024)
            for {
                n, err := c.Read(buf) // 尝试读数据
                if err != nil {
                    fmt.Println("read failed:", err.Error())
                    continue
                }

                receiveData := buf[:n] // 接收到的字节buf[0:n]
                fmt.Println("received data=", receiveData)
            }
        }(conn)
    }
}
```

HTTP Server
```golang
type handler struct {
}

func (h handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    requestUrl := r.URL.String()
    msg := fmt.Sprintf("request uri=%s\n", requestUrl)
    fmt.Println(msg)
    _, _ = w.Write([]byte(msg))
}
func main() {
    err := http.ListenAndServe("127.0.0.1:8080", handler{}) //地址、端口，处理句柄
    if err != nil {
        panic(err)
    }
}
```

HTTP Server的底层还是TCP连接，对比上面Socket Server的代码，我们期望在HTTP Server的实现里发现
1. 创建连接`net.Listen`
2. 网络监听`srv.Accept()`
3. 读取数据`c.Read(buf)`
4. 额外的，在服务端发送完数据后，应该要关闭连接

带着以上四个目标，我们来跟一下HTTP Server的启动过程。
1. 启动HTTP Server`err := http.ListenAndServe("127.0.0.1:8080", handler{})` <a href="/images/golang/gin/Server_start.png" data-caption="Server_start" data-fancybox class="fancy_box_trg">&nbsp;</a>
2. 构造server对象 <a href="/images/golang/gin/Server_struct.png" data-caption="Server_struct" data-fancybox class="fancy_box_trg">&nbsp;</a>

```golang
func ListenAndServe(addr string, handler Handler) error {
    server := &Server{Addr: addr, Handler: handler}
    return server.ListenAndServe()
}
```
3. 调用server的`ListenAndServe`方法。在#Line9我们发现了`net.Listen("tcp", addr)`，**目标1找到**。

```golang
func (srv *Server) ListenAndServe() error {
	if srv.shuttingDown() {
		return ErrServerClosed
	}
	addr := srv.Addr
	if addr == "" {
		addr = ":http"
	}
	ln, err := net.Listen("tcp", addr)
	if err != nil {
		return err
	}
	return srv.Serve(ln)
}
```
4. 跟入#Line13行代码`srv.Serve(ln)` <a href="/images/golang/gin/srv.Serve.png" data-fancybox data-caption="srv.Serve" class="fancy_box_trg">&nbsp;</a>。这里，#Line4:`rw,err := l.Accept()`，**目标2找到**。
这里的`rw`即是`net.Conn`，在#Line14重新包装了`rw` <a href="/images/golang/gin/srv.newConn.png" data-fancybox data-caption="srv.newConn" class="fancy_box_trg">&nbsp;</a>，，并在#Line14启动协程`go c.serve(connCtx)`。
到此，服务器已经正常启动，并且给每一个新进来的Request都分配了一个协程。#Line3的for循环配合golang轻协程的特性，一个高并发的web服务器启动了。

```golang
func (srv *Server) Serve(l net.Listener) error {
    ...
    for {
        rw, err := l.Accept()
        ...
        connCtx := ctx
        if cc := srv.ConnContext; cc != nil {
            connCtx = cc(connCtx, rw)
            if connCtx == nil {
                panic("ConnContext returned nil")
            }
        }
        tempDelay = 0
        c := srv.newConn(rw)
        c.setState(c.rwc, StateNew) // before Serve can return
        go c.serve(connCtx)
    }
}
```
5. 继续挖`go c.serve(connCtx)`看看`net/http`是如何处理一个Request的。先快速扫一下这个函数里面做了哪些事情：
  1. #Line20`w, err := c.readRequest(ctx)`构建Response对象。向内追找到HTTP协议的解析过程`newTextprotoReader`。**目标3找到**。
  2. #Line35`serverHandler{c.server}.ServeHTTP(w, w.req)` 处理业务逻辑(即用户定义的路由逻辑)。`ServeHTTP`的第一个参数`w`就是Response对象，负责向客户端响应数据，`w.req`即Request，负责解析请求参数、头信息等。
  3. #Line40`w.finishRequest()`中有flush操作，到这里服务器已经完成了数据响应。
  3. #Line50-64处理了`keep-alive`重用连接和`idle_timeout`空闲超时断开连接的逻辑。这里涉及到一些网络知识不具体展开。
  若设置了`Connection: close`或者服务器保持连接直到空闲超时，都会return从而执行#Line5中的defer代码,注意源代码中的#Line1775~1777 <a href="/images/golang/gin/defer_conn_close.png" data-fancybox data-caption="defer_conn_close" class="fancy_box_trg">&nbsp;</a>。**目标4找到**
  4. 需要额外关注一下#Line35行上面的注释 <a href="/images/golang/gin/serverHandler_comments.png" data-fancybox data-caption="serverHandler_comments" class="fancy_box_trg">&nbsp;</a>。这里明确指出了`net/http`没有实现pipeline，理由是在HTTP1.1中pipeline并没有被（客户端/浏览器）广泛的实现，因此扔到了和HTTP2.0一起实现。
  
```golang
// Serve a new connection.
func (c *conn) serve(ctx context.Context) {
    c.remoteAddr = c.rwc.RemoteAddr().String()
    ctx = context.WithValue(ctx, LocalAddrContextKey, c.rwc.LocalAddr())
    defer func() {...}()

    ...

    // HTTP/1.x from here on.

    ctx, cancelCtx := context.WithCancel(ctx)
    c.cancelCtx = cancelCtx
    defer cancelCtx()

    c.r = &connReader{conn: c}
    c.bufr = newBufioReader(c.r)
    c.bufw = newBufioWriterSize(checkConnErrorWriter{c}, 4<<10)

    for {
        w, err := c.readRequest(ctx)
        if c.r.remain != c.server.initialReadLimitSize() {
            // If we read any bytes off the wire, we're active.
            c.setState(c.rwc, StateActive)
        }
        if err != nil {...}

        // Expect 100 Continue support
        req := w.req
        if req.expectsContinue() {...}

        c.curReq.Store(w)

        if requestBodyRemains(req.Body) {...}

        serverHandler{c.server}.ServeHTTP(w, w.req)
        w.cancelCtx()
        if c.hijacked() {
            return
        }
        w.finishRequest()
        if !w.shouldReuseConnection() {
            if w.requestBodyLimitHit || w.closedRequestBodyEarly() {
                c.closeWriteAndWait()
            }
            return
        }
        c.setState(c.rwc, StateIdle)
        c.curReq.Store((*response)(nil))

        if !w.conn.server.doKeepAlives() {
            // We're in shutdown mode. We might've replied
            // to the user without "Connection: close" and
            // they might think they can send another
            // request, but such is life with HTTP/1.1.
            return
        }

        if d := c.server.idleTimeout(); d != 0 {
            c.rwc.SetReadDeadline(time.Now().Add(d))
            if _, err := c.bufr.Peek(4); err != nil {
                return
            }
        }
        c.rwc.SetReadDeadline(time.Time{})
    }
}
```
P.S. 这里再额外挖一下#Line35`serverHandler{c.server}.ServeHTTP(w, w.req)`的实现，将用户代码和`net/http`包打通。
这里首先构造了一个serverHandler对象并调用了它的`ServeHTTP`方法。<a href="/images/golang/gin/serverHandler_ServeHTTP.png" data-fancybox data-caption="serverHandler_ServeHTTP" class="fancy_box_trg">&nbsp;</a>
之后，调用了`sh.srv.Handler.ServeHTTP(rw, req)`，这里的`srv`就是本文步骤2中`构造server对象`的这个server对象。
因此这里的`.Handler.ServeHTTP`最终调用的是我们的`HTTP Server`demo中#Line4-9的代码。

## Gin的启动过程
挖完了`net/http`包，对http网络请求的过程有了一个整体的认知，接下来正式开挖Gin。
1. 启动服务非常简便`engine := gin.New()`然后`engine.Run(":8080")` <a href="/images/golang/gin/gin_New.png" data-caption="gin_New" data-fancybox class="fancy_box_trg">&nbsp;</a>

```golang
func main() {
    engine := gin.New()

    //engine.GET("/someGet", getting)
    ...
    //engine.Use(middlewares.Authenticate())

    engine.Run(":8080")
}
```
2. `gin.New()`的细节。其中`Engine`的结构 <a href="/images/golang/gin/gin_Engine.png" data-caption="gin_Engine" data-fancybox class="fancy_box_trg">&nbsp;</a>
其中：
- `RedirectTrailingSlash`若请求地址是`/foo/`且未匹配，但`/foo`可以匹配，则将客户端重定向到`/foo`，若请求是GET则状态码是301，其他动词则是307
- `RedirectFixedPath`未匹配时尝试去除多余的`../`或`//`以修正路径(且转化为小写)，例如`/FOO`或`/..//FOO`都能匹配`/foo`
- `HandleMethodNotAllowed`未匹配时尝试其他动词，若路由匹配则以状态码405响应，否则将请求代理到`NotFound`句柄。

```golang
// New returns a new blank Engine instance without any middleware attached.
// By default the configuration is:
// - RedirectTrailingSlash:  true
// - RedirectFixedPath:      false
// - HandleMethodNotAllowed: false
// - ForwardedByClientIP:    true
// - UseRawPath:             false
// - UnescapePathValues:     true
func New() *Engine {
	debugPrintWARNINGNew() //debug模式下打印开发模式警告
	engine := &Engine{
		RouterGroup: RouterGroup{ // 路由分组
			Handlers: nil,
			basePath: "/",
			root:     true,
		},
		FuncMap:                template.FuncMap{}, // 模板函数？
		RedirectTrailingSlash:  true,
		RedirectFixedPath:      false,
		HandleMethodNotAllowed: false,
		ForwardedByClientIP:    true,
		AppEngine:              defaultAppEngine,
		UseRawPath:             false,
		UnescapePathValues:     true,
		MaxMultipartMemory:     defaultMultipartMemory,
		trees:                  make(methodTrees, 0, 9),
		delims:                 render.Delims{Left: "{{", Right: "}}"},
		secureJsonPrefix:       "while(1);",
	}
	engine.RouterGroup.engine = engine
	engine.pool.New = func() interface{} { // 连接池
		return engine.allocateContext()
	}
	return engine
}
```

3. `engine.Run(":8080")`中的细节。它仅仅是`http.ListenAndServe(address, engine)`的语法糖，啥也没做。
因此可以看出来，Gin对网络底层没做任何处理，直接使用了`net/http`包。其核心代码全部在`Engine`这个结构体中。根据我们分析`net/http`包的经验，Engine中一定实现了`ServeHTTP`方法

```golang
// Run attaches the router to a http.Server and starts listening and serving HTTP requests.
// It is a shortcut for http.ListenAndServe(addr, router)
// Note: this method will block the calling goroutine indefinitely unless an error happens.
func (engine *Engine) Run(addr ...string) (err error) {
	defer func() { debugPrintError(err) }()

	address := resolveAddress(addr) // addr 是动态参数，默认值取:8080
	debugPrint("Listening and serving HTTP on %s\n", address)
	err = http.ListenAndServe(address, engine)
	return
}
```

4. `engine.ServeHTTP`到底干了啥？ `Engine`结构体的方法集：
![gin_Engine_methods](/images/golang/gin/gin_Engine_methods.png)

`gin.Context` <a href="/images/golang/gin/gin_Context.png" data-caption="gin_Context" data-fancybox class="fancy_box_trg">&nbsp;</a>
```golang
// ServeHTTP conforms to the http.Handler interface.
func (engine *Engine) ServeHTTP(w http.ResponseWriter, req *http.Request) {
    // 源码#Line145行定义，这里返回engine.allocateContext()的结果
    // 是*gin.Context指针
    c := engine.pool.Get().(*Context) // 从连接池中取出一个连接
    c.writermem.reset(w) // 重置 http.responseWriter
    c.Request = req
    c.reset() // 重置Context

    engine.handleHTTPRequest(c) // 核心!!! 路由处理逻辑

    engine.pool.Put(c) // 执行结束，将连接放入连接池
}
```

5. `engine.handleHTTPRequest(c)`的细节。

![engine_handleHTTPRequest](/images/golang/gin/engine_handleHTTPRequest.png)

可以看到源码#Line403行调用`c.Next()`后`c.index`从-1自增到0，然后调用`c.handlers[0]`句柄，执行第一个中间件`RouteLogger`，而在中间件中我们需要再次调用`c.Next()`。非常明显的一个递归调用，然后执行第二个中间件`RecoverWithWriter`，之后调用`GET`动词注册的路由`api.Ping`，最后调用链路依次返回。
参考下图（点击可放大）
<a href="/images/golang/gin/gin_Route_Next.png" data-caption="gin_Route_Next" data-fancybox>
<img src="/images/golang/gin/gin_Route_Next.png" alt="gin_Route_Next">
</a>

# 路由
Gin的路由按HTTP动词，分9组（默认`engine.trees = make(methodTrees, 0, 9)`）分别对应`GET`组，`POST`组，`PUT`组等。`methodTrees`是`[]methodTree`的别名：`type methodTrees []methodTree`。
`node`是一颗前缀树或`Radix trie`。
```golang
type methodTree struct {
	method string // 即HTTP动词，如GET
	root   *node  // 路由链路
}
```

## `Trie`
`trie`译为字典树或单词查找树或前缀树。这是一种搜索树——存储动态集合或关联数组的有序的树形数据结构，且通常使用字符串做键。与二叉搜索树不同，其节点上并不直接存键。其在树中的位置决定了与其关联的键。所有的子节点都有相同的前缀，而根节点对应的是空字符串。键只与叶子节点关联。

`trie`术语的发明者念`/ˈtriː/`(tree)，而有些作者念为`/ˈtraɪ/`以便和tree区别。

下图是一颗字典树，描述了键值为`A`、`to`、`tea`、`ted`、`ten`、`i`、`in`、`inn`的情况。（图中节点并不是完全有序的，虽然应该如此：如root节点与`t`节点）
![wiki字典树](/images/golang/gin/Trie_example.svg)

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

<img src="/images/golang/gin/trie_example_001.png" alt="trie_001" style="width:50%" />

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
