registerType(types.SCENARIO = 'scenario', function () {
    return {
        options: {
            vars: {},
            scenarios: {},
            maxTime: 100
        },
        preExec: function scenarioHandler() {
            if (!ex.hasScenario(this, this.name)) {
                ex.registerScenario(this);
            }
            return ex.statuses.PASS;
        }
    };
});
