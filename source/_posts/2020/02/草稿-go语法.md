---
title: 草稿_go语法
date: 2020-02-14 15:27:42
toc: true
tags: 
- Golang
categories: 博文
---

# 数据类型
- 布尔型:只能取`false`或`true`．例`var b bool = true`.
- 数字类型:
  1. int - 整型
  2. float32/float64 - 浮点型
  3. 原生支持复数
- 字符串类型
- 派生类型
  1. 指针类型
  2. 数组类型
  3. 切片类型
  4. 结构类型 `struct`
  5. `channel`类型
  6. 函数类型
  7. 接口类型`interface`
  8. `map`类型
  
## `go`语法中一些特殊的数字类型
<table><tr><th>类型</th><th>长度</th></tr><tr><td>byte</td><td>类似 `uint8`</td></tr><tr><td>rune</td><td>类似 `int32`</td></tr><tr><td>uint32</td><td>或 64位</td></tr><tr><td>int</td><td>取决于操作系统</td></tr><tr><td>uintptr</td><td>无符号整型,用于存放一个指针</td></tr></table>

## 字符串类型
`go`中字符串类型是只读的.采用`UTF-8`编码.每个`字符`对应一个`rune`类型.
```golang
string转int:     int, err   := strconv.Atoi(string) // anscii to int
string转int64:   int64, err := strconv.ParseInt(string, 10, 64)
int转string:     string     := strconv.Itoa(int)
int64转string:   string     := strconv.FormatInt(int64, 10)
```

使用`range`关键字迭代字符串时,每次得到一个字符,`rune`类型,循环的索引值是字节为单位的偏移量.该`rune`类型的字符被称为代码点.
```golang
str := "go语言"

for idx, char := range str {
    fmt.Printf("%d:%#U\n", idx, char)
}
UTF-8中,一个英文字符是1字节,一个中文字符是3字节,输出:
0:U+0067 'g'
1:U+006F 'o'
2:U+8BED '语'
5:U+8A00 '言'
```

# 变量及声明
当一个变量被`var`声明之后,系统自动赋予它零值:
1. `bool`为`false`
2. 整型为 `0`
3. 浮点型为`0.0`
4. 字符串为空`""`
5. 派生类型均为`nil`

如果你想交换两个变量的值,则可以简单的使用:
`a,b = b,a`

## `nil`值
语法错误:未指定类型 `var	x	=	nil	//	错误 `

给一个`nil`指的`slice`添加元素是合法的,但`map`不行.
```golang
var m map[string]int
m["one"] = 1 // 错误
```

## 字符串拼接
1. 运算符`+`
```golang
str := "go" + "语" + "言" // 输出 "go语言"
```
由于字符串是只读的,因此会产生很对碎片化的无用字符串,等待垃圾回收,性能较差.

2. fmt.Sprintf()
内部使用[]byte实现,不像运算符会产生很多临时字符串,但内部逻辑复杂,很多判断,且为了兼容数据类型使用了`interface`,性能一般

3. strings.Join()
会计算最终字符串的大小,先申请合适大小的内存,在逐个字节的填入,为了构造这个数组,性能一般.

4. bytes.Buffer
```golang
var buf bytes.Buffer
buf.WriteString("go")
buf.WriteString("语")
buf.WriteString("言")

fmt.Print(buffe.String())
```
比较理想.内部实现对内存增长有优化,若能预估最终长度,可以使用buffer.Grow()来设置capacity.

5. string.Builder
```golang
var bs strings.Builder
bs.WriteString("go")
bs.WriteString("语")
bs.WriteString("言")

fmt.Print(bs.String())
```
比较理想.内部使用slice来保存和管理内容,slice指向底层的数组.同样提供了Grow()来设置容量.但`strings.Builder`是非线程安全的,性能上和`bytes.Buffer`相差无几.

# 数组
类型 + 长度 定义一个数组类型.
所以`[5]int`和`[10]int`是两个不同的类型.

注:特殊的,我们可以使用`[10]interface{}`来定一个存放任意类型数据的数组,但使用值时需要先做类型判断.

## 声明数组
1. `var`关键字
`var arr1 [5]int` arr1的类型是`[5]int`
2. `new`关键字
`var arr1 = new([5]int)` arr1的类型是 `*[5]int`

3. 其他
```golang
var arrAge = [5]int{18, 20, 30, 35}
var arrLazy = [...]int{5, 6, 7, 8, 9}
var arKeyValue = [5]string{3:"Chris", 4:"Ron"}
```

# 切片
切片的底层是一个数组,自身包含:①对数组的引用 ②起始偏移量 ③中止偏移量 ④切片容量
可以理解为切片是对数组的一个动态窗口.

有点
(多个)切片可以引用同一个数组,因此不需要额外的内存空间,比直接使用数组高效,因此`go`中更多的使用切片.

注:切片本身就是一个引用类型, 指向切片的指针没有意义.类似指向`interface`的指针也没有意义.

## 声明切片
`var slice1 []int`只需要指定类型,而不能指定长度.(指定了长度就是数组了!!!)
一个切片在未初始化前,值是`nil`,长度是`0`.

初始化切片的操作:
`var slice1 []int = arr1[start:end]` 包含`start`索引,不包含`end`索引.即slice1包含arr1[start..end-1]的元素.

`var slice2 = []int{1,2,3}`也可以初始化切片.切片将指向底层创建的一个匿名数组.
注:这里的`var slice2`是`var slice2 []int`的简写.

作为数据源的数组还未定义时,可以使用`make`关键字创建切片:
`var slice2 = make([]int, 5)`第二参数表示切片的长度,同样这里将切片类型`var slice2 []int`省略了,简写作`var slice2`.
更常用的,简写为`slice2 := make([]int, 5)`.

## `make`关键字创建切片的完整语法
`make([]int, 10, 50)`,第三个参数`50`指定了底层数组的大小,第二个参数`10`指定了切片的初始长度.

从数组或切片中生成一个新的切片:
`a[low : high : max]`

例如:
```golang
a := [...]int{1,2,3,4,5,6}
b := a[1:3:5]
```
这里的切片b的长度是3-1=2,容量是5-1=4. `1`, `3`, `5`都是索引.

### 切片重组(reslice)
`slice1	:=	make([]type,	start_length,	capacity)`

`start_length`是切片的初始长度,`capacity`是底层数组的大小也是切片的容量.

改变切片长度的操作称之为切片重组,但切片重组时不能超过底层数组的容量.
```golang
var slice1 []int = make([]int, 2, 5)
slice2 := slice1[2:6]

fmt.Println(slice2)
// panic: runtime error: slice bounds out of range [:6] with capacity 5
```

### 切片扩容
`func	append(s[]T,	x	...T)	[]T`当使用`append`函数时,可能会引发切片扩容,扩容后的切片将指向一个新的底层数组,跟之前的底层数组不再有关联.

## 字典`map`
声明语法:`var map1 map[string]int`

初始化语法: `var map2 = make(map[string]int, 10)`

对值为`nil`的切片`append`是合法的(触发了切片扩容),但对值为`nil`的map赋值是非法的.
```golang
var s []int
s = append(s, 2) //合法

var m map[string]int
m["one"] = 1 // 非法
```

### 访问map的元素
下标访问: `val = aMap[key]`
判断下标是否存在:
```golang
if val,ok := aMap["dummy"]; !ok {
    fmt.Println("key dummy not exists!")
}

fmt.Printf("value:%v\n", value)
```

```golang
// 测试 map1 == nil
var map1 map[string]int // true
map1 := map[string]int{} //false
map1 := map[string]int{"one": 1, "two":2} //false
map1 := make(map[string]int) //false
map1 := make(map[string]int, 10) // false
```

### 删除key
`delete(map1, "key")`.若key不存在也不会报错.

## `go`语法陷阱
`range`循环中生成的值是真实集合的拷贝,它不是原有元素的引用.更新这些值并不会修改原来得值.使用这些值的地址并不会得到原有数据的指针.
```golang
a := []int{1, 2, 3, 4}

for _, v := range a {
    v *= 2
}

fmt.Println(a)
输出: [1 2 3 4]
```

## `defer`
- 规则一 当`defer`被声明时,其参数就会被实时解析
- 规则二 `defer`执行顺序为先进后出,即栈`LIFO` 
- 规则三 `defer`可以读取有名返回值,即可以改变有返回参数的值(不建议如此增加代码复杂度)

## 函数
- 普通带函数名的函数
- 匿名函数或者`lambda`函数
- 方法(methods)

函数可以作为类型使用
`type addFunc func(int, int) int` 这里不需要函数体.
函数是一等值(`first-class value`):它们可以赋值给变量:
`add := addFunc`

### `go`默认使用值传递来传递形参.
函数调用时,若希望在函数内改变原来的数据,则可以传递数据的指针到函数.

切片/字典/接口/通道(slice/map/interface/channel)模式使用引用传递(不需显示指出指针)

<table><tr><th>名称</th><th>说明</th></tr><tr><td>close</td><td>用于关闭`channel`</td></tr><tr><td>len、cap</td><td>返回某个类型的长度/数量(字符串、数组、切片、map和channel)；<br>返回某个类型的容量(只能用于切片、map)</td></tr><tr><td>new、make</td><td>用于分配内存：<br>1. `new`用于值类型和用户定义类型，如自定义结构体.`new(T)`分配类型为T的零值并返回其地址，即指向类型T的指针.<br>其也可以被用于基本类型:`v := new(int)`.<br><br>2. `make`用于内置引用类型，如切片、map、channel.`make(T)`返回类型T的初始化后的值，因此它比`new`进行更多的工作.<br>二者都是内存的分配(堆上)，但`make`只用于slice、map、channel的初始化(非零值)；而`new`用于类型的内存分配，并且内存置为零.</td></tr><tr><td>copy、append</td><td>`copy`复制切片，`append`添加元素到切片</td></tr><tr><td>panic、recover</td><td>用于错误处理机制</td></tr></table>

### 递归与回调
使用递归函数常常遇到栈溢出的错误,一般使用惰性求值的技术解决.在`go`中可以使用`channel`和`gorutine`.

### 闭包
```golang
package main

import "fmt"

func main() {
    add := addNumber(5)
    add(1)
    add(1)
    add(1)
}

func addNumber(x int) func(int) {
    fmt.Printf("%p, %d\n", &x, x)

    return func(y int) {
        k := x + y
        x = k
        y = k
        fmt.Printf("%p, %d\n", &x, x)
        fmt.Printf("%p, %d\n", &y, y)
    }
}
输出:
0xc0000aa010, 5
0xc0000aa010, 6
0xc0000aa030, 6
0xc0000aa010, 7
0xc0000aa048, 7
0xc0000aa010, 8
0xc0000aa060, 8
```

## `type`关键字
复习:`go`语言中的基本数据类型:布尔值、数值（整数、浮点数、复数）、字符串.
另有一些基于上述基本类型衍生的：byte、uintptr、rune、error等

### 自定义类型
`type IZ int`然后可以使用`var a IZ = 5`
变量`a`拥有底层类型`int`，类型`IZ`和`int`之间也可以显示的转换.
例如：将`IZ`类型转换成`int`类型：`b := int(a)`.
```golang
package main

import "fmt"

func main() {
    type IZ int

    var a IZ = 5
    b := int(a)

    fmt.Printf("a's type:%T\n", a)
    fmt.Printf("b's type:%T\n", b)
}
输出：
a's type:main.IZ
b's type:int
```
可以看出来，类型`IZ`和类型`int`是两个不同的类型.

### 类型别名
`type IZ int`语法中，新类型`IZ`无法访问原类型`int`的方法.
此时使用别名语法:`type IZ = int`.

常用的类型：
- 类型可以是基本类型, 如:bool、int、float、string;
- 结构化的(复合类型), 如:struct、array、slice、map、channel;
- 只描述类型的行为的, 如:interface;

结构化的类型没有真正的值,使用`nil`作为零值.
**注意**在`go`语言中不存在类型继承.

## 结构体`struct`
结构体所包含的数据在内存中是连续块存在的.

## 接口`interfce`
接口中包含若干只有定义而没有实现的函数.
结构体不需要显示的声明自己实现了某接口.相反,只要结构体实现了某接口的所有函数,即可以认为结构体实现了该接口.
```goalng
// 接口B定义在包b中
package b
type B interface{
    print()
}

// 结构体A定义在包a中
package a
type A struct{
    name string
}
func (a *A) print() {
    fmt.Println("aaa")
}
// 在语法上不需显示的指出A实现了接B,即没有`implement`语法
// A的方法`print`与接口`B`的`print`有相同的函数签名,即认为结构体A实现了接口B
// 即时接口`B`和结构体`A`分别在两个不同的包里定义
import "path/to/b"
var x B = A{"straysh"} // 合法
x.print()
```

### 接口可以嵌套接口,但不能嵌套结构体.
嵌套接口时,多个不同的接口可以有包含相同签名的函数`go 1.14`实现.

### 接口类型变量的类型转换
`v := a.(T)` 没有断言的强制类型转换,可能触发`panic`:invalid type assertion
正确的做法是:
```golang
if val,ok := a.(T);!ok {
   // handle with error
}
// handle with val
```

当`a`可能含有多种可能的类型时:
```golang
var a interface{}

switch a.(type) {
case *Square:
    //
case *Circle:
    //
case nil:
    //
default:
    //
}
```

### 测试一个值是否实现了某接口
```golang
type B interface{
    print()
}

if val,ok := a.(B); !ok {
    // handle with error
}
// handle with val
```

### 接收器
```golang
type A struct {
    name string
}
func (a *A) dummy(){
    fmt.Println("aaaa")
}
func (a A) foo(){
    fmt.Println("foo...")
}
```
对于一个接结构体`T`, 不论变量是`T类型`还是`*T类型`,都可以调动值方法或指针方法.
```golang
a1 := &A{}

a1.dummy()
a1.foo()

a2 := A{}
a2.dummy()
a2.foo()
输出:
dummy...
foo...
dummy...
foo...
```

但若变量是一个接口类型
```golang
type Intf interface {
    M1()
    M2()
}
type T struct {
    Name string
}
func (t T) M1(){
    t.Name = "name1"
}
func (t *T) M2(){
    t.Name = "name2"
}
```
接口类型的变量无法调用指针接收器的函数:
```golang
var t1 T = T{"T1"} // 正确
t1.M1()
t1.M2()

var t2 Intf = T{"T2"} //语法错误
t2.M1()
t2.M2()
输出:
cannot use composite literal (type T) as type Intf in assignment:
	T does not implement Intf (M2 method has pointer receiver)
```

- 何时使用值类型接收器
  1. 接收器本身就是引用类型(map、func、channel).
  2. 接收器是切片，且该方法不会触发切片重组或扩容.
  3. 接收器是一个小数组或原生的结构体类型且没有可修改的字段或指针，又或接收器是基本数据类型(bool、int、float、string)
  
- 何时使用指针类型
  1. 若方法需要修改接收器,则必须是指针类型.
  2. 若接收器包含`sync.Mutex`或包含了锁的结构体,则必须是指针类型,以避免拷贝.
  3. 若接收器是一个大结构体或大数组,为性能考量,需要只用指针类型.
  4. 若接收器是结构体、数组、切片,blablabla...,使用指针类型.

### 嵌套结构体中方法提升
<table><tr><th></th><th>S(T)</th><th>S(*T)</th></tr><tr><td>S包含T的方法集</td><td>Yes</td><td>Yes</td></tr><tr><td>S包含*T的方法集</td><td>No</td><td>Yes</td></tr><tr><td>*S包含T的方法集</td><td>Yes</td><td>Yes</td></tr><tr><td>*S包含*T的方法集</td><td>Yes</td><td>Yes</td></tr></table>

当变量类型本身就是引用类型是,上述方法集约束是强约束.
否则,`go`有语法糖会自动转换.

