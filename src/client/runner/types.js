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
    stepsProp = 'steps',
    events = ex.events,
    dependencyProp = '_depencency',
    typeConfigs = {};