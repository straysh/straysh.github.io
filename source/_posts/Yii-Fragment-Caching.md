---
title: Yii_Fragment_Caching
date: 2013-10-04 11:20:42
tags: Translation
---
# 译文

缓存选项<br>嵌套缓存

片段缓存指的是缓存页面的片段。例如，一个显示了年度销售报表的页面中，我们可以把这个报表存储在缓存中，这样每次请求都节约了生成该报表的时间。

在视图文件中通过调用CController::beginCache()和CController::endCache()来使用片段缓存。这两个方法分别标记出了待缓存的页面内容的开始和结束位置。类似变量缓存，我们需要一个ID来唯一标识被缓存的片段。
```
... 其它HTML内容 ...
<?php if($this->beginCache($id)){ ?>
... 被缓存的内容 ...
<?php $this->endCache(); ?>
... 其它HTML内容 ...
```

上面的代码中，如果beginCache()返回false，已缓存的内容会被自动插入到其中；否则，当endCache()被调用时if语句块内的代码会被执行。

<h4 id="toc_0.0.0.1">1.缓存选项</h4>

调用beginCache()时，我们可以通过使用数组来作为组成缓存选项的第二个参数来定制片段缓存。事实上，beginCache()和endCache()方法是对COutputCache挂件的两个实用的包装。因此，缓存选项可以是用来初始化COutputCache挂件的任意属性。

属性duration

或许最常用的选项是有效期(duration)，它指定了缓存在多长时间内有效。类似于CCache::set()的过期参数(expiration)。下面这段代码将缓存约一个小时：
```
... 其它HTML内容 ...
<?php if($this->beginCache($id, array('duration'=>3600)){ ?>
... 缓存的内容 ...
<?php $this->endCache();} ?>
... 其它HTML内容 ...
```

如果不设置duration值，默认会是60，即缓存将会在60秒后失效。

自1.1.8版本起，若设置duration为0，所有现有的缓存都将被删除。若datation是负值，缓存将被禁用，但已经存在的缓存仍然有效。而在1.1.8版本之前，daration为0或负数将使缓存被(完全,译者注)禁用。

属性dependency

类似变量缓存，被缓存的内容片段也可以有依赖(dependencies)。例如，展示出来的一篇已发布的文章取决于发布的内容是否修改过。

为了指定依赖关系，我们使用denpendency选项，它既可以是一个实现了ICacheDenpendcy的对象，也可以是一个可用来生成denpendency对象的配置数组。下面的代码显示了缓存片段依赖于lastModified列的修改：
```
... 其它HTML内容 ...
<?php if($this->beginCach($id, array('dependency'=>array(
				'class'=>'system.caching.dependencies.CDbCacheDependency',
				'sql'=>'SELECT MAX(lastModified) FROM `post`))) { ?>
... 缓存的内容 ...
<?php $this->endCache(); } ?>
... 其它HTML内容 ...
```

属性variation

缓存的内容可能随一些参数而变化。例如，个人的profile对不同的用户是不一样的。为了缓存个人的profile，我们希望缓存的副本随着用户ID而改变。本质上来说，就是在调用beginCache()方法时，要使用不同的ID参数。

在一些方案中需要开发人员来变更ID参数，作为一种替代的方案，COutputCache内置了这个特性。(Instead of asking developers to variate the IDs according to some scheme, COutputCache is built-in with such a feature)。下面是对variation的归纳。

varyByRoute:设置这个选项为TRUE，缓存将会根据route而改变。因此，每一个由controller和action组成的请求都将被缓存为单独的内容。

varyBySession:设置这个选项为TRUE，缓存将会根据session ID而改变。因此，每一个用户session看到的内容都是不同的，并且他们都使用缓存。

varyByParam:设置这个选项为名称数组(关联数组，字符串为键，译者注)，我们可以根据指定的GET参数值来读取不同的缓存内容。例如，如果一个页面根据id参数来展示不同的文章，我们可以通过设置varyByParam参数为array('id')来缓存每一篇文章。若没有这样一个变换的手段，我们将只能缓存主一篇文章。

varyByExpression:设置该选项为PHP表达式，我们可以是缓存根据表达式的值而改变。

请求类型(Request Types)

有时，我们希望缓存只在特定的HTTP请求时有效。例如，一个表单页，我们只希望在页面初始化时将表单缓存住，这是一个GET请求。其它一系列(通过POST请求)的表单都不应该被缓存，因为这些表单中肯能含有用户输入信息。可以指定requestTypes选项来达到目的：
```
... 其它HTML内容 ...
<?php if($this->beginCache($id, array('requestTypes'=>array('GET'))){ ?>
... 缓存的HTML内容 ...
<?php $this->endCache(); } ?>
... 其它HTML内容 ...
```

<h4 id="toc_0.0.0.2">2.嵌套缓存</h4>

片段缓存是可嵌套的。也就是说，一个片段缓存可以被包装在一个更大的片段缓存中。例如，评论被缓存在一内层的缓存中，并且这些片段缓存同文章内容一起被缓存在外层的片段缓存中。
```
... 其它HTML内容 ...
<?php if($this->beginCache($id1){ ?>
... 外层的缓存内容 ...
	<?php if($this->beginCache($id2) { ?>
		... 内层的缓存内容 ...
	<?php $this->endCache(); } ?>
... 外层的缓存内容 ...
<?php $this->endCache(); } ?>
... 其它HTML内容 ...
```

嵌套缓存中可以使用不同的缓存参数。例如，上例中的内外层缓存中可以使用不同的duration参数。设置当外层缓存数据失效时，内层缓存仍然能提供有效的片段缓存内容。但是，反过来却不行。如果外层缓存有效，即时内层缓存过期了，它还是会继续提供相同的缓存副本。在设置duration或者dependency参数时，务必谨慎，否则内层的缓存将会被外层缓存覆盖掉。

# 原文
<a href='http://www.yiiframework.com/doc/guide/1.1/en/caching.fragment'>Yii Fragment Caching</a>
```
Caching Options
Nested Caching
```

Fragment caching refers to caching a fragment of a page. For example, if a page displays a summary of yearly sale in a table, we can store this table in cache to eliminate the time needed to generate it for each request.

To use fragment caching, we call CController::beginCache() and CController::endCache() in a controller's view script. The two methods mark the beginning and the end of the page content that should be cached, respectively. Like data caching, we need an ID to identify the fragment being cached.
```
...other HTML content...
<?php if(\(this->beginCache(\)id)) { ?>
...content to be cached...
<?php $this->endCache(); } ?>
...other HTML content...
```

In the above, if beginCache() returns false, the cached content will be automatically inserted at the place; otherwise, the content inside the if-statement will be executed and be cached when endCache() is invoked.
1. Caching Options

When calling beginCache(), we can supply an array as the second parameter consisting of caching options to customize the fragment caching. As a matter of fact, the beginCache() and endCache() methods are a convenient wrapper of the COutputCache widget. Therefore, the caching options can be initial values for any properties of COutputCache.
Duration

Perhaps the most commonly option is duration which specifies how long the content can remain valid in cache. It is similar to the expiration parameter of CCache::set(). The following code caches the content fragment for at most one hour:
```
...other HTML content...
<?php if(\(this->beginCache(\)id, array('duration'=>3600))) { ?>
...content to be cached...
<?php $this->endCache(); } ?>
...other HTML content...
```

If we do not set the duration, it would default to 60, meaning the cached content will be invalidated after 60 seconds.

Starting from version 1.1.8, if the duration is set 0, any existing cached content will be removed from the cache. If the duration is a negative value, the cache will be disabled, but existing cached content will remain in the cache. Prior to version 1.1.8, if the duration is 0 or negative, the cache will be disabled.
Dependency

Like data caching, content fragment being cached can also have dependencies. For example, the content of a post being displayed depends on whether or not the post is modified.

To specify a dependency, we set the dependency option, which can be either an object implementing ICacheDependency or a configuration array that can be used to generate the dependency object. The following code specifies the fragment content depends on the change of lastModified column value:
```
...other HTML content...
<?php if(\(this->beginCache(\)id, array('dependency'=>array(
'class'=>'system.caching.dependencies.CDbCacheDependency',
'sql'=>'SELECT MAX(lastModified) FROM Post')))) { ?>

...content to be cached...
<?php $this->endCache(); } ?>
...other HTML content...
```

Variation

Content being cached may be variated according to some parameters. For example, the personal profile may look differently to different users. To cache the profile content, we would like the cached copy to be variated according to user IDs. This essentially means that we should use different IDs when calling beginCache().

Instead of asking developers to variate the IDs according to some scheme, COutputCache is built-in with such a feature. Below is a summary.

```
varyByRoute: by setting this option to true, the cached content will be variated according to route. Therefore, each combination of the requested controller and action will have a separate cached content.
```
varyBySession: by setting this option to true, we can make the cached content to be variated according to session IDs. Therefore, each user session may see different content and they are all served from cache.
```
varyByParam: by setting this option to an array of names, we can make the cached content to be variated according to the values of the specified GET parameters. For example, if a page displays the content of a post according to the id GET parameter, we can specify varyByParam to be array('id') so that we can cache the content for each post. Without such variation, we would only be able to cache a single post.
```
varyByExpression: by setting this option to a PHP expression, we can make the cached content to be variated according to the result of this PHP expression.


Request Types

Sometimes we want the fragment caching to be enabled only for certain types of request. For example, for a page displaying a form, we only want to cache the form when it is initially requested (via GET request). Any subsequent display (via POST request) of the form should not be cached because the form may contain user input. To do so, we can specify the requestTypes option:
```
...other HTML content...
<?php if(\(this->beginCache(\)id, array('requestTypes'=>array('GET')))) { ?>
...content to be cached...
<?php $this->endCache(); } ?>
...other HTML content...
```

2. Nested Caching

Fragment caching can be nested. That is, a cached fragment is enclosed within a bigger fragment that is also cached. For example, the comments are cached in an inner fragment cache, and they are cached together with the post content in an outer fragment cache.
```
...other HTML content...
<?php if(\(this->beginCache(\)id1)) { ?>
...outer content to be cached...

<?php if(\(this->beginCache(\)id2)) { ?>
...inner content to be cached...
<?php $this->endCache(); } ?>


...outer content to be cached...
<?php $this->endCache(); } ?>
...other HTML content...
```

Different caching options can be set to the nested caches. For example, the inner cache and the outer cache in the above example can be set with different duration values. Even when the data cached in the outer cache is invalidated, the inner cache may still provide the valid inner fragment. However, it is not true vice versa. If the outer cache is evaluated to be valid, it will continue to provide the same cached copy even after the content in the inner cache has been invalidated. You must be careful in setting the durations or the dependencies of the nested caches, otherwise the outdated inner fragments may be kept in the outer fragment.
