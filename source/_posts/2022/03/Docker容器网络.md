---
title: Docker容器网络
date: 2022-03-13 12:10:09
tags:
- Linux
- Docker
categories:
- 博文
toc: true
fancybox: true
---

# 简介
Docker通过网络驱动`network drivers`实现容器间的网络互联。默认情况Docker提供两种网络驱动，`bridge`网络驱动和`overlay`网络驱动。
查看网络：
```shell
$ docker network ls
NETWORK ID          NAME                DRIVER              SCOPE
fbae7442cff4        bridge              bridge              local
10a61a961499        docker_gwbridge     bridge              local
28ffffe21438        host                host                local
4c0fc68dd142        none                null                local
```

名为`bridge`的网络是一个特殊的网络即`docker0`。除非显示声明，否则Docker创建容器时默认使用该网络。
```shell
$ docker network inspect bridge -f="{{json .Options}}"|jq
{
  "com.docker.network.bridge.default_bridge": "true",
  "com.docker.network.bridge.enable_icc": "true",
  "com.docker.network.bridge.enable_ip_masquerade": "true",
  "com.docker.network.bridge.host_binding_ipv4": "0.0.0.0",
  "com.docker.network.bridge.name": "docker0",
  "com.docker.network.driver.mtu": "1500"
}
```

启动容器，未指定网络默认使用`docker0`：
```shell
$ docker run -d --rm --name demo_net_container busybox sh -c "sleep 600"
$ docker ps -a|grep demo
eed56010136e  busybox  "sh -c 'sleep 600'"  4 seconds ago  Up 3 seconds  demo_net_container
```

查看容器网络：
```shell
$ docker inspect -f="{{json .NetworkSettings.Networks}}" demo_net_container
{"bridge":{"IPAMConfig":null,"Links":null,"Aliases":null,"NetworkID":"fbae7442cff48ab9c8af7f5e120c8ce530db9e1416c0067c47094ba692a9d0a8","EndpointID":"83fbc769afc547237687183904acad786808edd81212d96cabf69f01defded03","Gateway":"172.17.0.1","IPAddress":"172.17.0.2","IPPrefixLen":16,"IPv6Gateway":"","GlobalIPv6Address":"","GlobalIPv6PrefixLen":0,"MacAddress":"02:42:ac:11:00:02","DriverOpts":null}}
```

获取容器IP地址：
```shell
$ docker inspect -f="{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}" demo_net_container
172.17.0.2
```

# Docker网络驱动类型
- bridage：默认网络驱动。桥接网络是的独立的容器之间能够通信。
- host：对于独立容器，移除容器和宿主机之间的网络隔离，直接使用宿主机的网络。
- overlay：覆盖网络能够将多个`Docker daemon`连接起来，并使swarm services之间能够通信。也可以使用覆盖网络在swarm services和独立容器之间建立网络通信，或者不同的`Docker daemon`之间的独立容器建立通信。
- macvlan：Macvlan网络允许向容器分配固定的MAC地址，使它在网络中好似一个物理设备。Docker daemon通过MAC地址将流量路由到指定容器。
- none：禁用网络。这种模式下，通常会搭配自定义网络插件。

# Overlay网络，覆盖网络
`overlay`网络在Docker daemon之间创建了一个分布式的网络。它工作在宿主机网络之上，将容器连接起来。并支持网络加密特性。
当初始化swarm集群或加入一个swarm集群时，在Docker宿主机上会创建两个新的网络：
- ingress网络：一个名为`ingress`的覆盖网络，控制着swarm services的流量。当创建service且不指定自定义覆盖网络时，它被默认使用。
- docker_gwbridge：一个名为`docker_gwbridge`的桥接网络，在swarm集群中充当连接各个独立Docker daemon的角色。

## 对覆盖网络的操作
### 创建覆盖网络
> 前置条件：
> - Docker daemon使用覆盖网络的防火墙规则，保持协议和端口双向放开
>   - TCP端口2377，用以集群管理的通信
>   - TCP和UDP端口7946，用以节点之间通信
>   - UDP端口4789，用以覆盖网络间流量
> - 初始化swarm集群或者加入一个swarm集群。加入集群后会自动创建一个名为`ingress`的覆盖网络。然后你才可以创建自定义的覆盖网络。

### 覆盖网络流量加密
使用AES算法的GCM模式

### swarm集群模式和独立容器

### 自定义ingress网络
```shell
# 删除ingress网络下的所有服务
$ docker network inspect ingress

# 删除ingress网络
$ docker network rm ingress

# 自定义ingress网络
$ docker network create \
  --driver overlay \
  --ingress \
  --subnet=10.11.0.0/16 \
  --gateway=10.11.0.2 \
  --opt com.docker.network.driver.mtu=1200 \
  my-ingress

```

### 自定义`docker_gwbridge`网络接口
`docker_gwbridge`是一个虚拟网桥，用以将覆盖网络和集群间的Docker daemon的物理网卡连接起来。当初始化swarm集群或加入swarm集群时，Docker会自动创建它，但它不是一个Docker设备。它存在与Docker宿主机的内核中。要对`docker_gwbridge`进行定制，必须在加入swarm集群之前或先退出swarm集群。
1. 停止Docker daemon
2. 删除`docker_gwbridge`网桥
```shell
$ sudo ip link set docker_gwbridge down
$ sudo ip link del dev docker_gwbridge 
```
3. 启动Docker daemon但不要初始化swarm集群
4. 创建`docker_gwbridge`网桥
```shell
$ docker network create \
    --subnet 10.11.0.0/16 \
    --opt com.docker.network.bridge.name=docker_gwbridge \
    --opt com.docker.network.bridge.enable_icc=false \
    --opt com.docker.network.bridge.enable_ip_masquerade=true \
    docker_gwbridge
```
5. 初始化或加入swarm集群。因为docker_gwbridge已存在，Docker不会使用配置创建它。


## 对swarm集群服务的操作
### 在覆盖网络中发布端口
### 绕过swarm集群的routing mesh
```
--endpoint-mode=dnsrr
```


---
参考资料：
- [Network containers](https://docs.docker.com/engine/tutorials/networkingcontainers/)
- [Use overlay networks](https://docs.docker.com/network/overlay/)
- [Networking with overlay networks](https://docs.docker.com/network/network-tutorial-overlay/)
- [Manage swarm service networks](https://docs.docker.com/engine/swarm/networking/)
- [Use macvlan networks](https://docs.docker.com/network/macvlan/)


