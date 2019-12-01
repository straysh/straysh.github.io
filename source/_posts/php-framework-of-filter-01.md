---
title: php_framework_of_filter_01
date: 2019-04-20 11:47:37
tags:
---

思考$_GET/$_POST/$_SERVER与INPUT_GET/INPUT_POST/INPUT_SERVER的区别

php中获取输入参数通常使用$_GET/$_POST/$_SERVER等, 它们是超全局变量, 在任意代码中可以直接访问.详细参考[php.net](https://www.php.net/manual/en/reserved.variables.post.php)

> #Note:
>  
> This is a 'superglobal', or automatic global, variable. This simply means that it is available in all scopes throughout a script. There is no need to do global $variable; to access it within functions or methods.

从php5.2起支持filter系列过滤器函数, 配合INPUT_GET/INPUT_POST/INPUT_SERVER等很方便的做参数接收和过滤/校验.

简而言之,$_XXX系列可以任意使用, 而INPUT_XXX系列只能配合filter_XXX函数使用.

filter.default = full_special_chars
```php
ini_set("filter.default", "full_special_chars");
```
实际测试发现上述代码并未生效. 只能修改php.ini启用.

参考[php.net](https://www.php.net/manual/en/filter.configuration.php#ini.filter.default), 启用该项配置后, $_GET/$_POST会自动套用该规则来过滤输入参数.

而想要获取原始输入值, 必须使用INPUT_XXX系列函数.

启用 php.ini filter.default = full_special_chars  
$_POST['name'] //output: "&lt;"
filter_input(INPUT_POST, 'name') //output: "<"
filter_input(INPUT_POST, 'name', FILTER_UNSAFE_RAW) //output: "<"
filter_input(INPUT_POST, 'name', FILTER_SANITIZE_STRING) //output: ""

P.S.: 个人更倾向于$_XX来获取参数并配合filtre_var做过滤， 但这个方案确实可以减少菜鸟滥用$_GET/$_POST的危害

