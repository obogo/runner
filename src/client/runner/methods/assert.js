MethodAPI.prototype[types.ASSERT] = function (step) {
    // TODO: need to run a condition passed in the data. It returns the result of the condition.
    var condition = true;
    return condition ? statuses.PASS : statuses.FAIL;
};