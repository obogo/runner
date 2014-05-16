register(types.SET = 'set', {
        property: '',
        text: '',
        maxTime: 1000
    },
    function stepHandler(step, dependency) {
        if (dependency) {
            dependency.vars[step.property] = step.text;
        } else {
            throw new Error("Type \"" + types.SET + "\" can only be used inside a scenario.");
        }
        // we move up till we get to a scenario and then set the property.
        return ex.statuses.PASS;
    },
    function handleDependency(step) {
        return ex.getParentOfType(step, types.SCENARIO);
    }
);
