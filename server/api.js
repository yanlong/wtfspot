// API must be configured and built after startup!
var useAuth = true;
var actions = ['安慰', '送纸'];
Meteor.startup(function() {
    // Global configuration
    Restivus.configure({
        useAuth: true
    });
    Restivus.addCollection(Meteor.users, {routeOptions:{
        authRequired: true,
    }});
    Restivus.addRoute('posts/:postId?', {
        authRequired: false,
    }, {
        get: resp(function() {
            var query = {
                device: null,
            }
            return layerRoute.call(this, Posts, 'postId', null, query, {fields:{device:0}});
        }),
        post: resp(function() {
            var match = _.clone(actionNames());
            match.push([Match.OneOf.apply(null, actionNames())]);
            match = Match.OneOf.apply(null, match);
            this.bodyParams.actions = (this.bodyParams.actions||'').split(',');
            check(this.bodyParams, {
                content: String,
                actions: [String], // fortest
            })
            var selector = {
            }
            var defualts = {
            };
            var override = {
                device: this.deviceId,
                nActions: {
                },
            }
            return insert.call(this, Posts, selector, defualts, override);
        }),
        delete: resp(function () {
            check(this.params.postId, String);
            var selector = {
                device: this.deviceId,
                _id: this.params.postId,
            }
            // return selector;
            return Posts.remove(selector);
        })
    })
    Restivus.addRoute('posts/:postId/actions/', {
        authRequired: false,
    }, {
        post: resp(function() {
            check(this.bodyParams, {
                action: String,
            })
            var action = this.bodyParams.action;
            var post = Posts.findOne({_id:this.params.postId, actions:action});
            if (!post) {
                throw new Meteor.Error('invlid-post');
            }
            // limit check
            var selector = {device:this.deviceId, post:this.params.postId};
            var update = {$inc:{}}
            update.$inc['nActions.'+action] = 1;
            var userAction = Actions.upsert(selector, update);
            userAction = Actions.findOne(selector);
            var now = userAction.nActions[action] || 0;
            var limit = 3;
            if (now > limit) {
                throw new Meteor.Error('exceeded-action-limit');
            }
            var query = {$inc:{}};
            query.$inc['nActions.'+action] = 1;
            Posts.update(this.params.postId, query);
            post = Posts.findOne(this.params.postId);
            delete post.device;
            return post;
        }),
    })
    Restivus.addRoute('feedbacks/:feedbackId?', {
        authRequired: false,
    }, {
        get: resp(function() {
            var selector = {
                device: this.deviceId,
            }
            var query = {
            }
            return layerRoute.call(this, Feedbacks, 'feedbackId', selector, query);
        }),
        post: resp(function () {
            check(this.bodyParams, {
                os: String,
                model: String,
                version: String,
                contact: String,
                content: String,
            })
            var selector = this.bodyParams;
            var defualts = {
                device: this.deviceId,
            };
            var override = {
            }
            return insert.call(this, Feedbacks, selector, defualts, override);
        })
    })
    Restivus.addRoute('actionNames/', {
        authRequired: false,
    }, {
        get: resp(function() {
            return actionNames();
        }),
    })
});

var cache = {};

function phoneVerify(phone, code) {
    if (code) {
        if (cache[phone] != code) {
            throw new Meteor.Error('Phone verify failed.');
        } else {
            cache[phone] = null;
        }
    } else {
        code = ('000000' + Math.floor(Math.random() * 1e6)).slice(-6);
        Sms.send(phone, code);
        cache[phone] = code;
        return code;
    }
}

function layerRoute(collection, id, selector, query, option) {
    option = option || {};
    query = query || {};
    selector = selector || {};
    var self = this;
    var data = null;
    _.each(selector, function(v, k) {
        selector[k] = self.params[v] || v; // WARNING: hack! Support both ids map and key-value map;
    })
    var id = this.params[id];
    if (id) {
        data = getAll.call(this, collection, {_id:id}, null, option)
        data = data && data[0];
    } else {
        data = getAll.call(this, collection, selector, query, option)
    }
    return data;
}

function getAll(collection, selector, query, option) {
    selector = selector || {};
    query = query || {};
    option = option || {};
    var optionKeys = {
        // sort: 'mtime',
        limit: 20,
        skip: 0,
    };
    var self = this
    _.each(optionKeys, function(v, k) {
        if (self.queryParams[k]) {
            optionKeys[k] = parseInt(self.queryParams[k]);
        }
    })
    // option support
    _.extend(option, optionKeys);
    var query = _.reduce(query, function(memo, v, k) {
        if (self.queryParams[k]) {
            memo[k] = self.queryParams[k];
        }
        return memo;
    }, {})
    var search = {};
    // Support text search
    if (this.queryParams._wd) {
        search = [];
        var reg = new RegExp(this.queryParams._wd, 'i');
        ['title', 'subtitle'].forEach(function (v) {
            var s = {};
            s[v] = reg;
            search.push(s)
        })
        search = {$or: search}
    }
    // Support sort by field
    ['_desc', '_asc'].forEach(function (v) {
        option.sort = option.sort|| {};
        option.sort[self.queryParams[v]] = v == '_desc' ? -1: 1;
    })
    selector = _.extend(selector, query, search);
    _.each(selector, function (v, k) {
        if (_.isString(v) && v.split(',').length > 1) {
            selector[k] = {$in: v.split(',')}
        }
    })
    var records = collection.find(selector, option).fetch();
    if (this.queryParams._distinct) {
        var key = this.queryParams._distinct;
        var data = {};
        records.forEach(function (r) {
            data[r[key]] = true;
        })
        var distincted = _.map(data, function (v,k) {
            var ret = {}
            ret[key] = k;
            return ret;
        })
        if (this.queryParams._populate) {
            return populate(key, distincted)
        } 
        return distincted;
    } else {
        if (this.queryParams._populate) {
            return populate(this.queryParams._populate, records)
        }
        return records;
    }
}

function populate(key, docs, option) {
    var res = [];
    key.split(',').forEach(function (v) {
        res = _populate(v, docs, option);
    })
    return res;
}

function _populate(key, docs, option) {
    var modelMap = {
        target: 'user',
    }
    docs = docs || [];
    var ids = _.map(docs, function (v) {
        return v[key];
    })
    var map = {};
    option = option || {};

    var model = Models[key] || Models[modelMap[key]];
    // TODO: filter secret fileds
    if (model === Meteor.users) {
        option = {fields: {services:0, 'profile.phone':0, fortune:0, emails:0}};
    }
    model.find({_id: {$in: ids}}, option).forEach(function (v) {
        map[v._id] = v;
    })
    docs.forEach(function (v) {
        v[key] = map[v[key]];
    })
    return docs;
}

function populateUser(docs) {
    docs = populate('user', docs);
    return docs;
}

function insert(collection, selector, defualts, override, upsert) {
    var data = {};
    defualts = defualts || {};
    override = override || {};
    _.extend(data, defualts, this.bodyParams, selector, override);
    if (upsert) {
        var res = collection.update(data, data, {upsert:true})
        return collection.findOne(data);
    } else {
        var id = collection.insert(data);
        return collection.findOne(id)
    }
}

function update(collection, id, selector, defualts, override) {
    var data = {};
    defualts = defualts || {};
    override = override || {};
    _.extend(data, defualts, this.bodyParams, selector, override);
    collection.update(id, {$set: data});
    return collection.findOne(id)
}

function resp(fn) {
    return function() {
        try {
            this.deviceId = this.request.headers['x-device-id'];
            if (!this.deviceId) {
                throw new Meteor.Error('no-device-id');
            }
            var data = fn.call(this);
            return {
                status: 'success',
                data: data,
            }
        } catch (e) {
            logger.warn(e);
            e = e.sanitizedError || e;
            var res = {
                statusCode: 500,
                body: {
                    message: !_.isNumber(e.error) ? e.error : (e.reason || e.message) ,
                }
            }
            res.body.message = res.body.message || 'unknown-error';
            return res;
        }
    }
}

function authenticate(req) {
    var user = req.request.headers['x-user-id'];
    var token = req.request.headers['x-auth-token'];
    var selector = {_id: user, 'services.resume.loginTokens.token':token};
    return Meteor.users.findOne(selector, {fields:{username:1, profile:1}});
}

function actionNames() {
    return ActionNames.find().map(function (v) {
        return v.name;
    })
}
