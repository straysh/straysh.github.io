---
title: get和post获取网络文件
date: 2015-08-07 11:02:53
tags: PHP
---
#### `file_get_content` 以 `GET` 方式获取文件
```php
$url = 'http://www.straysh.com';
file_get_content($url)
```

#### `fopen` 以 `GET` 方式获取文件
```php
$fp = fopen($url, 'r');
stream_get_meta_data($fp);
while(!feof($fp))
{
    $result .= fgets($fp, 1024);
}
var_dump($result);
fclose($fp);
```

#### `file_get_content` 以 `POST` 方式获取文件
```php
$params = ['id'=>'7'];
$params = http_build_query($params);

$options = [
    'http'=> [
        'method' => 'POST',
        'header' => 'Content-type: application/x-www-form-urlencoded\r\nContent-Length'.strlen($params).'\r\n',
        'content' => $params
    ]
];
$context = stream_context_create($options);
file_get_content($url, false, $context);
```

#### `fsockopen` 以 `GET` 方式获取文件,包括`header`和`body`.
注: `fsockopen` 需要开启 `allow_url_fopen`
```php
function get_url($url, $cookie=false)
{
    $url = parse_url($url);
    $query = $url['path'].'?'.$url['query'];
    $fp = fsockopen($url['host'], $url['port'] ? $url['port'] : 80, $errno, $err, 30);
    
    if(!$fp) return false;
    $request = "GET {$query} HTTP/1.1\r\n";
    $request .= "Host:{$url['host']}\r\n";
    $request .= "Connection:Close\r\n";
    if($cookie) $request .= 'Cookie: {$cookie}\r\n';
    $request .= "\r\n";
    fwrite($fp, $request);
    while(!feof($fp))
    {
        $result .= fgets($fp, 1024);
    }
    fclose($fp);
    return $result;
}

//获取body部分
function getUrlHtml($url, $cookie=false)
{
    $body = false;
    $rawdata = get_url($url, $cookie);
    if($rawdata)
    {
        $body = stristr($rawdata, "\r\n\r\n");
        $body = substr($body, 4, strlen($body));
    }
    return $body;
}
```

#### `fsockopen` 以 `POST` 方式获取文件,包括`header`和`body`.
```php
$url = parse_url($url);
if($referer=='') $referer = '111';
if(!isset($url['port'])) $url['port'] = 80;

foreach($data as $k=>$v)
{
    $values[] = "{$k}=".urlencode($v);
}
$data_string = implode("&", $values);

$request  = "POST {$url['path']} HTTP/1.1\r\n";
$request .= "Host:${url['host']}\r\n";
$request .= "Referer:{$referer}\r\n";
$request .= "Content-type:application/x-www-form-urlencoded\r\n";
$request .= "Content-length:".strlen($data_string)."\r\n";
$request .= "Connection:close\r\n";
$request .= "Cookie: {$cookie}\r\n";
$request .= "\r\n";
$request .= $data_string."\r\n";
$fp = fsockopen($url['host'], $url['port']);
fputs($fp, $request);
while(!feof($fp))
{
    $result .= fgets($fp, 1024);
}
fclose($fp);
//$result
```

#### 使用`curl`
```php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
$result = curl_exec($ch);
curl_close($ch);
```