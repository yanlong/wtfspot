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
        var pgc = weights(Posts.find(_.extend({}, selector, {device:'wtfspot'})), now);
        selector.ctime = {$gt: Date.now() - 3600*1000};
        // get ugc
        var ugc = weights(Posts.find(_.extend({}, selector, {device: {$ne:'wtfspot'}})), now);
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
        // weights.rate = post.pv ? 10000: 0;
        var nActions = _.reduce(post.nActions, function (memo, v) {
            return memo + v;
        }, 0);
        if (post.pv) {
            var rate = (nActions / post.pv) * 100;
            if (rate < 5) {
                weights.rate = 0;
            } else if (rate < 10) {
                weights.rate = 6;
            } else if (rate < 15) {
                weights.rate = 10;
            } else {
                weights.rate = 20;
            }
        }
        weights.time = _.random(20);
        return { 
            weight: weights.time + weights.rate,
            post: post._id,
        };
    })
}

SyncedCron.add({
    name: 'auto inc actions for ugc',
    schedule: function(parser) {
        // parser is a later.parse object
        return parser.text('every 42 seconds');
        // return parser.text('every 1 minutes');
        // return parser.text('at 22:00');
    },
    job: function() {
        var selector = {
            status: {
                $nin: ['deleted', 'forbidden']
            },
            device: {
                $ne: 'wtfspot',
            }
        };

        Posts.find(selector, {fields: {content:0}}).forEach(function (post) {
            var now = Date.now();
            var ctime = post.ctime;
            var gap = (now - ctime) / 1000;
            if (gap > 3600) {
                return;
            }
            var base = 6 - gap / 600;
            // var primary = ctime % (post.actions.length + 1);
            var seed = ctime % 1000;
            var sr = new SeedRand(seed, 100);
            var actions = post.actions.concat(['_light']);
            var times = sr.batch(actions.length).map(function (v) {
                return v % 5 +1;
            });
            // var times = [ctime % 42] / 10
            var delta = ctime % 6;
            var query = {
            };
            for (var i = 0; i < actions.length; i++) {
                var rand = Math.floor(Math.random()* 100) % 6;
                var inc = (base + delta) * times[i] + rand;
                query['nActions.'+actions[i]] = Math.floor(inc);
            }
            logger.info('auto inc: ', post._id, query, times);
            Posts.update(post._id, {$inc: query});
            return ;
        })
    }
});
