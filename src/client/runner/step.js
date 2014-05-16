var justInTimeOnly = {$$hashKey:true, element: true},
    omitOnSave = {$$hashKey:true, uid:true, index:true, state:true, status:true, progress:true, time:true, startTime: true, timeCount: true};

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
    children = options[stepsProp];
    exports.extend(item, typeConfigs[types.STEP], typeConfigs[options.type] || {}, options);
    if (list) list[index] = item;
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

/**
 *
 * @param step
 * @param {Boolean=} clearJIT
 * @returns {{}}
 */
function exportStep(step, clearJIT, result) {
    return _exportSteps(step, null, null, null, clearJIT ? omitOnSave : justInTimeOnly, result);
}

//TODO: page transitions, ajax calls, socket calls, etc all should have different default expectedTimes.
//TODO: write to local storage and read for page transitions. That way we always have the data immediately.
/**
 * _exportSteps
 * @param {Object} step
 * @param {Number=} index
 * @param {Array=} list
 * @param {Object=} outList
 * @returns {{}}
 */
function _exportSteps(step, index, list, outList, omits, out) {
    out = out || {};
    var defaultProps, prop;
    defaultProps = typeConfigs[step.type];
    if (!defaultProps) {
        throw new Error("Unsupported step type \"" + step.type +"\"");
    }
    for (prop in step) {
        if (omits[prop]) {
            // do not add it.
        } else if (step[prop] && step[prop].isArray) {
            out[prop] = {length: step[prop].length};
            if (step[prop].length) {
                exports.each(step[prop], _exportSteps, out[prop], omits);
            }
        } else if (step.hasOwnProperty(prop) && defaultProps[prop] !== step[prop]) {
            if (typeof step[prop] === "number" && isNaN(step[prop])) {
                throw new Error("Export NaN failure.");
            }
            out[prop] = step[prop];
        }
    }
    if (outList) {
        outList[index] = out;
    } else {
        return out;
    }
}