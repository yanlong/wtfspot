var today = new Date('2015-07-27').getTime();
var aDay = 3600 * 24 * 1000;
var tomorrow = today + aDay;


var base = {
//    status: {
//        $nin: ['deleted', 'forbidden']
//    },
}


var ugc = db.posts.find({
    device: {
        $ne: 'wtfspot'
    },
    ctime: {
        $gt: today,
        $lt: tomorrow
    }
})

var pv = {}

var post = {

}
var users = {}

db.posts.find(base).forEach(function(v) {
    var type = v.device == 'wtfspot' ? 'pgc' : 'ugc';
    pv[type] = (pv[type] || 0) + (v.pv || 0);
    post[type] = (post[type] || 0) + 1;
    users[v.device] = (users[v.device] || 0) + 1;
})

var userActions = {

}

var postActions = {

}

db.actions.find(base).forEach(function(v) {
    var post = db.posts.findOne({
        _id: v.post
    });
    if (!post) return;
    var type = post.device == 'wtfspot' ? 'pgc' : 'ugc';
    userActions[v.device] = (userActions[v.device] || 0) + total(v.nActions);
    postActions[type] = (postActions[type] || 0) + total(v.nActions);
})

function total(nActions) {
    var count = 0;
    for (var i in nActions) {
        count += nActions[i] > 3 ? 3 : nActions[i];
    }
    return count;
}

function echo(title, obj) {
    print(title);
    printjson(obj)
}


var stats = {
    'date': new Date().toString(),
    'pv': pv,
    'post': post,
    'action of users': userActions,
    'action of posts': postActions,
}

printjson(stats);
