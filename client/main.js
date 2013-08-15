Meteor.Router.add({
  '/': 'home',
  '/students': 'students',
  '/tutors': 'tutors'
});

Meteor.Router.filters({
  requireLogin: function(page) {
    if (Meteor.loggingIn()) {
      return 'loading';
    } else if (Meteor.user()) {
      return page;
    } else {
      return 'login';
    }
  }
});
Meteor.Router.filter('requireLogin');

// Meteor.subscribe('students', function() {
//   Meteor.subscribe('messages');
// });
Meteor.subscribe('students');
Meteor.subscribe('messages');

Template.home.helpers({
  students: function() {
    return Students.find({}, {sort: {name: 1}});
  },
  messages: function() {
    // return Messages.find({}, {sort: {created_at: -1}});
    return Messages.find();
  },
  display_from: function() {
    if (this.to) {
      return this.from;
    } else {
      var student = Students.findOne(this.from);
      return student ? student.name : this.from;
    }
  },
  display_to: function() {
    if (this.to && this.to.length === 1) {
      var student = Students.findOne(this.to[0]);
      if (student) {
        return ' to ' + student.name;
      }
    }
  },
  display_date: function() {
    return moment(this.created_at).calendar();
  }
});

Template.home.events({
  'submit form': function(e) {
    e.preventDefault();
    var values = _.chain($(e.target, ':input').serializeArray()).groupBy('name').pairs().map(function(e) { return [e[0], _.pluck(e[1], 'value')]; }).object().value();
    var message = {
      from: Meteor.user().profile.name,
      to: values.recipients,
      text: values.message[0]
    };
    Messages.insert(message);
  },
  'click a': function(e) {
    e.preventDefault();
    $('option').prop('selected', true);
  }
});

Template.students.helpers({
  students: function() {
    return Students.find({}, {sort: {name: 1}});
  }
});

Template.students.events({
  'submit form': function(e) {
    e.preventDefault();
    var name = $(e.target).find('input[name=name]').val();
    var phone = $(e.target).find('input[name=phone]').val();
    Students.insert({name: name, phone: phone});
  },
  'click a': function(e) {
    e.preventDefault();
    Students.remove(this._id);
  }
});

Template.tutors.helpers({
  tutors: function() {
    return Meteor.users.find({}, {sort: {name: 1}});
  },
  email: function() {
    return this.emails[0].address;
  }
});

Template.tutors.events({
  'submit form': function(e) {
    e.preventDefault();
    var name = $(e.target).find('input[name=name]').val();
    var email = $(e.target).find('input[name=email]').val();
    Meteor.call('addUser', name, email);
  },
  'click a': function(e) {
    e.preventDefault();
  }
});

Handlebars.registerHelper('currently', function(page) {
  return Meteor.Router.page() === page;
});
Handlebars.registerHelper('application', function() {
  return Meteor.settings.application;
});