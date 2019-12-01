---
title: translation_Versioning_REST_Services
date: 2013-10-04 11:11:51
tags: Translation
---
# 译文
Scott Seely解释了何时发人员需要创建一个新的<a href="http://en.wikipedia.org/wiki/Endpoint">endpoint</a>。这篇高水准的、非语言相关的文章解释了怎样给REST服务打上版本号以及各个选项在何时才有意义。

在一个多层次的应用程序开始过程中，版本号是一个反复出现的问题。无论你正在更新一个远程调用，或改变一个COM对象，或更新一个web服务，在增加新功能的同时你必须考虑到怎么样兼容现有的用户（consumers）(开发人员或用户)。每一项新的技术的提出都促使我们重新定制版本号并提出处理系统变更的建议。

在这篇文章中，我们着眼于这些事件类型，它们促使REST服务中新版本号的生成。我们只考虑HTTP协议的REST。REST可以在多种不同的协议上以建筑学的风格来实现。在实践中，大部分人选择HTTP技术作为REST架构的基石。

在创建一个REST服务时，在项目的首轮迭代中通常将次原开放为只读的。在HTTP术语中，这意味着项目支持通过URL的GET方式被请求。之后，你可能会增加通过POST添加诸如资源的方法,通过PUT方法修改资源，通过DELTE方法删除资源。支持更多HTTP方法的同时，你不能中断现有的用户。换句话说，支持DELETE方法删除资源的同时，不能改变旧有的GET获取资源的功能。

那么，哪些事件类型会破坏现有的客户端？

从数据类型中移除字段会破坏现有客户端。客户端应用的开发人员应该处理丢失的值，但事实上他们很少这么做。结果他们的代码失效了，产生各种bug。

对现有的字段排序或者新增字段会破坏依赖字段位置的客户端。例如，客户端依赖于FirstName这个字段，而这个字段在位置0上，但是布局把FirstName更改成了其它位置，客户端崩溃了，用户抱怨（系统不能正常工作）。再次声明：客户端代码要基于名字查找，虽然基于索引的代码更容易编写。

重命名一个存在的字段也会导致客户端崩溃。将FirstName修改成firstname会使大小写敏感的客户端崩溃。大多数人使用XML或者JSON传递数据，它们都是大小写敏感的。若你使用其它方式（非大小写敏感）传递数据，牢记这一点尤为重要。

更改URL结构同样导致客户端崩溃。在你移动的资源之后，客户端将无法使用旧的url请求到它们。

处理以上问题的最简单的方式是改变URL结构。"正确"的处理方式是使用HTTP状态码301，表示永久重定向。这么做通过响应HTTP Location头信息会告诉请求端（通常是浏览器）资源的新位置。

这么说吧，闭关不是所有的HTTP客户端都足够智能到自动跟随跳转。如果你无法控制现有的HTTP客户但，一些，通常是许多，会被写成禁止跟随跳转。在这个例子中，我建议尼保留旧的URL架构不动同时用代码来实现基本的新旧URL结构。旧的URL结构能被网络设备处理，同时也能被代码处理。如果你们有IT部门，跟负责负载均衡和web服务器的团队合作找到正确的方案。

在重命名，重排序，新增，或者删除字段上，我有两个建议，很大程度上取决于谁在使用你们的服务。我们首先看看REST主义者：他们阅读过Roy Fielding的博士论文而且真正懂得Web的工作原理。第二条建议着重于怎么处理版本控制，当你的目标客户对简单的实现更感兴趣而不是最大化互联网架构的使用。

一种学派支持所谓的HATEOAS：超媒体（Hypermedia）或者说应用引擎状态（Engine of Application State）。HATEOAS学派认为应该使用HTTP Accept和Content-Type头信息来处理和描述版本控制下的数据。Accept信息描述了请求这需要的内容的类型。而HTTP 消息（HTTP message）包含了数据，Content-Type描述了消息中数据的类型。

这些头部信息的值是<a href="http://en.wikipedia.org/wiki/MIME">MIME类型</a>,互联网名称与数字地址分配机构维护着可接收的MIME类型列表。作为供应商，你也可以使用vnd前缀创建自己的MIME类型。例如，假设尼打算暴露foo这个数据类型，并且你的域名是example.com，你可以为该数据定义如下的MIME类型：

```
vnd.example-com.foo+xml 在XML中表示foo这个数据
vnd.example-com.foo+json 在JSON中表示foo这个数据
```
	
之后，任何人在请求你的服务时，只要他们建立了HTTP连接并且设置了正确的Accept头部MIME类型，以用户请求的格式返回的响应内容中会包含foo值。如果你对foo数据做了版本控制，那么MIME类型中就包含版本信息。

例如，对于版本1.0,1.1和1.2，JSON格式的foo数据需要参照如下方式设置Accept/Content-type头信息：

```
1.0:vnd.example-com.foo+json;version=1.0
1.1:vnd.example-com.foo+json;version=1.1
2.0:vnd.example-com.foo+json;version=2.0
```
	
所有的HTTP协议栈（HTTP stacks）都有读写HTTP Accept和Content-Type头信息的技术。例如，jQuery中我会这么写来请求版本1.1的foo数据JSON对象:

```js
$.ajax({
    beforeSend: function(req){
        req.setRequestHeader('Accept', 'vnd.example-com-foo+json;version=1.1');
    },
    type: 'GET',
    url: 'http://http:/~/12',
    success: function(data){
        /* code elided */
    },
    dataType: 'json'
});
```

在服务端，你的代码需要查看accept类型并根据指定的请求版本写出客户端期望的字段。服务端必须基于URL和返回的Content-Type设置vary header来说明响应是可缓存的，例如：

```
Vary: Content-Type
```

通过使用Vary header，确保互联网架构能够精确的缓存响应。否则，依赖这种架构的服务器会缓存XML表现形式并在用户请求JSON的时候返回它。使用MIME类型，你可以处理任何版本的资源表现形式，仅需要在一个url上支持一个大家都知道的MIME类型。在你变更实现方式的时候，接收端（receiving endpoint）需要知道怎样读写返回的表现形式。

不幸的是，这最后一个bit对代码相当的敏感。用来接收的应用程序需要深入哇据HTTP Accept头并决定以何种格式书写响应。在一次请求中，在解码数据之前，例如在PUT或POST时，接收端需要检查Content-Type。

<h2 id="toc_0.1">NOTE</h2>
只发送一种Accept类型的消息发送者通常不许要设置Accept类型，因为响应的Content-Type中应该包含了Accept type。

多数常用的web框架例如Django，Microsoft ASP.NET, Microsoft WCF,以及基于PHP的框架，没有这样的技术来自动处理基于Content-Type的序列操作(<a href="http://en.wikipedia.org/wiki/Serialization">serialization</a>)。作为替换手段，开发人员不得不手写那些代码。客户端框架来发送和接收消息也成为可能，但设置HTTP Accept头不总是简单的,但设置url确实简单多了。

这是我们回到我的第二个建议上 —— 易用至上。URL最大。

创建web services的第二种方式是保持URL至上（TUK原则）。遵循这一模式的开发者称他为REST，因为他们听说过REST并且在一定程序上它和HTTP相关，但他们并不烦恼于阅读Fielding论文。幸运的是，这个学派唯一的过错在于把他们所做的东西叫做REST。为避免刺激REST主义者，我称之为TUK。

在TUK中，也需要通过url在标识资源。在管理资源时，使用表转的HTTP方法：读取使用GET，新建使用POST，更新使用PUT，删除使用DELETE

在这一点上，和REST是不同的。我们诸如上文提到的因改而产生的崩溃（breaking changes）。新增，删除，重排序，和重命名字段造成了一个某处的更改崩溃（breaking change）。你在这个世界创建一个新的版本，要更改URL结构。通常，你需要同时对大量成块的（largely chunks of）对象做版本控制。相应的，foo对象的1.0，1.1，2.0版本长的像这样：

```
1.0 http://www.example.com/~/foo
1.1 http://www.example.com/~/foo
2.0 http://www.example.com/~/foo
```
对本版号来说，一个可接受的选择是使用时间戳。如果你们使用时间来做版本控制，这样的结构也可以工作：

```
June 2008: http://www.example.com/~/foo
October 2009: http://www.example.com/~/foo
February 2010: http://www.example.com/~/foo
```
如果你使用时间做版本控制，记住把年放在月的前面，并使用2个数字的月份。这样对版本排序会简单的多。

TUK风格有另外一个特征：Accept很少使用。相反，终端（endpoint）依赖查询字符串中的特定的格式来决定请求的Content-Type和期望返回的Content-Type。

为了便利，默认的格式是JSON。例如：

```
Request the resource as XML: http://www.example.com/~/foo?format=xml
Request the resource as JSON: http://www.example.com/~/foo?format=json
```
<a href="http://en.wikipedia.org/wiki/Portable_Contacts">Portable Contacts</a>和开放社区都使用这种模式，因为理解起来十分简单。

开发人员倾向于使用url做版本控制。在url上标记版本使人一眼就能知道当前使用的服务版本号。只需要看一下请求的http url，什么都清楚了。

在实现你的代码的时候，应该在一个中心区域来实现业务逻辑。不同版本的监听者应该知道在对象的业务逻辑表现形式和对外的表现形式之间进行转换。简而言之，保持HTTP部分的简洁以便统一的修改代码和更容易支持完全不同的客户端

<h2 id="toc_0.2">Summary</h2>
在你重排序，重命名，新增或删除字段时，需要新建版本。通过改变表现形式，使得用户原有的解析数据的方式失效了。如果你的客户有结构话的想法并且对REST很了解，你应该使用应用程序接收的MIME类型对数据的表现形式做版本控制。如果你的客户将url作为最重要的一面，将url的设计作为版本控制的核心。那么熟悉WS-* web services的人倾向于在变更版本时改变url。

两种技术都是可行的。你要了解你的客户以便选中哪一种方式。一句话，企业和学术范倾向于REST版本控制。如果你的客户是小型业务，而用户都是hacker心理的人，追随TUK的道路。

# 原文
<a href='http://www.informit.com/articles/article.aspx?p=1566460'>Versioning REST Services</a><br />
Scott Seely explains when developers need to create a new endpoint versus just adding data. This higher level, non-language specific article explains how to version REST services and when each choice makes sense.

Versioning is a perennial issue in the development of multi-tier applications. Whether you are updating a remote procedure call, changing a COM object, or updating a Web service, you need to think about how to support existing consumers while providing new functionality. With each new technology, we have to revisit versioning and come up with new recommendations for how to handle change.

In this article, we look at the types of events that cause you to create a new version in a REST service. We then look at two approaches to deploying versions. We only consider HTTP REST. REST can be implemented as an architectural style on many different protocols. As a practical matter, most of us choose HTTP technology as a cornerstone in our REST architectures.
Creating New Versions

When creating a REST service, the first iteration in the project likely exposes the resource as read-only. In HTTP terms, this means that the project called for you to support GET on the URL. Later on, you might add the ability to add new resources through POST, update resources through PUT, and delete resources through DELETE. By supporting more HTTP methods, you cannot break existing clients. Put another way, the act of supporting DELETE does not change an older client’s ability to GET the resource.

What types of events do break existing clients, then?

> Removing a field from a data type breaks clients. Developers who write client apps should handle missing values, but they frequently don’t. Their code breaks. And they file bugs against you.
  Repositioning existing fields or adding a field to a data type. This will break existing clients that rely on the field position. For example, if the client relies on the field FirstName being in position 0 and a layout changes that field to any other position, clients break and users complain. Again: The client code should do name-based lookups, but code that uses indexes may be easier to write for some folks.
  Renaming an existing field. Changing FirstName to firstName will break clients that rely on case sensitivity. Most of you transmit data as XML or JSON; both of these are case sensitive. If you transmit data in some other (non-case sensitive) form, this is even more important to keep In mind.
  Updating your URL structure. If you move the resource, existing clients won’t be able to get to them.

The easiest one of these to handle is changes to URL structure. The “right way” to handle this is to use the HTTP status code 301, Moved Permanently. Doing so tells the caller the new home for the resource via the HTTP Location header in the response.

That said, not all HTTP clients are smart enough to automatically follow redirects. If you do not control the existing HTTP clients, some, perhaps many, were written to not follow redirects. In this case, I advise you to keep the old URL structure in place and write the underlying implementation to handle the old and new URL structure with the same code. The old URL structure can be handled with networking equipment as well as with code. If you have an IT department to call on, work with the teams that own the load balancer and web servers to get the right rules in place.

I have two recommendations for renaming, reordering, adding, or deleting fields. They largely depend on who consumes your service. We first look at the RESTafarians: folks who read Roy Fielding’s PhD dissertation and really understand how the Web works. The second recommendation addresses how to handle versioning when your target clients are more interested in simplicity of implementation than in maximizing their use of the architecture of the Internet.
Hypermedia as the Engine of Application State

One school of thought follows what is called HATEOAS: Hypermedia as the Engine of Application State. HATEOAS says that you should use the HTTP Accept and Content-Type headers to handle versioning of data as well as describing data. Accept states the type of content the requester would like to get. When an HTTP message contains data, Content-Type states the type of content in that message.

The values in these headers are Multipurpose Internet Mail Extensions (MIME) types. The Internet Corporation for Assigned Names and Numbers maintains the list of accepted MIME types. As a vendor, you can also create your own MIME types using the vnd prefix. For example, if you are exposing the foo data type and your company is example.com, you can define the following MIME types for the data:

```
vnd.example-com.foo+xml for the XML representation of foo data
vnd.example-com.foo+json for the JSON representation of foo data
```

Then, whenever anyone requests data from your service, they create an HTTP request and set the Accept header to the correct MIME type. The response contains the data in the user requested format. As you version the foo data type, allow for the MIME type information to include version data.

For example, for versions 1.0, 1.1, and 2.0 of the foo data type as JSON set the Accept/Content-Type header as follows:

```
1.0: vnd.example-com.foo+json; version=1.0
1.1: vnd.example-com.foo+json; version=1.1
2.0: vnd.example-com.foo+json; version=2.0
```

All the HTTP stacks have a mechanism to read and set the HTTP Accept and Content-Type headers. For example, in jQuery I would write the following to request version 1.1 of the foo object as JSON:
```js
$.ajax({
  beforeSend: function (req) {
    req.setRequestHeader("Accept", "vnd.example-com.foo+json; version=1.1"); 
  },
  type: "GET",
  url: "<a href='http://http://www.example.com/foo/12'",
  success: function (data) {
    /* code elided */
  },
  dataType: "json"
});
```

On the server, your code needs to look at the accept type and handle writing out only the fields that the client expects, depending on which version of foo was requested. The server has to set the HTTP Vary header to say that the response is cacheable based on the URL plus the returned Content-Type, as follows:

Vary: Content-Type 

By using the Vary header, you make sure that the Internet architecture can accurately cache the response. Otherwise, servers that rely on the architecture could cache the XML representation and return that when the caller asks for JSON. Using the MIME type, you can handle any version a resource representation by supporting a well know set of MIME types on a single URL. As you change the implementation, the receiving endpoint needs to know how to read and write the representations as requested.

Unfortunately, this last bit can be fairly code intensive. The receiving application needs to dig into the HTTP Accept header and determine which formatting should be used to write the response. Before decoding data in a request, such as in a PUT or POST, the receiver needs to look at the Content-Type.

NOTE

a message sender that only sends one Accept type typically does not need to do this, since the response Content-Type should match the Accept type.

Many popular web frameworks such as Django, Microsoft ASP.NET, Microsoft WCF, and those built on PHP do not have mechanisms to handle serialization based on Content-Type automatically. Instead, the developer has to write that code. The client frameworks to send and receive messages also make it possible, but not always simple, to set the HTTP Accept header. They do make it easy to set the URL.

This brings us to my second recommendation – where ease of use is paramount.
The URL is King

A second way to create Web services is to observe that The URL is King (TUK). Developers who follow this pattern call it REST because they heard that REST and HTTP are somehow related, but they couldn’t be bothered to read the Fielding dissertation. Fortunately, the only thing this school is guilty of is calling what they do REST. So as to not incite the RESTafarians, I call it TUK.

In TUK, you still identify resources by their URLs. When manipulating resources, use the standard HTTP methods:

```
GET to read
POST to create
PUT to update
DELETE to remove
```

At this point, we depart from REST. We have the same breaking changes as before. Adding, removing, reordering, and renaming fields constitutes a breaking change for someone somewhere. When you create a new version in this world, change the URL structure. Typically, you version large chunks of your objects at a time. Our foo object version for 1.0, 1.1, and 2.0 looks like this, instead:
```
1.0: <a href="http://www.example.com/app/1.0/foo">http://www.example.com/app/1.0/foo</a>
1.1: <a href="http://www.example.com/app/1.1/foo">http://www.example.com/app/1.1/foo</a>
2.0: <a href="http://www.example.com/app/2.0/foo">http://www.example.com/app/2.0/foo</a>
```

An acceptable alternative to version numbers are date stamps. If your organization handles versioning by date, the following would also work:
```
June 2008: <a href="http://www.example.com/app/2008/06/foo">http://www.example.com/app/2008/06/foo</a>
October 2009: <a href="http://www.example.com/app/2009/10/foo">http://www.example.com/app/2009/10/foo</a>
February 2010: <a href="http://www.example.com/app/2010/02/foo">http://www.example.com/app/2010/02/foo</a>
```

If you version by date, always put the year before the month, and use two digit months. This makes it easy to sort the versions visually.

The TUK style has another characteristic: Accept is used rarely, if ever. Instead, endpoints rely on a format parameter in the query string to determine the content type of the request and the desired response content type.

By convention, the default value for format is json. Examples:

```
Request the resource as XML: <a href="http://www.example.com/app/1.0/foo?format=xml">http://www.example.com/app/1.0/foo?format=xml</a>
Request the resource as JSON: <a href="http://www.example.com/app/1.0/foo?format=json">http://www.example.com/app/1.0/foo?format=json</a>
```

Both Portable Contacts and OpenSocial use this pattern because it is so easy for people to understand.

Developers tend to prefer versioning by URL. Versioning by URL allows them to figure out which version of the service is in use at a glance. Just look at the HTTP request URL, and you know everything!

When implementing your code, you should keep the business logic in one central location. The various listeners for each version should know how to transpose between the business logic representation of the object and the external representation. In general, keep the HTTP part fairly thin and simple so that you can fix code centrally and support disparate clients easily.
Summary

You have a new version of your service whenever you reorder, rename, add, or delete fields. By changing the representation, you invalidate the assumptions consumers have already made about how to interpret the data. If your audience is architecturally minded and aware of REST, you should version data representations in the MIME types your application accepts. If your clients view the URL as the most important facet, make the URL the center of your versioning efforts. Folks who are familiar with versioning with WS-* Web services tend to be more comfortable with changing the URL when versions change.

Both mechanisms are valid. You need to know your consumer to know which path to follow. In general, working with enterprises and academically-minded folks tends to point developers towards REST versioning. If your clients are smaller businesses and users with a hacker mentality, follow the TUK approach. 