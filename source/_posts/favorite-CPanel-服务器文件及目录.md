---
title: favorite_CPanel|服务器文件及目录
date: 2013-12-10 09:52:02
tags: Misc
categories:
- 博文
---
<h4>Apache</h4>
```config
/usr/local/apache
+ bin- apache binaries are stored here – httpd, apachectl, apxs
+ conf – configuration files – httpd.conf
+ cgi-bin
+ domlogs – domain log files are stored here
+ htdocs
+ include – header files
+ libexec – shared object (.so) files are stored here – libphp4.so,mod_rewrite.so
+ logs – apache logs – access_log, error_log, suexec_log
+ man – apache manual pages
+ proxy -
+ icons -
```
<h4>CPanel</h4>
```config
/usr/local/cpanel
+ 3rdparty/ – tools like fantastico, mailman files are located here
+ addons/ – AdvancedGuestBook, phpBB etc
+ base/ – phpmyadmin, squirrelmail, skins, webmail etc
+ bin/ – cpanel binaries
+ cgi-sys/ – cgi files like cgiemail, formmail.cgi, formmail.pl etc
+ logs/ – cpanel access log and error log
+ whostmgr/ – whm related files
```
<h4>WHM</h4>
```config
/var/cpanel – whm files
+ bandwidth/ – rrd files of domains
+ username.accts – reseller accounts are listed in this files
+ packages – hosting packages are listed here
+ root.accts – root owned domains are listed here
+ suspended – suspended accounts are listed here
+ users/ – cpanel user file – theme, bwlimit, addon, parked, sub-domains all are listed in this files
+ zonetemplates/ – dns zone template files are taken from here
```
<h4>Important CPanel/WHM files</h4>
```config
/etc/domainips  独立ip  如果共享ip被当成了独立ip删除这里的就可以了
/etc/httpd/conf/httpd.conf – apache configuration file
/etc/exim.conf – mail server configuration file
/etc/named.conf – name server (named) configuration file
/etc/proftpd.conf – proftpd server configuration file
/etc/pure-ftpd.conf – pure-ftpd server configuration file
/etc/valiases/domainname – catchall and forwarders are set here
/etc/vfilters/domainname – email filters are set here
/etc/userdomains – all domains are listed here – addons, parked,subdomains along with their usernames
/etc/localdomains – exim related file – all domains should be listed here to be able to send mails
/var/cpanel/users/username – cpanel user file
/var/cpanel/cpanel.config – cpanel configuration file ( Tweak Settings )
/etc/cpbackup-userskip.conf -
/etc/sysconfig/network – Networking Setup
/etc/hosts -
/var/spool/exim -
/var/spool/cron -
/etc/resolv.conf – Networking Setup Resolver Configuration
/etc/nameserverips – Networking Setup Nameserver IPs ( For resellers to give their nameservers )
/var/cpanel/resellers – For addpkg, etc permissions for resellers.
/etc/chkserv.d – Main >> Service Configuration >> Service Manager
/var/run/chkservd – Main >> Server Status >> Service Status
/var/log/dcpumon – top log process
/root/cpanel3-skel – skel directory. Eg: public_ftp, public_html.
/etc/wwwacct.conf – account creation defaults file in WHM (Basic cPanel/WHMSetup)
/etc/cpupdate.conf – Update Config
/etc/cpbackup.conf – Configure Backup
/etc/clamav.conf – clamav (antivirus configuration file )
/etc/my.cnf – mysql configuration file
/usr/local/Zend/etc/php.ini OR /usr/local/lib/php.ini – php configuration file
/etc/ips – ip addresses on the server (except the shared ip)
/etc/ipaddrpool – ip addresses which are free
/etc/ips.dnsmaster – name server ips
/var/cpanel/Counters – To get the counter of each users.
/var/cpanel/bandwidth – To get bandwith usage of domains
```
<h4>PHP</h4>
```config
Program :/usr/local/bin/php, /usr/bin/php
ini file: /usr/local/lib/php.ini – apache must be restarted after any change to this file
```
<h4>Exim</h4>
```config
Conf : /etc/exim.conf – exim main configuration file
/etc/localdomains – list of domains allowed to relay mail
Log : /var/log/exim_mainlog – incoming/outgoing mails are logged here
/var/log/exim_rejectlog – exim rejected mails are reported here
/var/log/exim_paniclog – exim errors are logged here
Mail queue: /var/spool/exim/input
Cpanel script to restart exim – /scripts/restartsrv_exim
Email forwarders and catchall address file – /etc/valiases/domainname.com
Email filters file – /etc/vfilters/domainname.com
POP user authentication file – /home/username/etc/domainname/passwd
catchall inbox – /home/username/mail/inbox
POP user inbox – /home/username/mail/domainname/popusername/inbox
POP user spambox – /home/username/mail/domainname/popusername/spam
Program : /usr/sbin/exim (suid – -rwsr-xr-x 1 root root )
Init Script: /etc/rc.d/init.d/exim
```
<h4>MySQL</h4>
```config
Program : /usr/bin/mysql
Init Script : /etc/rc.d/init.d/mysql
Conf : /etc/my.cnf, /root/.my.cnf
Data directory – /var/lib/mysql – Where all databases are stored.
Database naming convention – username_dbname (eg: john_sales)
Permissions on databases – drwx 2 mysql mysql
Socket file – /var/lib/mysql/mysql.sock, /tmp/ mysql.sock
```