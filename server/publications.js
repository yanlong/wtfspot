Meteor.publish('currentUser', function() {
  return Meteor.users.find(this.userId, {fields: {createdAt: 1, intercomHash: 1}});
});

Meteor.publish('users', function () {
	return Meteor.users.find();
})

Meteor.publish('feedbacks', function () {
    return Feedbacks.find();
})

Meteor.publish('posts', function () {
    return Posts.find({status:{$ne:'deleted'}});
})

Meteor.publish('actionNames', function () {
    return ActionNames.find();
})

