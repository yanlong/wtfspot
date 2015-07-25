Reports.find({}).observe({
	added: function (doc) {
		var postId = doc.post;
		var post = Posts.findOne(postId);
		if (post && post.status == 'forbidden') {
			return;
		}
		var count = Reports.find({post: postId}).count(); 
		var limit = 1;
		if (count >= limit) {
			Posts.update(postId, {$set: {status: 'reported'}});
			logger.info('Post be reported: ', postId);
		}
		return;
	}
})

Posts.find({device:{$ne:'wtfspot'}, stime:{$exists:false}}).observe({
	added: function (doc) {
		Meteor.setTimeout(function () {
			var post = Posts.findOne({_id: doc._id, stime:{$exists:false}});
			if (post) {
				Posts.update(post._id, {$set:{stars:2, stime: Date.now()}});
				logger.info('Auto set stars of post: ', post._id);
			}
		}, 90*1000);
	}
})