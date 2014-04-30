var types = {
        ROOT: 'root',
        STEP: 'step',
        FIND: 'find',
        CHAIN: 'chain',
        IF: 'if',
        ELSEIF: 'elseif',
        ELSE: 'else'
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
    events = ex.events;
