to_message = function(sms) {
  return {
    text: sms.text,
    from: Students.findOne({'phone': sms.msisdn})._id,
    created_at: moment(sms['message-timestamp']).toDate(),
    messages: [sms]
  };
};

email = function(message) {
  Meteor.users.find({'profile.admin': true}).forEach(function(user) {
    var email = {
      to: user.emails[0].address,
      from: 'GroupText <' + Meteor.settings.admin_email + '>',
      subject: 'New message',
      text: 'From: ' + (message.to ? message.from : Students.findOne(message.from).name) +
        (message.to ? '\nTo: ' + _.map(message.to, function(id) { return Students.findOne(id).name; }).join(', ') : '') +
        '\nMessage: ' + message.text
    };
    console.log(email);
    Email.send(email);
  });
};
