var Seeds = [{
    base: 0,
    duration: 0,
}, {
    base: 10,
    duration: 10,
}, {
    base: 40,
    duration: 10,
}, {
    base: 100,
    duration: 10,
}, {
    base: 300,
    duration: 15,
}, {
    base: 800,
    duration: 20,
}, {
    base: 2000,
    duration: 30,
}, ]

var K = [25, 35, 20, 12, 8];

var selector = {
    device: {
        $ne: 'wtfspot'
    },
    stime: {
        $exists: true,
    },
    status: {
        $nin: ['deleted', 'forbidden']
    }
};

Posts.find(selector).observe({
    added: function(post) {
        var stime = post.stime;
        if (stime < Date.now() - 60 * 60 * 1000) {
            return;
        }
        var actions = post.actions.concat(['_light']);
        var seeds = post.seeds || {};

        var seed = Seeds[(post.stars - 1) % 7];
        logger.info(post)
        !function autoIncr() {
            var total = _.reduce(actions, function(memo, v) {
                return memo + (seeds[v] || 1);
            }, 0);            
            var t = Date.now();
            var n0 = seed.base * _.random(0.5, 1.5);
            var t0 = seed.duration  * _.random(0.75, 1.25);
            var i = parseInt((t - stime) / (t0 / 5) / 60000);
            if (i < 5) {
                var x = (K[i] / 100) * n0 / ((t0 * 60) / 5 / 5) * _.random(0.5, 1.5);
                var val = {};
                actions.forEach(function(v) {
                    val['nActions.'+v] = parseInt(x * _.random(0.5, 1.5) * (seeds[v] || 1) / total);
                })
                Posts.update(post._id, {
                    $inc: val
                });
                logger.info(post._id, n0, t0, i, x, val);
                Meteor.setTimeout(autoIncr, 5000);
            }
        }();
    }
})