//TODO: need convert in and convert out to handle arrays and convert them to objects and back to arrays.

var types = {
        ROOT: 'root',
        STEP: 'step',
        VAR: 'var',
        FIND: 'find',
            FIND_TEXT: 'findText',
            FIND_VAL: 'findVal',
        ASSERT: 'assert',
        EXPECT: 'expect',
        IF: 'if',
        ELSEIF: 'elseif',
        ELSE: 'else',
        AJAX: 'ajax', // ajax calls.
        PATH: 'path', // hash changes in the url
        PAGE: 'page', // full page load changes.
        SOCKET: 'socket'
    },
    statuses = {
        UNRESOLVED: 'unresolved',
        FAIL: 'fail',
        PASS: 'pass',
        TIMED_OUT: 'timedOut',
        //Skip means that it is not used in any calculations like percents. Skips are usually part of conditions that didn't get executed.
        SKIP: 'skip'
    },
    states = {
        WAITING: 'waiting',
        ENTERING: 'entering',
        RUNNING: 'running',
        COMPLETE: 'complete'
    },
    events = ex.events,
    defaults = {
        root: {},
        step: {
            label: '',
            type: 'step',// step, condition, find, etc.
            status: statuses.UNRESOLVED,
            state: states.WAITING,
            childIndex: -1,
            skipCount: 0,
            startTime: 0,
            endTime: 0,
            time: 0,
            increment: 50,
            expectedTime: 100, // for type:ajax calls do an expectation of 600ms by default.
            maxTime: 2000,
            progress: 0,
            data: undefined, // expected to be passed in.
            payload: undefined // this is for setting values that other steps can use to compare.
        },
        var: {
            maxTime: 200,
        },
        assert: {
            maxTime: 1000
        },
        expect: {
            maxTime: 1000
        },
        find: {
            maxTime: 10000
        },
        findVal: {
            maxTime: 1000
        },
        findText: {
            maxTime: 1000
        },
        if: {
            increment: 10,
            expectedTime: 50,
            maxTime: 500
        },
        elseif: {
            increment: 10,
            expectedTime: 50,
            maxTime: 500
        },
        else: {
            increment: 10,
            expectedTime: 50,
            maxTime: 500
        },
        ajax: {
            expectedTime: 600,
            maxTime: 60000
        },
        path: {
            expectedTime: 1000,
            maxTime: 10000
        },
        page: {
            expectedTime: 2000,
            maxTime: 30000
        },
        socked: {
            expectedTime: 1000,
            maxTime: 10000
        }
    };