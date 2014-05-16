function runner(api) {
    dispatcher(api);
    var rootPrefix = 'R',
        methods = new MethodAPI(api), // internal mapping of types to methods.
        activePath = new Path(),
    //TODO: This needs to be passed in and run a default.
        options = {
            async: true
        },
        intv,
        _steps,
        rootStep = importStep({uid:rootPrefix, label:types.ROOT, type:types.ROOT, index: -1, maxTime: 100}),
//        diffRoot,
        differ = diffThrottle(api, rootStep, activePath, 1000);

    function getSteps() {
        return rootStep[stepsProp];
    }

    function setSteps(steps) {
        _steps = steps;
        reset();
    }

    function reset() {
        stop();
        applySteps(_steps);
        updateTime(rootStep);
        rootStep.timeLeft = activePath.getTime();
        change(events.RESET);
    }

    function applySteps(steps) {
        var mySteps = exports.each(steps.slice(), importStep, rootPrefix);
        rootStep[stepsProp] = mySteps;
        csl.log(rootStep, '');
        activePath.setData(rootStep);
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
        change(events.START);
        go();
    }

    function stop() {
        if (intv) { // only stop if we are going.
            clearTimeout(intv);
            intv = 0;
            change(events.STOP);
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
        csl.log(activeStep, "run %s state:%s", activeStep.label, activeStep.state);
        // conditionals exec first. others exec last.
        updateTime(activeStep);
        if (activePath.isCondition(activeStep)) {
            if (activeStep.status === statuses.SKIP) {
                activeStep.progress = 0;
                next();
            } else if (activeStep.state === states.COMPLETE) {
                next();
            } else if (activeStep.status !== statuses.PASS) {
                exec(activeStep, checkDependency(activeStep));
            } else if (activeStep[stepsProp].length && activeStep.childIndex < activeStep[stepsProp].length - 1) {
                next();
            } else if (isExpired(activeStep)) {
                activeStep.state = states.COMPLETE;
                completeStep(activeStep);
            } else {
                expire(activeStep);
            }
        } else {
            if (activeStep[stepsProp].length && activeStep.childIndex === -1) {
                activePath.next();
            } else if (activeStep.state === states.COMPLETE) {
                completeStep(activeStep);
            } else if (!isExpired(activeStep)) {
                exec(activeStep, checkDependency(activeStep));
            } else {
                expire(activeStep);
            }
        }
        if (!intv) {
            return;
        }
        updateTime(activeStep);
        change(events.UPDATE);
        go();
    }

    function next() {
        updateTime(activePath.getSelected());
        activePath.next();
        change();
    }

    function isExpired(step) {
        return step.execCount * step.increment > step.maxTime;
    }

    function checkDependency(activeStep) {
        var result;
        if (MethodAPI.prototype[activeStep.type + dependencyProp]) {
            result = MethodAPI.prototype[activeStep.type + dependencyProp](activeStep);
            if (result) {
                return result;
            }
            throw new Error("Dependency Failure: \"" + activeStep + "\" unable to fetch dependency.");
        }
        return;
    }

    function exec(activeStep, dependency) {
        activeStep.state = states.RUNNING;
        csl.log(activeStep, "run method %s", activeStep.type);
        activeStep.status = methods[activeStep.type](activeStep, dependency);
        activeStep.execCount += 1;
        if (activeStep.status === statuses.PASS) {
            activeStep.state = states.COMPLETE;
            activePath.skipBlock();
            csl.log(activeStep, "pass %s", activeStep.label);
            if (activeStep.type === types.ROOT) {
                api.stop();
                change(events.DONE);//finished all tests.
            }
        } else if (isExpired(activeStep)) {
            expire(activeStep);
        }
    }

    function completeStep(activeStep) {
        csl.log(activeStep, "complete %s", activeStep.label);
        if (activeStep.type === types.ROOT) {
            api.stop();
            return;
        }
        next();
    }

    function expire(step) {
        csl.log(activePath.getSelected(), "run expired");
        updateTime(step);
        csl.log(activePath.getSelected(), "expired %s %s/%s", step.label, step.time, step.maxTime);
        step.status = activePath.isCondition(step) ? statuses.SKIP : statuses.TIMED_OUT;
        step.state = states.COMPLETE;
    }

    function updateTime(step) {
        var now = Date.now();
        if (!step.startTime) step.startTime = now;
        step.time = now - step.startTime;
        csl.log(activePath.getSelected(), "updateTime %s %s/%s", step.label, step.time, step.maxTime);
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

    api.types = types;
    api.states = states;
    api.statuses = statuses;
    api.register = register;
    api.start = start;
    api.stop = stop;
    api.resume = resume;
    api.reset = reset;
    api.getSteps = getSteps;
    api.setSteps = setSteps;
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

    return api;
}
runner(ex);