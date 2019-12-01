---
title: php_rabbitmq
date: 2019-04-07 20:49:26
tags:
---

## 名词释义
* Queue: RabbitMQ管理着多个队列，例如订单队列、邮件队列、延迟任务队列等。
* Connection: 客户端程序与RabbitMQ的连接实例
* Channel: 客户端向指定的队列发送消息（例如向订单队列插入一条订单），需要通过Channel来发送（不是Connection）
* Exchange: 当一条消息需要发送到多个队列中时，不可能追条向队列发送。Exchange负责接收一条消息，并按消息头中的RoutingKey/BindingKey向相应的Queue发送消息。
* BindingKey: 消息生产者向Exchange发送消息时，header中携带的对着描述
* RoutingKey: 消息接收者从Exchange取消息时，header中携带的规则描述。Exchange根据RoutingKey和所有与该Exchange绑定的BindingKey匹配，向满足规则的Queue发送消息，从而实现一条消息发往过个Queue

<img src="/images/amqp_fanout_exchange.png" style="width:450px;height:300px" />
<img src="/images/amqp_direct_exchange.png" style="width:450px;height:300px" />
<img src="/images/amqp_topic_exchange.png" style="width:450px;height:300px" />