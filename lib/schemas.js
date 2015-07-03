Schemas = {}

Schemas.post = [{
        type: 'text',
        name: 'images',
        label: '图片',
        isImage: true,
    }, {
        type: 'text',
        name: 'title',
        label: '标题',
    }, {
        type: 'text',
        name: 'subtitle',
        label: '副标题',
    }, {
        type: 'text',
        name: 'desc',
        label: '背景描述',
    }, {
        type: 'text',
        name: 'rule',
        label: '规则',
    }, {
        type: 'text',
        name: 'postive',
        label: '正面描述',
    }, {
        type: 'text',
        name: 'posTag',
        label: '正面标签',
    }, {
        type: 'text',
        name: 'posDesc',
        label: '正面标签描述',
    }, {
        type: 'text',
        name: 'negtive',
        label: '反面描述',
    }, {
        type: 'text',
        name: 'negTag',
        label: '反面标签',
    }, {
        type: 'text',
        name: 'negDesc',
        label: '反面标签描述',
    }, {
        type: 'text',
        name: 'catalog',
        label: '分类',
    }, {
        type: 'text',
        name: 'subcatalog',
        label: '子分类',
    }, {
        type: 'text',
        name: 'tags',
        label: '标签',
    }, {
        type: 'datetime-local',
        name: 'begin',
        label: '开始时间',
    }, {
        type: 'datetime-local',
        name: 'end',
        label: '结束时间',
        optional: true,
    }, {
        type: 'text',
        name: 'endCondition',
        label: '结束条件',
    }, {
        type: 'number',
        name: 'open',
        label: '开盘价',
    }];


Schemas.getValues = function (form, schema) {
    var values = {};
    schema.forEach(function (v,k) {
        var value = $(form).find('input#'+v.name).val();
        if (!value && !v.optional) {
            throw Meteor.Error(500, 'schema-match-failed');
        }
        if (v.type == 'number') {
            value = parseInt(value);
        }
        values[v.name] = value;
    })
    return values;
}