---
title: 网站icon
date: 2015-09-07 19:37:07
tags: Javascript
categories:
- 博文
---
### Topics
* `icon` vs `shortcut icon`
* `image/vnd.microsoft.icon`

There are several ways to create a favicon. The best way for you depends on various factors:

The time you can spend on this task. For many people, this is "as quick as possible".
The efforts you are willing to make. Like, drawing a 16x16 icon by hand for better results.
Specific constraints, like supporting a specific browser with odd specs.

# First method: Use a favicon generator

If you want to get the job done well and quickly, you can use a favicon generator. This one creates the pictures and HTML code for all major desktop and mobiles browsers. Full disclosure: I'm the author of this site.

Advantages of such solution: it's quick and all compatibility considerations were already addressed for you.

# Second method: Create a favicon.ico (desktop browsers only)

As you suggest, you can create a favicon.ico file which contains 16x16 and 32x32 pictures (note that Microsoft recommends 16x16, 32x32 and 48x48).

Then, declare it in your HTML code:

```html
<link rel="shortcut icon" href="/path/to/icons/favicon.ico">
```

This method will work with all desktop browsers, old and new. But most mobile browsers will ignore the favicon.

About your suggestion of placing the favicon.ico file in the root and not declaring it: beware, although this technique works on most browsers, it is not 100% reliable. For example Windows Safari cannot find it (granted: this browser is somehow deprecated on Windows, but you get the point). This technique is useful when combined with PNG icons (for modern browsers).

# Third method: Create a favicon.ico, a PNG icon and an Apple Touch icon (all browsers)

In your question, you do not mention the mobile browsers. Most of them will ignore the favicon.ico file. Although your site may be dedicated to desktop browsers, chances are that you don't want to ignore mobile browsers altogether.

You can achieve a good compatibility with:

* favicon.ico, see above.
* A 192x192 PNG icon for Android Chrome
* A 180x180 Apple Touch icon (for iPhone 6 Plus; other device will scale it down as needed).

Declare them with
```html
<link rel="shortcut icon" href="/path/to/icons/favicon.ico">
<link rel="icon" type="image/png" href="/path/to/icons/favicon-192x192.png" sizes="192x192">
<link rel="apple-touch-icon" sizes="180x180" href="/path/to/icons/apple-touch-icon-180x180.png">
```

This is not the full story, but it's good enough in most cases.