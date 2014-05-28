registerType(types.STEP = 'step', function () {
    return {
        options: {
            label: '',
            type: types.STEP,// step, condition, find, etc.
            status: statuses.UNRESOLVED,
            state: states.WAITING,
            stateHistory: [],
            childIndex: -1,
            startTime: 0,
            time: 0,
            increment: 50,
            expectedTime: 100, // for type:ajax calls do an expectation of 600ms by default.
            maxTime: 2000,
            progress: 0,
            pre: {count: 0, limit: 0},
            post: {count: 0, limit: 0}
        },
        preExec: function () {
            return statuses.PASS;
        }
    };
});
