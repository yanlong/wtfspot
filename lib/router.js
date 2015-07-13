Router.configure({
    layoutTemplate: 'layout',
    // loadingTemplate: 'loading',
    // notFoundTemplate: 'notFound',
    waitOn: function() {
        return [
            Meteor.subscribe('currentUser')
        ]
    }
});

Router.route('/', {
    name: 'home',
    waitOn: function() {
        return [
            Meteor.subscribe('users'),
            Meteor.subscribe('feedbacks'),
        ];
    },
    data: function () {
        return {
            nUsers: Meteor.users.find().count(),
        }
    }
})

Router.route('/posts', {
    name: 'postsList',
    waitOn: function() {
        return [
            Meteor.subscribe('posts'),
        ];
    },
    data: function () {
                  console.log(this.params.query)

        return {
            posts: Posts.find(this.params.query),
        }
    }
})

Router.route('/actionNames', {
    name: 'actionNameList',
    waitOn: function() {
        return [
            Meteor.subscribe('actionNames'),
        ];
    },
    data: function () {
        return {
            actionNames: ActionNames.find(),
        }
    }
})

var requireLogin = function() {
  if (! Meteor.user()) {
    if (Meteor.loggingIn()) {
      this.render(this.loadingTemplate);
    } else {
      this.render('accessDenied');
    }
  } else if (!Roles.userIsInRole(Meteor.userId(), ['editor', 'admin'])) {
      this.render('accessDenied');
  } else {
    this.next();
  }
}

if (Meteor.isClient) {
  Router.onBeforeAction('dataNotFound');
  Router.onBeforeAction(requireLogin);
}