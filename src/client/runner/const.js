var types = {},
    statuses = {
        UNRESOLVED: 'unresolved',
        FAIL: 'fail',
        PASS: 'pass',
        TIMED_OUT: 'timedOut'
    },
    states = {
        WAITING: 'waiting',
        PRE_EXEC: 'preExec',
        EXEC_CHILDREN: 'execChildren',
        POST_EXEC: 'postExec',
        COMPLETE: 'complete'
    },
    stepsProp = 'steps',
    events = ex.events,
    dependencyProp = '_depencency',
    reservedTypes = {if:true, elseif:true, else:true},// properties you cannot register.
    typeConfigs = {},
    typeData = {},
    scenarios = {},
    pre = 'pre',
    post = 'post',
    win = window,
    doc = win.document;

function nextState(step) {
    if (step.state === states.WAITING) {
        setState(step, states.PRE_EXEC);
    } else if (step.state === states.PRE_EXEC) {
        setState(step, states.EXEC_CHILDREN);
    } else if (step.state === states.EXEC_CHILDREN) {
        setState(step, states.POST_EXEC);
    } else if (step.state === states.POST_EXEC) {
        setState(step, states.COMPLETE);
    } else {
        throw new Error("Cannot proceed to next state.");
    }
}

function setState(step, state) {
    var data = typeData[step.type];
    if (!state) {
        throw new Error("Invalid State \"" + state + "\"");
    }
    step.stateHistory.push(step.state);
    step.state = state;
    if (data.onStateChange) execM(step, 'onStateChange', {state: step.state, prevState: step.stateHistory[step.stateHistory.length - 1]});
}

function execM(step, methodName, locals) {
    var result;
    if (typeData[step.type][methodName]) {
        try {
            result = invoke(typeData[step.type][methodName], step, locals);
        } catch (e) {
            handleError(step, e);
        }
    }
    return result;
    // otherwise return nothing.
}

function hasHistoryState(step, state) {
    return step.stateHistory.indexOf(state) !== -1;
}

function handleError(step, e) {
    var error = {message:e.toString(), stackTrace: exports.printStackTrace(e)};
    step.errors = step.errors || [];
    step.errors.push(error);
    if (ex.options.stopOnError) {
        invoke(ex.stop, step, {error:error});
    }
}