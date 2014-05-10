var justInTimeOnly = {$$hashKey:true, element: true},
    omitOnSave = {$$hashKey:true, uid:true, index:true, state:true, status:true, progress:true, time:true, startTime: true, endTime:true};

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
    children = options.children;
    exports.extend(item, defaults[types.STEP], defaults[options.type] || {}, options);
    if (list) list[index] = item;
    if (children && children.length) {
        i = 0;
        iLen = item.children.length;
        item.children = [];
        while (i < iLen) {
            importStep(children[i], i, item.children, uid);
            i += 1;
        }
    } else {
        item.children = [];// so we don't have to keep checking for null.
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
function exportStep(step, clearJIT) {
    return _exportSteps(step, null, null, null, clearJIT ? omitOnSave : justInTimeOnly);
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
function _exportSteps(step, index, list, outList, omits) {
    var out = {}, defaultProps, prop;
    defaultProps = defaults[step.type];
    for (prop in step) {
        if (omits[prop]) {
            // do not add it.
        } else if (prop === "children") {
            out[prop] = {length: step.children.length};
            exports.each(step.children, _exportSteps, out[prop], omits);
        } else if (step.hasOwnProperty(prop) && defaultProps[prop] !== step[prop]) {
            out[prop] = step[prop];
        }
    }
    if (outList) {
        outList[index] = out;
    } else {
        return out;
    }
}