MethodAPI.prototype[types.EXPECT] = function (step) {
    var lastStep = ex.getLastStep();
    return lastStep.payload === step.data ? statuses.PASS : statuses.FAIL;
};