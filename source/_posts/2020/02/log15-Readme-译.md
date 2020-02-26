---
title: 'log15_Readme[译]'
date: 2020-02-10 15:41:45
toc: true
tags: 
- Golang
- Translation
categories: 博文
---
`log15`包提供了一种固执且简洁的最佳实践工具包(both human and machine readable)。它是仿造标准库`io`和`net/http`构建的。

这个包强制仅记录`key/value`对。键必须是字符串。值可以是任何类型。默认的输出格式是`logfmt`，也可以选择使用`JSON`格式。例如:
`log.Info("page accessed"， "path"， r.URL。Path， "user_id"， user.id)`
输出一行记录如下:
`lvl=info t=2014-05-02T16:07:23-0700 msg="page accessed" path=/org/71/profile user_id=9`

<!--more-->

### 快速入门
首先需要引入库文件：
`import log "github.com/inconshreveable/log15"`
然后可以开始使用了：
```golang
func main() {
    log.Info("Program starting", "args", os.Args)
}
```

### 惯例
记录对人有意义的信息是常见且良好的实践，传递给日志函数的第一个参数*隐式*的对应键`msg`。

另外，消息的`level`值会自动使用键`lvl`，而当前时间戳会使用键`t`。

可以使用任何额外的键值对作为上下文提供给日志函数。`log15` allows you to favor terseness， ordering， and speed over safety。这种折中对日志函数是合理的。不需要显示的指明键值对，`log15`理解它们在变长参数列表中的含义:
`log.Warn("size out of bounds"， "low"， lowBound， "high"， highBound， "val"， val)`
若你非常关注类型的安全性，你可以传入一个`log.Ctx`:
`log.Warn("size out of bounds"， log.Ctx{"low": lowBound， "high": highBound， "val": val})`

### 上下文`logger`
常常需要添加一个上下文到日志中以便跟踪其操作。例如网络请求。能够很容易的创建一个携带上下文的日志，输出的每行日志都将自动包含该上下文信息：
```golang
requestlogger := log.New("path", r.URL.Path)

// later
requestlogger.Debug("db txn commit", "duration", txnTimer.Finish())
```
该日志输出如下：
`lvl=dbug t=2014-05-02T16:07:23-0700 path=/repo/12/add_hook msg="db txn commit" duration=0.12`

### `Handlers`
`Handler`接口定义的日志输出到哪，以及如何格式化。`Handler`接口受`net/http`句柄接口启发：
```golang
type Handler interface {
    Log(r *Record) error
}
```
`Handlers`会过滤并格式化日志记录行，或转发到其他`Handlers`。该包`ethereum/go-ethereum/log`实现了几个常用的日志模式，用以创建可扩展、自定义的日志结构。

以下例子展示了打印`logfmt`格式到标准输出的句柄:
`handler := log.StreamHandler(os.Stdout, log.LogfmtFormat())`

这是一个指向其他两个句柄的句柄。一个句柄仅仅将rpc包的记录以`logfmt`格式打印到标准输出上。另一个以`JSON`格式打印`Error`级别（及以上）记录到文件`/var/log/service.json`：
```golang
handler := log.MultiHandler(
    log.LvlFilterHandler(log.LvlError, log.Must.FileHandler("/var/log/service.json", log.JSONFormat())),
    log.MatchFilterHandler("pkg", "app/rpc" log.StdoutHandler())
)
```

### 记录文件名和行号
该包（`ethereum/go-ethereum/log`）实现了三种句柄，用以记录`debugging`信息到上下文。`CallerFileHandler`，`CallerFuncHandler`，`CallerStackHandler`。下例记录了文件和行号：
```golang
h := log.CallerFileHandler(log.StdoutHandler)
log.Root().SetHandler(h)
...
log.Error("open file", "err", err)
```
输出如下：
`lvl=eror t=2014-05-02T16:07:23-0700 msg="open file" err="file not found" caller=data.go:42`

下例记录了调用栈信息：
```golang
h := log.CallerStackHandler("%+v", log.StdoutHandler)
log.Root().SetHandler(h)
...
log.Error("open file", "err", err)
```
输出如下：
`lvl=eror t=2014-05-02T16:07:23-0700 msg="open file" err="file not found" stack="[pkg/data.go:42 pkg/cmd/main.go]"`
`%+v`参数指示句柄记录源文件相对编译时GOPATH的路径。详细参考`github.com/go-stack/stack`包的实现。

### 自定义`Handlers`
`Hnalder`句柄如此的简单，通常不需要自定义句柄。接下里，我们创建一个写入句柄A的句柄，但它写入失败时，会携带写入失败的错误信息重新写入另一个句柄B。在依靠网络socket记录日志，但失败时希望将之写入磁盘时这很有用。
```golang
type BackupHandler struct {
    Primary Handler
    Secondary Handler
}

func (h *BackupHandler) Log (r *Record) error {
    err := h.Primary.Log(r)
    if err != nil {
        r.Ctx = append(ctx, "primary_err", err)
        return h.Secondary.Log(r)
    }
    return nil
}
```
该模式非常有用，因此该包实现了一个经典的版本`FailoverHandler`。

### 记录重开销的操作
有时，需要记录一些需要非常重的计算才能得到的值，但当你的日志级别不够时，你不希望做这个计算。

该包提供了一个简单的模式来标记一个希望惰性计算的操作，仅在当它即将被写入时计算，因此在其他上级句柄中不会触发计算。你需要使用`log.Lazy`包装一个无参的函数。例如：
```golang
func factorRSAKey() (factors []int) {
    // return the factors of a very large number
}

log.Debug("factors", log.Lazy{factorRSAKey})
```
若该信息未被打印（如错误的日志级别），factorRSAKey不会被计算。

### 动态的`context`值
`log.Lazy`模式也可用于上下文参数中，假设一个游戏中含有`Player`对象：
```golang
type Player struct {
  name string
  alive bool
  log.Logger
}
```
你总希望打印出玩家的名字自己它是否活着，因此你会这样创建player对象：
```golang
p := &Player{name: "straysh", alive: true}
p.Logger = log.New("name", p.name, "alive", p.alive)
```
此时，即时玩家已经死了，日志句柄仍然会打印活着，因为日志上下文是在创建时被初始化的。使用`log.Lazy`包装，我们可以`defer`计算玩家是否活着的函数，因此日志行会反射出玩家当前的状态而无论何时调用日志函数。
```
p := &Player{name: "straysh", alive: true}
isAlive := func bool {return p.alive}
player.Logger = log.New("name", p.name, "alive": log.Lazy(isAlive))
```

### 终端格式
若`log15`检测到输出是终端，会配置默认句柄（即log.StdoutHanlder）并使用`TerminalFormat`格式。该格式更好的适配了终端输出，包括不同级别的颜色。

### Error Handling
因为`log15`允许你绕过类型系统，有几种方法可以使你指定无效参数到日志函数中。例如，给无参函数`log.Lazy`传一个参数，或给键传一个非字符串的值。由于日志库是一个典型的报告错误的技术，日志函数返回错误将会非常麻烦。相反，`log15`在处理错误时保证：
- 任何包含`error`的日志行，在打印正常日志信息时，也会打印出错误信息
- 任何包含`error`的日志行，会包含一个键`LOG15_ERROR`，可以方便的检测是否传递了一个无效的值。

理解了这一点，你可能会有这样的疑惑：为什么`Handler`接口在它的`Log`函数里会返回一个`error`。`Handlers`只有在尝试写入外部源失败时，被鼓励返回`errors`，如`syslog`无响应。这样能允许诸如`FailoverHandler`在这些失败后能协作。

### 作为`library`使用
`log15`更适合被包装成自己的日志库。其最佳实践是默认关闭所有的输出方式，而使用一个公用用的`Logger`实例，并提供配置方法。如：
```golang
package yourlib

import "github.com/inconshreveable/log15"

var Log = log.New()

func init(){
  Log.SetHanlder(log.DiscardHandler())
}
```
库的使用者，可能这样使用它：
```golang
import "github.com/inconshreveable/log15"
import "example.com/yourlib"

func main(){
  handler := // custom handler setup
  yourlib.Log.Sethandler(handler)
}
```

### 绑定上下文的最佳实践
假设我在开发一个浏览器：
```golang
type Tab struct {
    url string
    render *RenderingContext
    // ...

    Logger
}

func NewTab(url string) *Tab {
    return &Tab {
        // ...
        url: url,

        Logger: log.New("url", url),
    }
}
```
当常见一个tab页时，我将url作为上下文绑定到logger上，这样可以很容易在日志中跟踪它。此时，不管我对该tab进行何操作，都会使用合成的logger自动记录tab标题：
`tab.Debug("moved position", "idx", tab.idx)`

这有一个问题，若tab的url值改变了？我们可以使用`log.Lazy`确保总是记录了当前的url，但如此就无法记录该tab完整的生命周期。

我们可以使用一个随机的十六进制数来，这叫做`surrogate keys`:
```golang
import logext "github.com/inconshreveable/log15/ext"

t := &Tab {
    // ...
    url: url,
}

t.Logger = log.New("id", logext.RandId(8), "url", log.Lazy{t.getUrl})
return t
```
这样，我们就有了对应该tab的唯一的标识，同时我们记录下了日志函数调用时的url值。

### `Must`
有一组`Must`句柄，它们在发生错误时并不返回错误信息而是直接`panic`。例如：
```golang
log.Must.FileHandler("/path", log.JSONFormat)
log.Must.NetHandler("tcp", ":1234", log.JSONFormat)
```
