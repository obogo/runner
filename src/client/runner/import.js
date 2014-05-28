/**
 * importSteps
 * @param {Object} options
 * @param {Number=} index
 * @param {Array=} list
 * @param {String=} aprentPath
 * @returns {{}}
 */
function importStep(options, index, list, parentPath) {
    console.log("\tstep %s", options.label);
    parentPath = parentPath || '';
    var uid = (parentPath ? parentPath + '.' : '') + (index !== undefined ? index : 'R'), i, iLen, children;
    var item = {};
    item.uid = uid;
    item.index = index;
    item.type = item.type || types.STEP;
    // force an array when only one item.
    if (options.hasOwnProperty(stepsProp) && !(options[stepsProp] instanceof Array) && options[stepsProp].length === 1) {
        options[stepsProp] = [options[stepsProp]];
    }
    children = options[stepsProp];
    exports.extend(item, typeConfigs[types.STEP], typeConfigs[options.type] || {}, options);
    if (list) list[index] = item;
    if (item.conditions && item.conditions.length) {
        var j = 0, jLen = item.conditions.length;
        while (j < jLen) {
            if (!item.conditions[j].steps.isArray) {
                item.conditions[j].steps = [item.conditions[j].steps];
            }
            exports.each(item.conditions[j].steps, importStep, uid);
            j += 1;
        }
    }
    if (children && children.length) {
        i = 0;
        iLen = item[stepsProp].length;
        item[stepsProp] = [];
        while (i < iLen) {
            importStep(children[i], i, item[stepsProp], uid);
            i += 1;
        }
    } else {
        item[stepsProp] = [];// so we don't have to keep checking for null.
    }
    if (!list) {
        return item;// so root can be created.
    }
}