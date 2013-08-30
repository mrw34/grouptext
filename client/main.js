Meteor.Router.add({
  '/': 'home',
  '/students': 'students',
  '/tutors': 'tutors'
});
Meteor.Router.filters({
  requireLogin: function(page) {
    if (Meteor.loggingIn()) {
      return 'loading';
    } else if (Meteor.userId()) {
      return page;
    } else {
      return 'login';
    }
  }
});
Meteor.Router.filter('requireLogin');

Template.home.helpers({
  messages: function() {
    return Messages.find({}, {sort: {created_at: -1}});
  },
  display_from: function() {
    if (this.to) {
      return this.from;
    } else if (this.from) {
      var student = Students.findOne(this.from);
      if (student) {
        return student.name;
      }
    }
    return 'Unknown';
  },
  display_to: function() {
    var names = _.chain(this.to).map(function(id) {
      return Students.findOne(id);
    }).compact().map(function(student) {
      return student.name;
    }).value();
    if (names.length) {
      return ' to ' + (names.length <= 3 ? names.join(', ') : (names.length + ' students'));
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
      text: values.message[0],
      created_at: new Date()
    };
    Messages.insert(message);
    e.target.reset();
  },
  'click a': function(e) {
    e.preventDefault();
    $('option').prop('selected', true);
  }
});

Template.students.helpers({
  phone: function() {
    return this.phone.replace(/^44/, '0');
  },
  filereader: function() {
    return !!window.FileReader;
  }
});
Template.students.events({
  'submit form': function(e) {
    e.preventDefault();
    var name = $(e.target).find('input[name=name]').val();
    var phone = $(e.target).find('input[name=phone]').val().replace(/ /g, '').replace(/^0/, '44');
    Students.insert({name: name, phone: phone});
    e.target.reset();
  },
  'click a': function(e) {
    e.preventDefault();
    Students.remove(this._id);
  },
  'change input[type=file]': function(e) {
    var reader = new FileReader();
    reader.onload = function() {
      reader.result.split(/BEGIN:VCARD/).forEach(function(vcard) {
        var tel = vcard.match(/TEL;(?:TYPE=)CELL:([0-9-]+)/) || vcard.match(/TEL;(?:TYPE=)[A-Z]+:[+]?([0-9-]+)/);
        if (tel) {
          var phone = tel[1].replace(/-/g, '').replace(/^0/, '44');
          if (!Students.findOne({phone: phone})) {
            var fn = vcard.match(/FN:(.*)/);
            if (fn) {
              Students.insert({name: fn[1], phone: phone});
            }
          }
        }
      });
    };
    reader.readAsText(e.target.files[0]);
    e.target.parentNode.parentNode.reset();
  }
});

Template.tutors.helpers({
  tutors: function() {
    return Meteor.users.find({}, {sort: {'profile.name': 1}});
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
    e.target.reset();
  },
  'click a': function(e) {
    e.preventDefault();
    if (this._id !== Meteor.userId()) {
      Meteor.users.remove(this._id);
    }
  }
});

Handlebars.registerHelper('students', function() {
  return Students.find({}, {sort: {name: 1}});
});
Handlebars.registerHelper('equal', function(a, b) {
  return a === b;
});

Meteor.subscribe('students');
Meteor.subscribe('messages');
