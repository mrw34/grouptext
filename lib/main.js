Students = new Meteor.Collection('students');
Messages = new Meteor.Collection('messages');

Accounts.config({
  forbidClientAccountCreation : true
});
