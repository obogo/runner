/**
 * ###<a name="extend">extend</a>###
 * Perform a deep extend.
 * @param {Object} destination
 * @param {Object=} source
 * return {Object|destination}
 */
function extend(destination, source) {
    var args = exports.util.array.toArray(arguments), i = 1, len = args.length, item, j;
    var options = this || {};
    while (i < len) {
        item = args[i];
        for (j in item) {
            if (item.hasOwnProperty(j)) {
                if (destination[j] && typeof destination[j] === 'object') {
                    destination[j] = extend.apply(options, [destination[j], item[j]]);
                } else if (item[j] instanceof Array) {
                    destination[j] = destination[j] || (options && options.arrayAsObject ? {length: item[j].length} : []);
                    if (item[j].length) {
                        destination[j] = extend.apply(options, [destination[j], item[j]]);
                    }
                } else if (item[j] && typeof item[j] === 'object') {
                    if (options.objectsAsArray && typeof item[j].length === "number") {
                        if (!(destination[j] instanceof Array)) {
                            destination[j] = [];
                        }
                    }
                    destination[j] = extend.apply(options, [destination[j] || {}, item[j]]);
                } else {
                    destination[j] = item[j];
                }
            }
        }
        i += 1;
    }
    return destination;
}

exports.extend = extend;