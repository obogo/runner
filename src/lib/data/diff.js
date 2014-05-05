exports.data = exports.data || {};
exports.data.diff = function (source, compare) {
    var ret = {}, dateStr;
    source = source || {};// if null is passed. It should still export a full diff.
    for (var name in compare) {
        if (name in source) {
            if (_.isDate(compare[name])) {
                dateStr = _.isDate(source[name]) ? source[name].toISOString() : source[name];
                if (compare[name].toISOString() !== dateStr) {
                    ret[name] = compare[name];
                }
            } else if (_.isObject(compare[name]) && !_.isArray(compare[name])) {
                var diff = exports.data.diff(source[name], compare[name]);
                if (!_.isEmpty(diff)) {
                    ret[name] = diff;
                }
            } else if (!_.isEqual(source[name], compare[name])) {
                ret[name] = compare[name];
            }
        } else {
            ret[name] = compare[name];
        }
    }

    if (_.isEmpty(ret)) {
        return null;
    }
    return ret;
};