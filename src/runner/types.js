var types = {
        ROOT: 'root',
        STEP: 'step',
        FIND: 'find',
        CHAIN: 'chain',
        CONDITION: 'condition'
    },
    statuses = {
        FAIL: 'fail',
        PASS: 'pass',
        TIMED_OUT: 'timedOut'
    },
    states = {
        WAITING: 'waiting',
        ENTERING: 'entering',
        RUNNING: 'running',
        COMPLETE: 'complete'
    },
    events = ex.events;
