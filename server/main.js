Router.map(function() {
  this.route('message', {where: 'server', path: '/message/:callback'}).get(function() {
    if (this.params.callback === Meteor.settings.inbound_message_callback) {
      var message = to_message(this.request.query);
      console.log(message);
      if (message.from) {
        Messages.insert(message);
        email(message);
      }
    }
    if (this.params.callback === Meteor.settings.delivery_receipt_callback) {
      var receipt = this.request.query;
      Students.update({'phone': receipt.msisdn}, {$set: {status: receipt.status}});
    }
    this.response.end();
  });
});

Meteor.publish('allUserData', function() {
  if (!this.userId) {
    return this.stop();
  }
  console.log(Meteor.users.findOne(this.userId).emails[0].address + ' logged in');
  return Meteor.users.find({}, {fields: {'profile': true, emails: true}});
});
Meteor.users.allow({
  remove: function(userId) {
    return Meteor.users.findOne(userId).profile.admin;
  }
});
Meteor.users.deny({
  update: function() {
    return true;
  }
});

Meteor.publish('students', function() {
  if (!this.userId) {
    return this.stop();
  }
  return Students.find({}, {fields: Meteor.users.findOne(this.userId).profile.admin ? {} : {phone: false}});
});
Students.allow({
  insert: function(userId) {
    return Meteor.users.findOne(userId).profile.admin;
  },
  remove: function(userId) {
    return Meteor.users.findOne(userId).profile.admin;
  }
});

Meteor.publish('messages', function() {
  if (!this.userId) {
    return this.stop();
  }
  return Messages.find({}, {fields: {messages: false}, sort: {created_at: -1}, limit: 20});
});
Messages.allow({
  insert: function() {
    return true;
  }
});

Accounts.emailTemplates.siteName = 'GroupText';
Accounts.emailTemplates.from = 'GroupText <' + Meteor.settings.admin_email + '>';

Meteor.methods({
  addUser: function(name, email) {
    check(name, String);
    check(email, String);
    if (!Meteor.users.findOne(this.userId).profile.admin) {
      throw new Meteor.Error(401, 'Unauthorized');
    }
    Accounts.createUser({
      email: email,
      profile: {
        name: name
      }
    });
    Accounts.sendEnrollmentEmail(Meteor.users.findOne({'emails.address': email}));
  }
});

var to_message = function(sms) {
  var message = {
    text: sms.text,
    created_at: moment(sms['message-timestamp']).toDate(),
    messages: [sms]
  };
  var student = Students.findOne({'phone': sms.msisdn});
  if (student) {
    _.extend(message, {
      from: student._id
    });
  }
  return message;
};

var send = function(message) {
  return Meteor.settings.api_key ?
    HTTP.get('https://rest.nexmo.com/sms/json', {params: {
      api_key: Meteor.settings.api_key,
      api_secret: Meteor.settings.api_secret,
      from: message.from,
      to: message.to,
      text: message.text
    }}) :
    { data: { messages: [ {status: '0' } ] } };
};

var email = function(message) {
  var from = message.to ? message.from : (Students.findOne(message.from) ? Students.findOne(message.from).name : message.messages[0].msisdn);
  var admins = Meteor.users.find({'profile.admin': true}).map(function(user) { return user.emails[0].address; });
  var email = {
    //message from tutor: sms to student, email to admins
    //message from student: email to last tutor to contact that student, bcc to admins
    to: message.to ? admins : Meteor.users.findOne({'profile.name': Messages.findOne({to: message.from}, {sort: {created_at: -1}, limit: 1}).from}).emails[0].address,
    bcc: message.to ? [] : admins,
    from: from + ' (GroupText) <' + Meteor.settings.admin_email + '>',
    subject: 'New message',
    text: 'From: ' + (message.to ? message.from : (Students.findOne(message.from) ? Students.findOne(message.from).name : message.messages[0].msisdn)) +
    (message.to ? '\nTo: ' + message.to.map(function(id) { return Students.findOne(id).name; }).join(', ') : '') +
    '\nMessage: ' + message.text + '\n\nTo send a message visit ' + Meteor.absoluteUrl()
  };
  console.log(email);
  Email.send(email);
};

Messages.find({to: {$exists: true}, sent: {$exists: false}}).observe({
  _suppress_initial: true,
  added: function(message) {
    var messages = message.to.map(function(id) {
      return {
        from: Meteor.settings.tel,
        to: Students.findOne(id).phone,
        text: message.text
      };
    });
    Messages.update(message._id, {$set: {
      created_at: new Date(),
      messages: messages
    }});
    messages.forEach(function(sms) {
      console.log(sms);
      var result = send(sms);
      console.log(result.data);
      if (result.data.messages[0].status === '0') {
        Messages.update(message._id, {$set: {
          sent: true
        }});
      }
    });
    email(message);
  }
});

BrowserPolicy.content.allowStyleOrigin('fonts.googleapis.com');
BrowserPolicy.content.allowFontOrigin('fonts.gstatic.com');
BrowserPolicy.content.allowScriptOrigin('www.google-analytics.com');
BrowserPolicy.content.allowImageOrigin('www.google-analytics.com');

Meteor.startup(function() {
  if (!Meteor.users.findOne()) {
    var user = {
      email: Meteor.settings.admin_email,
      password: Random.id(),
      profile: {
        name: Meteor.settings.admin_name,
        admin: true
      }
    };
    Accounts.createUser(user);
    Meteor.users.update({'emails.address': user.email}, {$set: {'emails.0.verified': true}});
    console.log('Admin password:', user.password);
  }
});
