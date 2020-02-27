---
title: 网络_tcp_udp
date: 2020-02-27 16:55:50
toc: true
tags: 
- Linux
categories: 
- 博文
---
# 先复习下OSI七层模型
![OSI七层模型](/images/linux/OSI_layers.jpeg)
![OSI七层模型](/images/linux/OSI_2_tcpip.jpeg)

# TCP/UDP工作在传输层
![tcp/ip协议族](/images/linux/tpcip_struct.jpeg)


## 用户数据报协议 UDP（User Datagram Protocol）
UDP面向数据报，无连接，不可靠，可以一对一，一对多，多对一，多对多互相通信（组播）。

即无需确认双方状态，数据准备完毕即刻发送，也不需确认对方是否接收成功。
![UDP_struct](/images/linux/UDP_struct.png)

## 传输控制协议 TCP（Transmission Control Protocol）
面向连接的，提供可靠交付，有流量控制，拥塞控制，提供全双工通信。每一个TCP连接只能是点对点（一对一）的。
![TCP_struct](/images/linux/TCP_struct.jpeg)

### 三次握手
![三次握手](/images/linux/tcp_3-way_handshake.jpeg)

1. 服务器等待连接中...
2. `SYN=1,Seq=x` - 客户端已准备就绪，询问服务器是否就绪。
3. `SYN=1,Seq=y,ACK=1,ACKnum=x+1` - 服务端收到询问并已准备就绪，询问客户端是否就绪。
4. `ACK=1,ACKnum=y+1` - 服务器收到确认，双方确认完成，连接建立。
5. 开始发送数据

其中，步骤1-2是第一次握手，表明客户端发送正常且服务端接收正常；2-3是第二次握手，表明服务端发送正常，客户端接收正常。此时，客户端能确认自己和服务端都能正常发送、接收，但服务端还不知道客户端的接收能力。所以有了3-4的第三次握手，服务器确定了客户端接收和发送正常。此时连接建立，后续开始发送数据。

### 四次挥手
![四次挥手](/images/linux/tcp_4-way_handshake.jpeg.jpeg)

1. `FIN=1,seq=x` - 客户端通知服务端我要断开了。
2. `ACK=1,ACKnum=x+1` - 服务端告诉客户端，我收到了断开请求。
3. 此时服务端不能立刻答复客户端关闭连接，因为可能还有数据在准备中，当这些数据发送完成后。
4. `FIN=1,seq=y` - 服务端告诉客户端，你可以断开了。
5. `ACK=1,ACKnum=y+1` - 服务端收到客户端已经断开连接。
6. 服务端连接断开。

其中，第二次握手之后，并不是立刻断开连接，需要等待服务端将缓冲区的数据发送完毕。而第四次握手之后，服务端关闭了，但客户端需要等待两个握手时间再关闭：因为若服务器未收到最后的`ACK`，会重新发起第三次握手请求，这个2次握手时间就是在等待这种可能的情况。若未收到第三次握手请求，客户端就可以正常断开了。
