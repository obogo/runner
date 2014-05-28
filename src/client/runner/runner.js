function runner(api) {
    dispatcher(api);
    var rootPrefix = 'R',
        activePath = new Path(),
    //TODO: This needs to be passed in and run a default.
        options = {
            async: true
        },
        intv,
        _steps,
        rootStep = importStep({uid: rootPrefix, label: types.ROOT, type: types.ROOT, index: -1, maxTime: 100}),
//        diffRoot,
        differ = diffThrottle(api, rootStep, activePath, 1000);

    function getSteps() {
        return rootStep[stepsProp];
    }

    function loadTest(steps) {
        _steps = _.isArray(steps) ? steps : [steps];
        reset();
    }

    function reset() {
        stop();
        applySteps(_steps);
        updateTime(rootStep);
        rootStep.timeLeft = activePath.getTime();
        change(events.runner.ON_RESET);
    }

    function applySteps(steps) {
        if (steps) {
            var mySteps = exports.each(steps.slice ? steps.slice() : steps, importStep, rootPrefix);
            rootStep[stepsProp] = mySteps;
//        csl.log(rootStep, '');
            activePath.setData(rootStep);
        }
    }

    function start(path) {
        if (!options.async) {
            intv = 1;
        }
        if (path) {
            activePath.setPath(typeof path === 'string' ? path.split('.') : path);
        } else {
            activePath.setPath([0]);
        }
        csl.log(activePath.getSelected(), "start %s", activePath.getSelected().label);
        change(events.runner.ON_START);
        go();
    }

    function stop(error) {
        if (intv) { // only stop if we are going.
            if (error && console && console.log) {
                console.log("RUNNER STOPPED ON ERROR: " + error.message);
            }
            clearTimeout(intv);
            intv = 0;
            change(events.runner.ON_STOP);
        }
    }

    function resume() {
        if (activeStep) {
            // reset the step time. Then run it.
            activeStep.time = 0;
            run();
        } else {
            start();
        }
    }

    function go() {
        if (options.async) {
            clearTimeout(intv);
            intv = setTimeout(run, activePath.getSelected().increment);
        } else {
            run();
        }
    }

    function run() {
        var activeStep = activePath.getSelected();
        csl.log(activeStep, "%s:%s", activeStep.uid, activeStep.state);
        // conditionals exec first. others exec last.
        updateTime(activeStep);
        if (activeStep.state === states.COMPLETE) {
            completeStep(activeStep);
        } else if (activeStep.state === states.PRE_EXEC && !overLimit(activeStep, pre)) {
            if (isExpired(activeStep)) {
                expire(activeStep);
            } else {
                exec(activeStep, pre);
            }
        } else if (activeStep.state === states.POST_EXEC && !overLimit(activeStep, post)) {
            if (isExpired(activeStep)) {
                expire(activeStep);
            } else {
                exec(activeStep, post);
            }
        } else if (activeStep.state === states.EXEC_CHILDREN) {
            if (activeStep[stepsProp].length && activeStep.childIndex === -1) {
                activePath.next();
            } else {
                nextState(activeStep);// has run and has run children.
                if (activeStep.type === types.ROOT) {
                    api.stop();
                    change(events.runner.ON_DONE);//finished all tests.
                }
            }
        } else {
            nextState(activeStep);
        }
        if (!intv) {
            return;
        }
        updateTime(activeStep);
        change(events.runner.ON_UPDATE);
        go();
    }

    function next() {
        updateTime(activePath.getSelected());
        activePath.next();
        change();
    }

    function isExpired(step) {
        if (step.state === states.PRE_EXEC) {
            return step.pre.count * step.increment > step.maxTime;
        } else if (step.state === states.POST_EXEC) {
            return step.post.count * step.increment > step.maxTime;
        }
        return true;
    }

    // So we can limit the number of calls to a method if necessary and still have it fail.
    function overLimit(step, type) {
        var data = step[type];
        return !!(data && data.limit && data.count >= data.limit);
    }

    //TODO: when executing. need to do injection. So they can ask for variables from the scenario in any of their registered methods.
    function exec(activeStep, type) {
//        csl.log(activeStep, "run method %s", activeStep.type);
        var method = type + 'Exec',
            response = execM(activeStep, method);
        if (response) {// if they don't return a status. We don't set it.
            activeStep.status = response;
        }
        activeStep[type].count += 1;
        if (activeStep.status === statuses.PASS) {
            nextState(activeStep);
//            csl.log(activeStep, "pass %s", activeStep.label);
        } else if (isExpired(activeStep)) {
            expire(activeStep);
        }
    }

    function completeStep(activeStep) {
//        csl.log(activeStep, "complete %s", activeStep.label);
        if (activeStep.type === types.ROOT) {
            api.stop();
            return;
        }
        next();
    }

    function expire(step) {
//        csl.log(activePath.getSelected(), "run expired");
        updateTime(step);
//        csl.log(activePath.getSelected(), "expired %s %s/%s", step.label, step.time, step.maxTime);
        step.status = statuses.TIMED_OUT;
        nextState(step);
    }

    function updateTime(step) {
        var now = Date.now();
        if (!step.startTime) step.startTime = now;
        step.time = now - step.startTime;
//        csl.log(activePath.getSelected(), "updateTime %s %s/%s", step.label, step.time, step.maxTime);
    }

    function getStepFromPath(path, index, step) {
        step = step || rootStep;
        index = index || 0;
        var pathIndex = path[index];
        if (pathIndex !== undefined && step[stepsProp][pathIndex]) {
            step = step[stepsProp][pathIndex];
            return getStepFromPath(path, index + 1, step);
        }
        return step;
    }

    function change(evt) {
        differ.fire(evt);
    }

    api.options = {
        stopOnError: true
    };
    api.types = types;
    api.states = states;
    api.statuses = statuses;
    api.start = start;
    api.stop = stop;
    api.resume = resume;
    api.reset = reset;
    api.getSteps = getSteps;
    api.loadTest = loadTest;
    api.getParent = activePath.getParent;
    api.getParentOfType = function (step, type) {
        var parent = ex.getParent(step);
        while (parent.type !== type && parent.type !== types.ROOT) {
            parent = ex.getParent(parent);
        }
        if (parent.type === type) {
            return parent;
        }
        return null;
    };
    api.getPrevSibling = function (step) {
        var parent = api.getParent(step),
            prev = parent[stepsProp][step.index - 1];
        return prev;
    };
    api.getNextSibling = function (step) {
        var parent = api.getParent(step),
            nxt = parent[stepsProp][step.index + 1];
        return nxt;
    };
    api.getRoot = function () {
        api.exportRoot = api.exportRoot || {};
        exportStep(rootStep, null, api.exportRoot);
        return api.exportRoot;
    };
    api.getCurrentStep = function () {
        return activePath.getSelected();
    };
    api.getLastStep = function () {
        return activePath.getLastStep();
    };
    api.throwError = function (step, message) {
        execM(step, 'onError', {error: {type: 'internal', message: message}});
    };

    win.addEventListener('error', function (error) {
        handleError(rootStep, error);
    });

    return api;
}
runner(ex);