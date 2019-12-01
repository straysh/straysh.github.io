---
title: SVN_FAQ
date: 2015-08-04 10:19:56
tags: SVN
---
# 从trunk向branch合并
```bash
cd /branch
svn merge ^/trunk
```

# 从branch合并到trunk
```bash
svn merge -rooxx:HEAD ^/branch/abcd ^/trunk
```

# 回滚一个文件到指定版本
```bash
svn revert -r125:123 foo.php
```

# 撤销所有修改
```bash
svn revert -R .
```