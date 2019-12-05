---
title: gorm FAQs
date: 2019-12-04 23:21:59
toc: true
tags: Golang
categories: 博文
---

#### BeforeUpdate执行成功,但updated_at仍是时间字符串,写入数据库错误
# BeforeUpdate执行成功,但updated_at仍是时间字符串,写入数据库错误
## BeforeUpdate执行成功,但updated_at仍是时间字符串,写入数据库错误
### BeforeUpdate执行成功,但updated_at仍是时间字符串,写入数据库错误
#### BeforeUpdate执行成功,但updated_at仍是时间字符串,写入数据库错误
```
(/app/Golang/blog/models/tag.go:75) 
[2019-12-04 23:27:41]  Error 1265: Data truncated for column 'updated_at' at row 1 

(/app/Golang/blog/models/tag.go:75) 
[2019-12-04 23:27:41]  [0.39ms]  UPDATE `blog_tag` SET `name` = '杂谈', `updated_at` = '2019-12-04 23:27:41'  WHERE (id=2)
```

问题的根源在`GoPath/pkg/mod/github.com/jinzhu/gorm@v1.9.11/callback_update.go`的`ini`函数中:  
`gorm:update_time_stamp` 在 `gorm:before_update` 后执行了.

```golang
DefaultCallback.Update().Register("gorm:assign_updating_attributes", assignUpdatingAttributesCallback)
DefaultCallback.Update().Register("gorm:begin_transaction", beginTransactionCallback)
DefaultCallback.Update().Register("gorm:before_update", beforeUpdateCallback)
DefaultCallback.Update().Register("gorm:save_before_associations", saveBeforeAssociationsCallback)
DefaultCallback.Update().Register("gorm:update_time_stamp", updateTimeStampForUpdateCallback)
DefaultCallback.Update().Register("gorm:update", updateCallback)
DefaultCallback.Update().Register("gorm:save_after_associations", saveAfterAssociationsCallback)
DefaultCallback.Update().Register("gorm:after_update", afterUpdateCallback)
DefaultCallback.Update().Register("gorm:commit_or_rollback_transaction", commitOrRollbackTransactionCallback)
```

BeforeUpdate执行成功并设置updated_at为整形时间戳后, updateTimeStampForUpdateCallback执行又将updated_at设置成了时间字符串
```golang
// updateTimeStampForUpdateCallback will set `UpdatedAt` when updating
func updateTimeStampForUpdateCallback(scope *Scope) {
	if _, ok := scope.Get("gorm:update_column"); !ok {
		scope.SetColumn("UpdatedAt", scope.db.nowFunc())
	}
}
```

而created_at因为先判断了非空`if createdAtField.IsBlank`而没有这个bug:
```golang
// updateTimeStampForCreateCallback will set `CreatedAt`, `UpdatedAt` when creating
func updateTimeStampForCreateCallback(scope *Scope) {
	if !scope.HasError() {
		now := scope.db.nowFunc()

		if createdAtField, ok := scope.FieldByName("CreatedAt"); ok {
			if createdAtField.IsBlank {
				createdAtField.Set(now)
			}
		}

		if updatedAtField, ok := scope.FieldByName("UpdatedAt"); ok {
			if updatedAtField.IsBlank {
				updatedAtField.Set(now)
			}
		}
	}
}
```

##### 解决方案
重新注册`gorm:update_time_stamp`事件,重写`updateTimeStampForUpdateCallback`方法:
```golang
...
db.Callback().Update().Replace("gorm:update_time_stamp", updateTimeStampForUpdateCallback);
...


// updateTimeStampForUpdateCallback will set `UpdatedAt` when updating
func updateTimeStampForUpdateCallback(scope *gorm.Scope) {
	if _, ok := scope.Get("gorm:update_column"); !ok {
		_ = scope.SetColumn("UpdatedAt", time.Now().Unix())
	}
}
```