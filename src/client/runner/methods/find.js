MethodAPI.prototype[types.FIND] = function (step) {
    if (!step.data || typeof step.data !== "string") {
        throw new Error("Invalid selector for step of type " + step.type);
    }
    var el = exports.selector.query(step.data);
    step.element = el && el[0];
    step.payload = el.length;
    return !!step.element ? statuses.PASS : statuses.FAIL;
};

// All methods below assume their previous step was a find or find method.
// because find and find methods set the element that is used on the next
// step.
MethodAPI.prototype[types.FIND + 'Val'] = function (step) {
    var lastStep = ex.getLastStep();
    step.element = lastStep.element;
    step.payload = step.element.value;
    return statuses.PASS;// not async because it just returns what it is.
};
MethodAPI.prototype[types.FIND + 'Text'] = function (step) {
    var lastStep = ex.getLastStep();
    step.element = lastStep.element;
    step.payload = step.element.innerText;
    return statuses.PASS;// not async because it just returns what it is.
};