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