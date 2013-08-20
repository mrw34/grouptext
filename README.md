GroupText
=========
GroupText is a privacy-preserving group SMS platform originally developed for [GCSE Success](http://gcsesuccess.wordpress.com/). It designed with safeguarding in mind, allowing tutors to contact students without having access to their phone numbers and making messages visible to all other tutors for transparency.

It is built with [Meteor](http://www.meteor.com/), [Meteor Router](https://github.com/tmeasday/meteor-router), [Moment.js](http://momentjs.com/) and [Bootstrap](http://getbootstrap.com/) and uses the [Nexmo](https://www.nexmo.com/) platform.

Run
---
1. Download and unzip [the latest release](https://github.com/mrw34/grouptext/releases)
1. ```cp settings.template.json settings.json```
1. Set your Nexmo phone number, api\_key and api\_secret
1. Set callback\_path to a random string and configure your Nexmo callback URL to `http://yourdomain.com/<callback_path>`
1. Set the email and name of an initial admin user (autogenerated password is echoed to console on intial startup)
1. ```meteor --settings settings.json```

Build
-----
```
git clone https://github.com/mrw34/grouptext.git
cd grouptext
mrt install
bower install
