const moment = require('moment');
require('moment/locale/en-gb');

Router.configure({layoutTemplate: 'layout'});
Router.subscriptions(function() {
  return [Meteor.subscribe('messages'), Meteor.subscribe('students'), Meteor.subscribe('allUserData')];
});
Router.onBeforeAction(function() {
  if (!Meteor.userId() && !Meteor.loggingIn()) {
    this.render('login');
    return;
  }
  if (!this.ready()) {
    this.render('loading');
    return;
  }
  this.next();
});
Router.map(function() {
  this.route('home', {
    path: '/',
    data: {
      messages: Messages.find({}, {sort: {created_at: -1}}),
      students: Students.find({}, {sort: {name: 1}})
    }
  });
  this.route('students', {data: {students: Students.find({}, {sort: {name: 1}})}});
  this.route('tutors', {data: {tutors: Meteor.users.find({}, {sort: {'profile.name': 1}})}});
});

Template.home.helpers({
  display_from() {
    if (this.to) {
      return this.from;
    } else if (this.from) {
      return Students.findOne(this.from);
    }
  },
  recipients() {
    return this.to.map(function(id) {
      return Students.findOne(id);
    });
  },
  display_date() {
    return moment(this.created_at).calendar();
  }
});
Template.home.events({
  'submit form'(e, t) {
    e.preventDefault();
    const to = _.pluck(t.findAll('option:selected'), 'value');
    const text = t.find('textarea').value;
    const message = {
      from: Meteor.user().profile.name,
      to,
      text,
      created_at: new Date()
    };
    Messages.insert(message);
    e.target.reset();
  },
  'click label a'(e, t) {
    e.preventDefault();
    t.$('option').prop('selected', true);
  },
  'click blockquote a'(e, t) {
    e.preventDefault();
    t.$('option').prop('selected', false);
    _.each(this.to ? this.to : [this.from], function(id) {
      const option = t.find('option[value=' + id + ']');
      if (option) {
        option.selected = true;
      }
    });
  }
});

Template.students.helpers({
  phone() {
    return this.phone.replace(/^44/, '0');
  },
  filereader() {
    return !!window.FileReader;
  }
});
Template.students.events({
  'submit form'(e, t) {
    e.preventDefault();
    const name = t.find('input[name=name]').value;
    const phone = t.find('input[name=phone]').value.replace(/ /g, '').replace(/^0/, '44');
    Students.insert({name, phone});
    e.target.reset();
  },
  'click a'(e) {
    e.preventDefault();
    Students.remove(this._id);
  },
  'change input[type=file]'(e) {
    const reader = new FileReader();
    reader.onload = function() {
      reader.result.split(/BEGIN:VCARD/).forEach(function(vcard) {
        const tel = vcard.match(/TEL;(?:TYPE=)CELL:([0-9-]+)/) || vcard.match(/TEL;(?:TYPE=)[A-Z]+:[+]?([0-9-]+)/);
        if (tel) {
          const phone = tel[1].replace(/-/g, '').replace(/^0/, '44');
          if (!Students.findOne({phone})) {
            const fn = vcard.match(/FN:(.*)/);
            if (fn) {
              Students.insert({name: fn[1], phone});
            }
          }
        }
      });
    };
    reader.readAsText(e.target.files[0]);
    e.target.parentNode.parentNode.reset();
  }
});

Template.tutors.events({
  'submit form'(e, t) {
    e.preventDefault();
    const name = t.find('input[name=name]').value;
    const email = t.find('input[name=email]').value;
    Meteor.call('addUser', name, email);
    e.target.reset();
  },
  'click a'(e) {
    e.preventDefault();
    if (this._id !== Meteor.userId()) {
      Meteor.users.remove(this._id);
    }
  }
});

UI.registerHelper('eq', function(a, b) {
  return a === b;
});
UI.registerHelper('lte', function(a, b) {
  return a <= b;
});
UI.registerHelper('currentPage', function(path) {
  return Router.current().url.substring(1) === path;
});

moment.locale(navigator.language || navigator.userLanguage);
