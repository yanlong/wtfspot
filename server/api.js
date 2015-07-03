// API must be configured and built after startup!
var useAuth = true;
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
            }
            return layerRoute.call(this, Posts, 'postId', null, query);
        }),
        post: resp(function() {
            check(this.bodyParams, {
                content: String,
                actions: [Match.OneOf.apply(null, ['安慰', '送纸'])],
            })
            var selector = {
            }
            var defualts = {
            };
            var override = {
                device: this.deviceId,
            }
            return insert.call(this, Posts, selector, defualts, override);
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
            e = e.sanitizedError || e;
            var res = {
                statusCode: 500,
                body: {
                    message: !_.isNumber(e.error) ? e.error : (e.reason || e.message) ,
                }
            }
            res.body.message = res.body.message || 'unknown-error';
            logger.warn(e);
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

