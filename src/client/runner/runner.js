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
        rootStep = importStep({uid:rootPrefix, label:types.ROOT, type:types.ROOT, children:[], index: -1, maxTime: 100}),
        diffRoot;

    function getSteps() {
        return rootStep.children;
    }

    function setSteps(steps) {
        _steps = steps;
        reset();
    }

    function reset() {
        stop();
        applySteps(_steps);
        rootStep.timeLeft = activePath.getTime();
        api.dispatch(events.RESET, rootStep);
    }

    function applySteps(steps) {
        var mySteps = exports.each(steps.slice(), importStep, rootPrefix);
        rootStep.children = mySteps;
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
        api.dispatch(events.START, activePath.getSelected());
        api.dispatch(events.STEP_START, activePath.getSelected(), activePath.getPath());
        go();
    }

    function stop() {
        clearTimeout(intv);
        intv = 0;
        api.dispatch(events.STOP);
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
        reportProgress();
        // conditionals exec first. others exec last.
        if (activePath.isCondition(activeStep)) {
            if (activeStep.status === statuses.SKIP) {
                activeStep.progress = 0;
                next();
            } else if (activeStep.state === states.COMPLETE) {
                next();
            } else if (activeStep.status !== statuses.PASS) {
                exec(activeStep);
            } else if (activeStep.children.length && activeStep.childIndex < activeStep.children.length - 1) {
                next();
            } else if (activeStep.time < activeStep.maxTime) {
                activeStep.state = states.COMPLETE;
                completeStep(activeStep);
            } else {
                expire(activeStep);
            }
        } else {
            if (activeStep.children.length && activeStep.childIndex === -1) {
                activePath.next();
            } else if (activeStep.state === states.COMPLETE) {
                completeStep(activeStep);
            } else if (activeStep.time < activeStep.maxTime) {
                exec(activeStep);
            } else {
                expire(activeStep);
            }
        }
        if (!intv) {
            return;
        }
        go();
    }

    function next() {
        activePath.next();
        api.dispatch(events.STEP_START, activePath.getSelected(), activePath.getPath());
    }

    function exec(activeStep) {
        activeStep.state = states.RUNNING;
        csl.log(activeStep, "run method %s", activeStep.type);
        activeStep.status = methods[activeStep.type](activeStep);
        updateTime(activeStep);
        api.dispatch(events.STEP_UPDATE, activePath.getSelected(), activePath.getPath());
        if (activeStep.status === statuses.PASS) {
            activeStep.state = states.COMPLETE;
            activePath.skipBlock();
            csl.log(activeStep, "pass %s", activeStep.label);
            if (activeStep.type === types.ROOT) {
                reportProgress();
                api.stop();
                return;
            }
        } else if (activeStep.time > activeStep.maxTime) {
            expire(activeStep);
        }
    }

    function completeStep(activeStep) {
        activeStep.endTime = Date.now();
        updateTime(activeStep);
        csl.log(activeStep, "complete %s", activeStep.label);
        if (activeStep.type === types.ROOT) {
            api.stop();
            return;
        }
        api.dispatch(events.STEP_END, activeStep, activePath.getPath());
        next();
    }

    function reportProgress() {
        //TODO: break up into just id's and progress for each.
        var changes = activePath.getProgressChanges(), list = [], exportData;
        exports.each(changes, function (step) {
            var item = {uid: step.uid, progress: step.progress};
            if (step.type === types.ROOT) {
                item.timeLeft = step.timeLeft = activePath.getTime();
            }
            list.push(item);
        });
        api.dispatch(events.PROGRESS, changes);
        exportData = exportStep(rootStep);
//        console.log("EXPORT: %o", exportData);
        var myDiff = exports.data.diff(diffRoot, exportData);//, diffRoot || {});
        console.log("DIFF: %o", myDiff);
        diffRoot = exportData;
    }

    function expire(step) {
        csl.log(activePath.getSelected(), "run expired");
        updateTime(step);
        csl.log(activePath.getSelected(), "expired %s %s/%s", step.label, step.time, step.maxTime);
        step.status = activePath.isCondition(step) ? statuses.SKIP : statuses.TIMED_OUT;
        step.state = states.COMPLETE;
    }

    function updateTime(step) {
        if (!step.startTime) step.startTime = Date.now();
        step.time = Date.now() - step.startTime;
        csl.log(activePath.getSelected(), "updateTime %s %s/%s", step.label, step.time, step.maxTime);
    }

    function getStepFromPath(path, index, step) {
        step = step || rootStep;
        index = index || 0;
        var pathIndex = path[index];
        if (pathIndex !== undefined && step.children[pathIndex]) {
            step = step.children[pathIndex];
            return getStepFromPath(path, index + 1, step);
        }
        return step;
    }

    api.types = types;
    api.start = start;
    api.stop = stop;
    api.resume = resume;
    api.reset = reset;
    api.getSteps = getSteps;
    api.setSteps = setSteps;

    return api;
}
runner(ex);