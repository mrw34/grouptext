Meteor.Router.add({
  '/:path': function(path) {
    if (path === Meteor.settings.callback) {
      var message = to_message(this.request.query);
      Messages.insert(message);
      email(message);
      return 200;
    }
    return 401;
  }
});

Meteor.publish(null, function() {
  return Meteor.users.find();
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
  var admin = Meteor.users.findOne(this.userId).profile.admin;
  return Students.find({}, {fields: admin ? {} : {phone: false}});
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
  return Messages.find({}, {fields: {messages: false}});
});
Messages.allow({
  insert: function() {
    return true;
  }
});

Accounts.emailTemplates.siteName = 'GroupText';
Accounts.emailTemplates.from = 'GroupText <grouptext@markwoodbridge.com>';

Meteor.methods({
  addUser: function(name, email) {
    Accounts.createUser({
      email: email,
      profile: {
        name: name
      }
    });
    Accounts.sendEnrollmentEmail(Meteor.users.findOne({'emails.address': email}));
  }
});

var send = function(message) {
  var result = Meteor.http.get('https://rest.nexmo.com/sms/json', {params: {
    api_key: Meteor.settings.api_key,
    api_secret: Meteor.settings.api_secret,
    from: message.from,
    to: message.to,
    text: message.text
  }});
  return result;
};

//Meteor.startup(function() {
  Messages.find({to: {$exists: true}, sent: {$exists: false}}).observe({
    _suppress_initial: true,
    added: function(message) {
      var messages = _.map(message.to, function(id) {
        return {
          from: Meteor.settings.phone,
          to: Students.findOne(id).phone,
          text: message.text
        };
      });
      Messages.update(message._id, {$set: {
        created_at: new Date(),
        messages: messages
      }});
      _.each(messages, function(sms) {
        console.log(sms);
        var result = send(sms);
        console.log(result.data);
        if (result.data.messages[0].status === '0') {
          Messages.update(message._id, {$set: {
            sent: true
          }});
          email(message);
        }
      });
    }
  });
//});
