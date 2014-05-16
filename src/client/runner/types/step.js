register(types.STEP = 'step', {
        label: '',
        type: types.STEP,// step, condition, find, etc.
        status: statuses.UNRESOLVED,
        state: states.WAITING,
        childIndex: -1,
        skipCount: 0,
        startTime: 0,
        time: 0,
        execCount: 0,
        increment: 50,
        expectedTime: 100, // for type:ajax calls do an expectation of 600ms by default.
        maxTime: 2000,
        progress: 0
    },
    function stepHandler(step) {
        return ex.statuses.PASS;
    }
);
