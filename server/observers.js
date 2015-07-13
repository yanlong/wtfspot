Reports.find({}).observe({
	added: function (doc) {
		var count = Reports.find({post: doc.post}).count(); 
		var limit = 3;
		if (count >= limit) {
			Posts.update(doc.post, {$set: {status: 'reported'}});
			logger.info('Post be reported: ', doc.post);
		}
		return;
	}
})