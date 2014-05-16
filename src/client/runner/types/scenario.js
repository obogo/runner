register(types.SCENARIO = 'scenario', {
        vars: {},
        maxTime: 100
    },
    function scenarioHandler(step) {
        return ex.statuses.PASS;
    }
);
