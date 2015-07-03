Posts = new Mongo.Collection('posts');
Feedbacks = new Mongo.Collection('feedbacks');

if (Meteor.isServer) {
    // Create indexes
    Models = {
        user: Meteor.users,
        feedback: Feedbacks,
        post: Posts,
    }


    _.each(Models, function (v, k) {
    	v.before.insert(beforeInsert);
    	v.before.update(beforeUpdate);
    })

    function beforeInsert(userId, doc) {
        var now = Date.now();
        doc.ctime = now;
        doc.mtime = now;
    }

    function beforeUpdate(userId, doc, fieldNames, modifier ) {
    	var now = Date.now();
        if (!hasUpdateOperator(modifier)) {
            modifier.mtime = now;
        } else {
            modifier.$set = modifier.$set || {};
            if (modifier.$set._NO_MODIFY) {
                delete modifier.$set._NO_MODIFY;
                return;
            }
            modifier.$set.mtime = now;
        }
    }
}

function hasUpdateOperator(fields) {
    for (var key in fields) {
        if (key.charAt(0) === '$') {
            return true;
        }
    }
    return false;
}