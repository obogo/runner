(function () {
    registerType(types.CONDITION = 'condition', function () {
        function test(condition, index, list, scenario) {
            if (!condition.expression || exports.parser.parse(condition.expression)(scenario.vars)) {
                return condition.steps;
            }
        }

        return {
            options: {
                conditions: [],
                increment: 1,
                expectedTime: 2,
                maxTime: 10
            },
            preExec: ['scenario', function (scenario) {
                this.steps = exports.each(this.conditions, test, scenario);
                return statuses.PASS;
            }]
        };
    });
}());