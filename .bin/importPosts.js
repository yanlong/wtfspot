var xlsx = require('node-xlsx');
var request = require('request');
var fs = require('fs');

var args = process.argv.slice(2);
var file = args[0];
var env = args[1] || 'development';

var host = env == 'production' ? 'http://dev.china-caogen.com:8100' : 'http://localhost:3000';

console.log('Run on:', env, host);

var content = xlsx.parse(file);

var posts = content[0].data;
var requestWrapper = request.defaults({
    pool: {
        maxSockets: 128,
    }
})


// posts.forEach(function (post) {
//     insert(post)
// })
var count = 0;

!function imports() {
    if (posts.length) {
        insert(posts.pop());
        setTimeout(imports, 20);
    } else {
        console.log('all done');
    }
}();


function insert(post) {
    var actions = [];
    for (var i = 2; i < 5; i++) {
        if (post[i]) {
            actions.push(post[i]);
        }
    }

    var option = {
        method: 'post',
        url: host + '/api/posts',
        headers: {
            'x-device-id': 'wtfspot',
        },
        form: {
            content: post[1],
            actions: actions.join(','),
            scene: post[0],
            begin: post[5],
            end: post[6],
        }
    };

    // console.log(option);
    requestWrapper(option, function(err, res, body) {
        if (err) {
            return console.log(err)
        }
        body = JSON.parse(body)
        console.log('insert one done: ', ++count, body.data._id);
    })
}