SyncedCron.add({
    name: 'calc post pool',
    schedule: function(parser) {
        // parser is a later.parse object
        // return parser.text('every 5 seconds');
        return parser.text('every 1 minutes');
        // return parser.text('at 22:00');
    },
    job: function() {
        var selector = {
            status: {
                $nin: ['deleted', 'forbidden']
            },
        };
        var now = Date.now();
        // get pgc
        var pgc = weights(Posts.find(selector), now);
        selector.ctime = {$gt: Date.now() - 3600*1000};
        // get ugc
        var ugc = weights(Posts.find(selector), now);
        // merge
        var all = pgc.concat(ugc);
        // get weights
        // rank
        var sorted = _.sortBy(all, 'weight');
        PostPool = sorted;
        // var gl = goodluck(PostPool);
        // console.log(gl);
        // logger.info('done');
        return;
    }
});

function weights(posts, now) {
    return posts.map(function (post) {
        var weights = {
            time: 0,
            rate: 0,
        };
        var time = (now - post.ctime) / 1000;
        if (time < 20) {
            weights.time = 30;
        } else if (time < 60) {
            weights.time = 6;
        } else if (time < 300) {
            weights.time = 3;
        } else {
            weights.time = 0;
        }
        weights.time = _.random(60);
        return { 
            weight: weights.time + weights.rate,
            post: post._id,
        };
    })
}