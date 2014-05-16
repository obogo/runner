register(types.RUN = 'run', {
        scenario: '',
        maxTime: 100
    },
    //TODO: automatically copy and insert running scenario.
    function runHandler(step) {
        // we move up till we get to a scenario and then set the property.
        return ex.statuses.PASS;
    }
);
