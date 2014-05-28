registerType(types.SET = 'set', function () {
    return {
        options: {
            property: '',
            text: '',
            increment: 0,
            maxTime: 10
        },
        preExec: ['scenario', function (scenario) {
            if (scenario) {
                scenario.vars[this.property] = this.text;
            } else {
                throw new Error("Type \"" + types.SET + "\" can only be used inside a scenario.");
            }
            // we move up till we get to a scenario and then set the property.
            return ex.statuses.PASS;
        }]
    };
});
