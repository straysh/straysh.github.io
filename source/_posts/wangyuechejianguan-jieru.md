---
layout: blog
title: wangyuechejianguan_jieru
date: 2019-04-09 15:19:35
tags: PHP 网约车
categories: 博文
---
# 网络预约出租汽车监管信息交互平台总体技术要求

## 4.6 网约车平台公司运价信息接口
```sql
create table if not exists `companry_fare`(
    `company_fare_id` bigint unsigned not null auto_increment primary key,
    `company_id` varchar(32) comment '公司标识',
    `address` char(6) not null comment '车辆所在城市（注册地行政区划）',
    `fare_type` varchar(16) comment '运价类型编码,由网约车平台公司统一编码,应确保唯一性',
    `fare_type_note` varchar(128) comment '运价类型说明',
    `fare_valid_on` char(14) comment '运价有效期起,YYYYMMDDhhmmss',
    `fare_valid_off` char(14) comment '运价有效期止',
    `start_fare` varchar(10) comment '起步价,元',
    `start_mile` varchar(10) comment '起步里程,km',
    `unit_price_per_mile` varchar(10) comment '计程单价(按公里),元',
    `unit_price_per_minute` varchar(10) comment '计程单价(按分钟),元',
    `up_price` varchar(10) comment '单程加价单价,元',
    `up_price_start_mile` varchar(10) comment '单程加价公里,km',
    `morning_peak_time_on` varchar(8) comment '营运早高峰时间起,HHmm(24时)',
    `morning_peak_time_off` varchar(8) comment '营运早高峰时间止,HHmm(24时)',
    `evening_peak_time_on` varchar(8) comment '营运晚高峰时间起,HHmm(24时)',
    `evening_peak_time_off` varchar(8) comment '营运晚高峰时间止,HHmm(24时)',
    `other_peak_time_on` varchar(8) comment '其他营运高峰时间起,HHmm(24时)',
    `other_peak_time_off` varchar(8) comment '其他营运高峰时间止,HHmm(24时)',
    `peak_unit_price` varchar(10) comment '高峰时间单程加价单价,元',
    `peak_price_start_mile` varchar(10) comment '高峰时间单程加价公里,km',
    `low_speed_price_per_minute` varchar(10) comment '低速计时加价(按分钟)',
    `night_price_per_mile` varchar(10) comment '夜间费(按公里)',
    `night_price_per_minute` varchar(10) comment '夜间费(按分钟)',
    `other_price` varchar(10) comment '其他加价金额',
    `state` char(1) comment '状态,0:有效,1:无效',
    `flag` char(1) comment '操作标识符,1:新增,2:更新,3:删除',
    `update_time` char(14) comment '更新日期,YYYYMMDDhhmmss'
)engine=innodb default charset utf8 comment '网约车平台公司运价信息';
```

## 4.7 车辆基本信息接口
```sql
create table if not exists `vehicle` (
    `vehicle_id` bigint unsigned not null auto_increment primary key,
    `company_id` varchar(32) comment '公司标识',
    `address` char(6) not null comment '车辆所在城市（注册地行政区划）',
    `vehicle_no` varchar(32) comment '车辆号牌',
    `plate_color` varchar(32) comment '车牌颜色,见JT/T 697.7-2014中5.6',
    `seats` varchar(10) not null comment '核定载客位',
    `brand` varchar(64) comment '车辆厂牌',
    `model` varchar(64) comment '车辆型号',
    `vehicle_type` varchar(64) comment '车辆类型（以行驶证为准）',
    `owner_name` varchar(64) comment '车辆所有人',
    `vehicle_color` varchar(32) comment '车身颜色',
    `engine_id` varchar(32) comment '发动机号',
    `vin` char(17) comment '车辆VIN码',
    `certify_date_a` char(8) comment '车辆注册日期',
    `fuel_type` varchar(32) comment '车辆燃料类型,见JT/T697.7-2014中4.1.4.15',
    `engine_displace` varchar(32) comment '发动机排量,毫升',
    `photo_id` varchar(18) comment '车辆照片文件编号,本字段传输照片文件编号,照片文件通过6.1节FTPS接口传输;格式jpg;按照车辆行驶证照片的标准',
    `certificate` varchar(64) comment '运输证字号,见JT/T 415-2006中5.4.1,地市字别可包含三个汉子',
    `trans_agency` varchar(256) comment '车辆运输证发证机构(全称)',
    `trans_area` varchar(256) comment '车辆经营区域',
    `trans_date_start` char(8) comment '车辆运输证有效期起,YYYYMMDD',
    `trans_date_stop` char(8) comment '车辆运输证有效期止,YYYYMMDD',
    `certify_date_b` char(8) comment '车辆初次登记日期,YYYYMMDD',
    `fix_state` varchar(64) comment '车辆检修状态,0:未检修,1:已检修,2:未知',
    `next_fix_date` char(8) comment '车辆下次年检时间,YYYYMMDD',
    `check_state` char(2) comment '车辆年度审验状态,见JT/T 415-2006中5.4.4',
    `fee_print_id` varchar(32) comment '发票打印设备序列号',
    `gps_brand` varchar(256) comment '卫星定位装置品牌',
    `gps_model` varchar(64) comment '卫星定位装置型号',
    `gps_imei` varchar(128) comment '卫星定位装置IMEI号',
    `gps_install_date` char(8) comment '卫星定位装置安装日期,YYYYMMDD',
    `register_date` char(8) comment '车辆信息向服务所在地出租汽车行政主管部门报备日期,YYYYMMDD',
    `commercial_type` char(1) comment '服务类型,1:网络预约出租车,2:巡游出租车,3:私人小客车合乘',
    `fare_type` varchar(16) comment '运价类型编码',
    `state` char(1) comment '状态,0:有效,1:无效',
    `flag` char(1) comment '操作标识符,1:新增,2:更新,3:删除',
    `update_time` char(14) comment '更新日期,YYYYMMDDhhmmss'
)engine=innodb default charset utf8 comment '车辆基本信息';
```

## 4.8 车辆保险信息接口
```sql
create table if not exists `vehicle_insurance`(
    `vehicle_insurance_id` bigint unsigned not null auto_increment primary key,
    `company_id` varchar(32) comment '公司标识',
    `vehicle_no` varchar(32) comment '车辆号牌',
    `insur_com` varchar(64) comment '保险公司名称',
    `insur_num` varchar(64) comment '保险号',
    `insur_type` varchar(32) comment '保险类型',
    `insur_count` varchar(10) comment '保险金额,元',
    `insur_eff` char(8) comment '保险生效时间,YYYYMMDD',
    `insur_exp` char(8) comment '保险到期时间,YYYYMMDD',
    `flag` char(1) comment '操作标识符,1:新增,2:更新,3:删除',
    `update_time` char(14) comment '更新日期,YYYYMMDDhhmmss'
)engine=innodb default charset utf8 comment '车辆保险信息';
```

## 4.9 网约车车辆里程信息接口
```sql
create table if not exists `vehicle_total_mile`(
    `vehicle_total_mile_id` bigint unsigned not null auto_increment primary key,
    `company_id` varchar(32) comment '公司标识',
    `address` char(6) not null comment '注册地行政区划',
    `vehicle_no` varchar(32) comment '车辆号牌',
    `total_mile` varchar(64) comment '行驶总里程,km',
    `flag` char(1) comment '操作标识符,1:新增,2:更新,3:删除',
    `update_time` char(14) comment '更新日期,YYYYMMDDhhmmss'
)engine=innodb default charset utf8 comment '网约车车辆里程信息';
```

## 4.10 驾驶员基本信息接口
```sql
create table if not exists `driver`(
    `driver_id` bigint unsigned not null auto_increment primary key,
    `company_id` varchar(32) comment '公司标识',
    `address` char(6) not null comment '注册地行政区划(驾驶员所在平台)',
    `driver_name` varchar(64) comment '机动车驾驶员姓名',
    'driver_phone' varchar(32) comment '驾驶员手机号',
    `driver_gender` varchar(2) comment '驾驶员性别,见JT/T69.7-2014中4.1.2.1.3',
    `driver_birthday` char(8) comment '驾驶员出生日期,YYYYMMDD',
    `driver_nationality` varchar(32) comment '国籍',
    `driver_nation` varchar(32) comment '驾驶员民族,见JT/T697.7-2014中4.1.2.1.7',
    `driver_marital_status` varchar(64) comment '驾驶员婚姻状况,未婚;已婚;离异',
    `driver_language_level` varchar(64) comment '驾驶员外语能力',
    `driver_education` varchar(64) comment '驾驶员学历,见JT/T697.7-2014中4.1.2.1.11',
    `driver_census` varchar(256) comment '户口登记机关名称',
    `driver_address` varchar(256) comment '户口住址或长住地址',
    `driver_contact_address` varchar(256) comment '驾驶员通信地址',
    `photo_id` varchar(128) comment '驾驶员照片文件编号',
    `license_id` varchar(32) comment '机动车驾驶证号',
    `license_photo_id` varchar(128) comment '机动车驾驶证扫描件编号',
    `driver_type` varchar(16) comment '准架车型,见JT/T697.7-2014中5.16',
    `get_driver_license_date` char(8) comment '初次领取驾驶证日期,YYYYMMDD',
    `driver_license_on` char(8) comment '驾驶证有效期限起,YYYYMMDD',
    `driver_license_off` char(8) comment '驾驶证有效期限止,YYYYMMDD',
    `taxi_driver` char(1) comment '是否巡游出租车驾驶员,1:是,0:否',
    `certificate_no` varchar(128) comment '网络预约出租车驾驶员资格证号',
    `network_car_issue_organization` varchar(256) comment '网络预约出租车驾驶员证发证机构(全称)',
    `network_car_issue_date` char(8) comment '资格证发证日期,YYYYMMDD',
    `get_network_car_proof_date` char(8) comment '初次领取资格证日期,YYYYMMDD',
    `network_car_proof_on` char(8) comment '资格证有效期起,YYYYMMDD',
    `network_car_proof_off` char(8) comment '资格证有效期止,YYYYMMDD',
    `register_date` char(8) comment '报备日期,YYYYMMDD',
    `full_time_driver` char(1) comment '是否专职驾驶员,1:是,0:否',
    `in_driver_blacklist` char(1) comment '是否在驾驶员黑名单内,1:是,0:否',
    `commercial_type` char(1) comment '服务类型,1:网络预约出租车,2:巡游出租车,3:私人小客车合乘',
    `contract_company` varchar(256) comment '驾驶员合同(或协议)签署公司',
    `contract_on` char(8) comment '合同(或协议)有效期起,YYYYMMDD',
    `contract_off` char(8) comment '合同(或协议)有效期止,YYYYMMDD',
    `emergency_contact` varchar(64) comment '紧急情况联系人',
    `emergency_contact_phone` varchar(32) comment '紧急情况联系人电话',
    `emergency_contact_address` varchar(256) comment '紧急情况联系人通信地址',
    `state` char(1) comment '状态,0:有效,1:失效',
    `flag` char(1) comment '操作标识符,1:新增,2:更新,3:删除',
    `update_time` char(14) comment '更新日期,YYYYMMDDhhmmss'
)engine=innodb default charset utf8 comment '驾驶员基本信息';
```


## 4.11 网约车驾驶员培训信息接口
```sql
create table if not exists `driver_educate`(
    `driver_educate_id` bigint unsigned not null auto_increment primary key,
    `company_id` varchar(32) comment '公司标识',
    `address` char(6) not null comment '注册地行政区划',
    `license_id` varchar(32) comment '机动车驾驶证号',
    `course_name` varchar(64) comment '驾驶员培训课程名称',
    `course_date` char(8) comment '培训课程日期',
    `start_time` char(8) comment '培训开始时间',
    `stop_time` char(8) comment '培训结束时间',
    `duration` varchar(10) comment '培训时长',
    `flag` char(1) comment '操作标识符,1:新增,2:更新,3:删除',
    `update_time` char(14) comment '更新日期,YYYYMMDDhhmmss'
)engine=innodb default charset utf8 comment '网约车驾驶员培训信息';
```

## 4.12 驾驶员移动终端信息接口
```sql
create table if not exists `driver_app`(
   `driver_app_id` bigint unsigned not null auto_increment primary key,
   `company_id` varchar(32) comment '公司标识',
   `address` char(6) not null comment '注册地行政区划',
   `license_id` varchar(32) comment '机动车驾驶证号',
   'driver_phone' varchar(32) comment '驾驶员手机号',
   `net_type` char(1) comment '手机运营商,1:联通,2:移动,3:电信,4:其他',
   `app_version` varchar(32) comment '使用app版本号',
   `map_type` char(1) comment '使用地图类型,1:百度地图,2:高德地图,3:其他',
   `state` char(1) comment '状态,0:有效,1:失效',
   `flag` char(1) comment '操作标识符,1:新增,2:更新,3:删除',
   `update_time` char(14) comment '更新日期,YYYYMMDDhhmmss'
)engine=innodb default charset utf8 comment '驾驶员移动终端';
```

## 4.13 驾驶员统计信息接口
```sql
create table if not exists `driver_stat`(
    `driver_app_id` bigint unsigned not null auto_increment primary key,
    `company_id` varchar(32) comment '公司标识',
    `address` char(6) not null comment '注册地行政区划',
    `license_id` varchar(32) comment '机动车驾驶证号',
    `cycle` char(6) comment '统计周期',
    `order_count` varchar(10) comment '完成订单次数',
    `traffic_violation_count` varchar(32) comment '交通违章次数',
    `complained_count` varchar(32) comment '被投诉次数',
    `flag` char(1) comment '操作标识符,1:新增,2:更新,3:删除',
    `update_time` char(14) comment '更新日期,YYYYMMDDhhmmss'
)engine=innodb default charset utf8 comment '驾驶员统计信息';
```

# 4.14 乘客基本信息接口
```sql
create table if not exists `passenger`(
    `passenger_id` bigint unsigned not null auto_increment primary key,
    `company_id` varchar(32) comment '公司标识',
    `register_date` char(8) comment '注册日期',
    `passenger_phone` varchar(32) comment '乘客手机号',
    `passenger_name` varchar(64) comment '乘客称谓',
    `passenger_gender` varchar(2) comment '乘客性别',
    `state` char(1) comment '状态,0:有效,1:失效',
    `flag` char(1) comment '操作标识符,1:新增,2:更新,3:删除',
    `update_time` char(14) comment '更新日期,YYYYMMDDhhmmss'
)engine=innodb default charset utf8 comment '乘客基本信息';
```

# 5 订单信息交换接口
## 5.1 订单发起接口
```sql
create table if not exists `order_create`(
    `order_create_id` bigint unsigned not null auto_increment primary key,
    `company_id` varchar(32) comment '公司标识',
    `address` char(6) not null comment '注册地行政区划',
    `order_id` varchar(64) comment '订单编号',
    `depart_time` char(14) comment '预计用车时间,YYYYMMDDhhmmss',
    `order_time` char(14) comment '订单发起时间,YYYYMMDDhhmmss',
    `passenger_note` varchar(28) comment '乘客备注',
    `departure` varchar(128) comment '预计出发地点详细地址',
    `dep_longitude` varchar(10) comment '预计出发地点经度',
    `dep_latitude` varchar(10) comment '预计出发地点维度',
    `destination` varchar(128) comment '预计目的地',
    `dest_longitude` varchar(10) comment '预计目的地经度',
    `dest_latitude` varchar(10) comment '预计目的地维度',
    `encrypt` char(1) comment '坐标加密标识,1:GCJ-02测绘局标准,2:WGS84 GPS标准,3:BD-09百度标准,4:CGCS2000北斗标准,0:其他',
    `fare_type` varchar(16) comment '运价类型编码'
)engine=innodb default charset utf8 comment '订单发起';
```

## 5.2 订单成功接口
```sql
create table if not exists `order_match`(
    `order_match_id` bigint unsigned not null auto_increment primary key,
    `company_id` varchar(32) comment '公司标识',
    `address` char(6) not null comment '注册地行政区划',
    `order_id` varchar(64) comment '订单编号',
    `longitude` varchar(10) comment '车辆经度',
    `latitude` varchar(10) comment '车辆维度',
    `encrypt` char(1) comment '坐标加密标识',
    `license_id` varchar(32) comment '机动车驾驶证编码',
    `driver_phone` varchar(32) comment '驾驶员手机号',
    `vehicle_no` varchar(32) comment '车辆号牌',
    `distribute_time` char(14) comment '派单成功时间'
)engine=innodb default charset utf8 comment '订单成功(匹配)';
```

## 5.3 订单撤销接口
```sql
create table if not exists `order_cancel`(
    `order_cancel_id` bigint unsigned not null auto_increment primary key,
    `company_id` varchar(32) comment '公司标识',
    `address` char(6) not null comment '注册地行政区划',
    `order_id` varchar(64) comment '订单编号',
    `order_time` char(14) comment '订单时间',
    `cancel_time` char(14) comment '订单撤销时间',
    `operator` varchar(64) comment '撤销发起方,1:乘客,2:驾驶员,3:平台公司',
    `cancel_type_code` varchar(32) comment '撤销类型代码,1:乘客提前撤销,2:驾驶员提前撤销,3:平台公司撤销,4:乘客违约撤销,5:驾驶员违约撤销',
    `cancel_reason` varchar(128) comment '撤销或违约原因'
)engine=innodb default charset utf8 comment '订单撤销';
```

# 6 经营信息交换接口
## 6.1 车辆经营上线接口
```sql
create table if not exists `operate_login`(
    `operate_login_id` bigint unsigned not null auto_increment primary key,
    `company_id` varchar(32) comment '公司标识',
    `license_id` varchar(32) comment '机动车驾驶证号',
    `vehicle_no` varchar(32) comment '车辆号牌',
    `login_time` char(14) comment '车辆经营上线时间',
    `longitude` varchar(10) comment '上线经度',
    `latitude` varchar(10) comment '上线维度',
    `encrypt` char(1) comment '坐标加密标识'
)engine=innodb default charset utf8 comment '车辆经营上线';
```

## 6.2 车辆经营下线接口
```sql
create table if not exists `operate_logout`(
    `operate_logout_id` bigint unsigned not null auto_increment primary key,
    `company_id` varchar(32) comment '公司标识',
    `license_id` varchar(32) comment '机动车驾驶证号',
    `vehicle_no` varchar(32) comment '车辆号牌',
    `login_time` char(14) comment '车辆经营下线时间',
    `longitude` varchar(10) comment '下线经度',
    `latitude` varchar(10) comment '下线维度',
    `encrypt` char(1) comment '坐标加密标识'
)engine=innodb default charset utf8 comment '车辆经营下线';
```

## 6.3 经营出发接口
```sql
create table if not exists `operate_depart`(
    `operate_depart_id` bigint unsigned not null auto_increment primary key,
    `company_id` varchar(32) comment '公司标识',
    `order_id` varchar(64) comment '订单号',
    `license_id` varchar(32) comment '机动车驾驶证号',
    `fare_type` varchar(16) comment '运价类型编码',
    `vehicle_no` varchar(32) comment '车辆号牌',
    `dep_longitude` varchar(10) comment '出发经度',
    `dep_latitude` varchar(10) comment '出发维度',
    `encrypt` char(1) comment '坐标加密标识',
    `dep_time` char(14) comment '上车时间',
    `wait_mile` varchar(10) comment '空驶里程,km',
    `wait_time` varchar(10) comment '等待时间,秒'
)engine=innodb default charset utf8 comment '车辆经营出发';
```

## 6.4 经营到达接口
```sql
create table if not exists `operate_arrive`(
    `operate_arrive` bigint unsigned not null auto_increment primary key,
    `company_id` varchar(32) comment '公司标识',
    `order_id` varchar(64) comment '订单号',
    `dest_longitude` varchar(10) comment '车辆到达经度',
    `dest_latitude` varchar(10) comment '车辆到达维度',
    `encrypt` char(1) comment '坐标加密标识',
    `dest_time` char(14) comment '上车时间',
    `drive_mile` varchar(10) comment '载客里程,km',
    `drive_time` varchar(10) comment '载客时间,秒'
)engine=innodb default charset utf8 comment '经营到达';
```

## 6.5 经营支付接口
```sql
create table if not exists `operate_pay`(
    `operate_pay_id` bigint unsigned not null auto_increment primary key,
    `company_id` varchar(32) comment '公司标识',
    `order_id` varchar(64) comment '订单号',
    `on_area` char(6) comment '上车位置行政区划编码',
    `driver_name` varchar(64) comment '机动车驾驶员姓名',
    `license_id` varchar(32) comment '机动车驾驶证号',
    `fare_type` varchar(16) comment '运价类型编码',
    `vehicle_no` varchar(32) comment '车辆号牌',
    `book_dep_time` char(14) comment '预计上车时间',
    `wait_time` varchar(10) comment '等待时间',
    `dep_longitude` varchar(10) comment '车辆出发经度',
    `dep_latitude`  varchar(10) comment '车辆出发维度',
    `dep_area` varchar(128) comment '上车地点',
    `dep_time` char(14) comment '上车时间',
    `dest_longitude` varchar(10) comment '车辆到达经度',
    `dest_latitude` varchar(10) comment '车辆到达维度',
    `dest_area` varchar(128) comment '下车地点',
    `dest_time` char(14) comment '下车时间',
    `book_model` varchar(64) comment '预定车型',
    `model` varchar(64) comment '实际车型',
    `drive_mile` varchar(10) comment '载客里程',
    `drive_time` varchar(10) comment '载客时间',
    `wait_mile` varchar(10) comment '空载里程',
    `fact_price` varchar(10) comment '实收金额',
    `price` varchar(10) comment '应收金额',
    `cash_price` varchar(10) comment '现金支付金额',
    `line_name` varchar(64) comment '电子支付机构',
    `line_price` varchar(10) comment '电子支付金额',
    `pos_name` varchar(64) comment 'POS机支付机构',
    `pos_price` varchar(10) comment 'POS机支付金额',
    `benfit_price` varchar(10) comment '优惠金额',
    `book_tip` varchar(10) comment '预约服务费',
    `passenger_tip` varchar(10) comment '附加费',
    `peak_up_price` varchar(10) comment '高峰时段时间加价金额',
    `night_up_price` varchar(10) comment '夜间时段里程加价金额',
    `fare_up_price` varchar(10) comment '远途加价金额',
    `other_up_price` varchar(10) comment '其他加价金额',
    `pay_state` varchar(32) comment '结算状态,0:未结算,1:已结算,2:未知',
    `pay_time` char(14) comment '乘客结算时间',
    `order_match_time` char(14) comment '订单完成时间',
    `invoice_status` varchar(32) comment '发票状态,0:未开票,1:已开票,2:未知'
)engine=innodb default charset utf8 comment '经营支付';
```

# 7 定位信息交换接口
## 7.1 驾驶员定位信息接口
```sql
create table if not exists `position_driver`(
    `position_driver_id` bigint unsigned not null auto_increment primary key,
    `company_id` varchar(32) comment '公司标识',
    `license_id` varchar(32) comment '机动车驾驶证号',
    `driver_region_code` char(6) comment '驾驶员报备地行政区划代码',
    `vehicle_no` varchar(32) comment '车辆号牌',
    `position_time` char(14) comment '定位时间',
    `longitude` varchar(10) comment '下线经度',
    `latitude` varchar(10) comment '下线维度',
    `encrypt` char(1) comment '坐标加密标识',
    `direction` varchar(10) comment '方向角,0-359,顺时针方向',
    `elevation` varchar(10) comment '海拔高度',
    `speed` varchar(10) comment '瞬时速度',
    `biz_status` varchar(10) comment '营运撞他,1:载客,2:接单,3:空驶,4:停运',
    `order_id` varchar(64) comment '订单编号'
)engine=innodb default charset utf8 comment '驾驶员定位信息';
```

# 与驾驶员定位信息重复?
## 7.2 车辆定位信息接口
```sql
create table if not exists `position_vehicle`(
    `position_vehicle_id` bigint unsigned not null auto_increment primary key,
    `company_id` varchar(32) comment '公司标识',
    `vehicle_no` varchar(32) comment '车辆号牌',
    `vehicle_region_code` char(6) comment '车辆报备地行政区划代码',
    `position_time` char(14) comment '定位时间',
    `longitude` varchar(10) comment '下线经度',
    `latitude` varchar(10) comment '下线维度',
    `speed` varchar(10) comment '瞬时速度',
    `direction` varchar(10) comment '方向角,0-359,顺时针方向',
    `elevation` varchar(10) comment '海拔高度',
    `mileage` varchar(10) comment '行驶里程',
    `encrypt` char(1) comment '坐标加密标识',
    `warn_status` varchar(10) comment '预警状态,参考JT/T808',
    `veh_status` varchar(10) comment '车辆状态,参考JT/T808',
    `biz_status` varchar(10) comment '营运撞他,1:载客,2:接单,3:空驶,4:停运',
    `order_id` varchar(64) comment '订单编号'
)engine=innodb default charset utf8 comment '车辆定位信息';
```

# 8 服务质量信息交换接口
## 8.1 乘客评价信息接口
```sql
create table if not exists `rated_passenger`(
    `rated_passenger_id` bigint unsigned not null auto_increment primary key,
    `company_id` varchar(32) comment '公司标识',
    `order_id` varchar(64) comment '订单编号',
    `evaluate_time` char(14) comment '评价时间',
    `service_score` varchar(10) comment '服务满意度,五分制',
    `driver_score` varchar(10) comment '驾驶员满意度,五分制',
    `vehicle_score` varchar(10) comment '车辆满意度,五分制',
    `detail` varchar(128) comment '评价内容'
)engine=innodb default charset utf8 comment '乘客评价信息';
```

## 8.2 乘客投诉信息接口
```sql
create table if not exists `rated_passenger_complaint`(
    `rated_passenger_complaint_id` bigint unsigned not null auto_increment primary key,
    `company_id` varchar(32) comment '公司标识',
    `order_id` varchar(64) comment '订单编号',
    `complaint_time` char(14) comment '投诉时间',
    `detail` varchar(256) comment '投诉内容',
    `result` varchar(128) comment '处理结果'
)engine=innodb default charset utf8 comment '乘客投诉信息';
```

## 8.3 驾驶员处罚信息接口
```sql
create table if not exists `rated_driver_punish`(
    `rated_driver_punish_id` bigint unsigned not null auto_increment primary key,
    `company_id` varchar(32) comment '公司标识',
    `license_id` varchar(32) comment '机动车驾驶证号',
    `punish_time` char(14) comment '处罚时间',
    `punish_reason` varchar(128) comment '处罚原因',
    `punish_result` varchar(128) comment '处罚结果'
)engine=innodb default charset utf8 comment '驾驶员处罚信息';
```

## 8.4 驾驶员信誉信息接口
```sql
create table if not exists `rated_driver`(
    `rated_driver_id` bigint unsigned not null auto_increment primary key,
    `company_id` varchar(32) comment '公司标识',
    `license_id` varchar(32) comment '机动车驾驶证号',
    `level` varchar(10) comment '机动车驾驶证编号',
    `test_date` char(8) comment '服务质量信誉考核日期,YYYYMMDD',
    `test_department` varchar(128) comment '服务质量荣誉考核机构'
)engine=innodb default charset utf8 comment '驾驶员信誉信息';
```

# 9 私人小客车合乘信息交换接口
## 9.1 私人小客车合乘信息服务平台进本信息接口
## 9.2 私人小客车合乘驾驶员行程发布接口
```sql
create table if not exists `share_route`(
    `share_route_id` bigint unsigned not null auto_increment primary key,
    `company_id` varchar(32) comment '公司标识',
    `address` char(6) comment '行政区划代码',
    `route_id` varchar(64) comment '驾驶员发起行程编号',
    `driver_name` varchar(64) comment '驾驶员姓名',
    `driver_phone` varchar(32) comment '驾驶员手机号',
    `license_id` varchar(32) comment '机动车驾驶证号',
    `vehicle_no` varchar(32) comment '车辆号牌',
    `departure` varchar(128) comment '行程出发地点',
    `dep_longitude` varchar(10) comment '车辆出发经度',
    `dep_latitude` varchar(10) comment '车辆出发维度',
    `destination` varchar(128) comment '行程到达地点',
    `dest_longitude` varchar(10) comment '到达地经度',
    `dest_latitude` varchar(10) comment '到达地维度',
    `encrypt` char(1) comment '坐标加密标识',
    `route_create_time` char(14) comment '行程发布时间',
    `route_mile` varchar(10) comment '行程预计里程',
    `route_note` varchar(256) comment '行程备注'
)engine=innodb default charset utf8 comment '私人小客车合乘驾驶员行程发布';
```

## 9.3 私人小客车合乘订单接口
```sql
create table if not exists `share_order`(
    `share_order_id` bigint unsigned not null auto_increment primary key,
    `company_id` varchar(32) comment '公司标识',
    `address` char(6) comment '行政区划代码',
    `route_id` varchar(64) comment '驾驶员发起行程编号',
    `order_id` varchar(64) comment '订单编号',
    `book_depart_time` char(14) comment '预计上车时间',
    `departure` varchar(128) comment '预计上车地点',
    `dep_longitude` varchar(10) comment '预计上车经度',
    `dep_latitude` varchar(10) comment '预计上车维度',
    `destination` varchar(128) comment '预计下车地点',
    `dest_longitude` varchar(10) comment '预计下车地经度',
    `dest_latitude` varchar(10) comment '预计下车地维度',
    `encrypt` char(1) comment '坐标加密标识',
    `order_ensure_time` char(14) comment '订单确认时间',
    `passenger_num` varchar(10) comment '乘客人数',
    `passenger_note` varchar(256) comment '乘客备注'
)engine=innodb default charset utf8 comment '私人小客车合乘订单';
```

## 9.4 私人小客车合乘订单支付接口
```sql
create table if not exists `share_pay`(
    `share_pay_id` bigint unsigned not null auto_increment primary key,
    `company_id` varchar(32) comment '公司标识',
    `address` char(6) comment '行政区划代码',
    `route_id` varchar(64) comment '驾驶员发起行程编号',
    `order_id` varchar(64) comment '订单编号',
    `driver_phone` varchar(32) comment '驾驶员手机号',
    `license_id` varchar(32) comment '机动车驾驶证号',
    `vehicle_no` varchar(32) comment '车辆号牌',
    `fare_type` varchar(16) comment '运价类型编码',
    `book_depart_time` char(14) comment '预计上车时间',
    `depart_time` char(14) comment '实际上车时间',
    `departure` varchar(128) comment '上车地点',
    `dep_longitude` varchar(10) comment '上车地点经度',
    `dep_latitude` varchar(10) comment '上车地点维度',
    `dest_time` char(14) comment '下车时间',
    `destination` varchar(128) comment '下车地点',
    `dest_longitude` varchar(10) comment '下车地经度',
    `dest_latitude` varchar(10) comment '下车地维度',
    `encrypt` char(1) comment '坐标加密标识',
    `drive_mile` varchar(10) comment '载客里程',
    `drive_time` varchar(10) comment '载客时间',
    `fact_price` varchar(10) comment '实收金额',
    `price` varchar(10) comment '应收金额',
    `cash_price` varchar(10) comment '现金支付金额',
    `line_name` varchar(64) comment '电子支付机构',
    `line_price` varchar(10) comment '电子支付金额',
    `benfit_price` varchar(10) comment '优惠金额',
    `share_fuel_fee` varchar(10) comment '燃料成本分摊金额',
    `share_highway_toll` varchar(10) comment '路桥通行分摊金额',
    `passenger_tip` varchar(10) comment '附加费',
    `share_other` varchar(10) comment '其他费用分摊金额',
    `pay_state` varchar(32) comment '结算状态',
    `passenger_num` varchar(10) comment '乘客人数',
    `pay_time` char(14) comment '乘客结算时间',
    `order_match_time` char(14) comment '订单完成时间'
)engine=innodb default charset utf8 comment '私人小客车合乘订单支付';
```

# 模板
```sql
create table if not exists ``()engine=innodb default charset utf8 comment '';
```

