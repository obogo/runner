var justInTimeOnly = {$$hashKey:true, element: true, stateHistory: true, $inject: true},
    omitOnSave = {$$hashKey:true, uid:true, index:true, state:true, status:true, progress:true, time:true, startTime: true, timeCount: true, stateHistory: true},
    directExport = {errors: true, pre: true, post: true};

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
        if (reservedTypes[step.type]) {
            defaultProps = {};
        } else {
            throw new Error("Unsupported step type \"" + step.type +"\"");
        }
    }
    for (prop in step) {
        if (omits[prop]) {
            // do not add it.
        } else if (step[prop] && step[prop].isArray) {
            out[prop] = {length: step[prop].length};
            if (step[prop].length) {
                if (directExport[prop]) {
                    out[prop] = exports.extend.apply({arrayAsObject:true}, [{}, step[prop]]);
                } else {
                    exports.each(step[prop], _exportSteps, out[prop], omits);
                }
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