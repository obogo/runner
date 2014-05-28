//registerType(
//    types.RUN = 'run',
//    {
//        scenario: '',
//        maxTime: 100
//    },
//    function runHandler(step) {
//        // we move up till we get to a scenario and then set the property.
//        var scenario = ex.getScenario(step, step.scenario);
////TODO: this needs to be async so that we could load a scenario from the server and continue.
//        if (!scenario) {
//            throw new Error("Unable to find " + types.SCENARIO + " by name of \"" + step.scenario + "\"");
//        }
//        // always re-import because uid's may change.
//        if (scenario.uid) {
//            scenario = exportStep(scenario, true);
//        }
//        step[stepsProp].push(importStep(scenario, 0, null, step.uid));
//        return ex.statuses.PASS;
//    },
//    null//,
////    function postRunHandler(step) {
////        var parent = ex.getParentOfType(step, types.SCENARIO);
////        parent.vars[step.name] = step.vars;
////    }
//);

registerType(types.RUN = 'run',
    function () {
        return {
            options: {
                scenario: '',
                maxTime: 100
            },
            preExec: function () {
                var scenario = ex.getScenario(this, this.scenario);
                //TODO: this needs to be async so that we could load a scenario from the server and continue.
                if (!scenario) {
                    throw new Error("Unable to find " + types.SCENARIO + " by name of \"" + this.scenario + "\"");
                }
                // always re-import because uid's may change.
                if (scenario.uid) {
                    scenario = exportStep(scenario, true);
                }
                this[stepsProp].push(importStep(scenario, 0, null, this.uid));
                return ex.statuses.PASS;
            },// returns status.PASS || status.FAIL,
            postExec: ['scenario', function (scenario) {
                scenario.vars[this.name] = this.steps[0].vars;
            }],// returns status.PASS || status.FAIL
            onError: ['error', 'scenario', function (error, scenario) {// return true/false. (true = continue, false = stop)

            }]
        };
    });