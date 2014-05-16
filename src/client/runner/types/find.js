(function () {
    function handleDependency(step) {
        return ex.getParentOfType(step, types.FIND);
    }

    register(types.FIND = 'find', {
            maxTime: 10000
        },
        function findHandler(step) {
            return step.override || ex.statuses.PASS;
        }
    );
    register(types.VAL = 'val', {
            maxTime: 10000
        },
        function valHandler(step, depencency) {
            return step.override || ex.statuses.PASS;
        },
        handleDependency
    );
    register(types.TEXT = 'text', {
            maxTime: 10000
        },
        function textHandler(step, dependency) {
            return step.override || ex.statuses.PASS;
        },
        handleDependency
    );
}());