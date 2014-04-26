function runner(api) {
    dispatcher(api);
    var methods = new MethodAPI(api), // internal mapping of types to methods.
        activePath = new Path(),
    //TODO: This needs to be passed in and run a default.
        options = {
            async: true
        },
        intv,
        rootStep = step({uid:'R', label:'root', type:'root', index: -1});

    function getSteps() {
        return rootStep.children;
    }

    function setSteps(steps) {
        console.log("setSteps");
        exports.each(steps, step, 'R');
        rootStep.children = steps;
        console.log(rootStep);
        activePath.setData(rootStep);
    }

    function start(path) {
        if (path) {
            activePath.setPath(typeof path === 'string' ? path.split('.') : path);
        } else {
            activePath.setPath([0]);
        }
        console.log("start %s", activePath.getSelected().label);
        api.dispatch(events.START, activePath.getSelected());
        run();
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

    function run() {
        var activeStep = activePath.getSelected();
        console.log("run %s state:%s", activeStep.label, activeStep.state);
        reportProgress();
        if (activeStep.children.length && activeStep.childIndex === -1) {
            activePath.next();
        } else if (activeStep.state === states.COMPLETE) {
            console.log("\tcomplete %s", activeStep.label);
            if (activeStep.type === types.ROOT) {
                api.stop();
                return;
            }
            api.dispatch(events.STEP_END, activeStep, activePath.getPath());
            activePath.next();
            api.dispatch(events.STEP_START, activePath.getSelected(), activePath.getPath());
        } else if (activeStep.time < activeStep.maxTime) {
            activeStep.state = states.RUNNING;
            console.log("\trun method %s", activeStep.type);
            methods[activeStep.type](activeStep);
            updateTime(activeStep);
            api.dispatch(events.STEP_UPDATE, activePath.getSelected(), activePath.getPath());
            if (activeStep.status === statuses.PASS) {
                console.log("\tpass %s", activeStep.label);
                if (activeStep.type === types.ROOT) {
                    activeStep.state = states.COMPLETE;
                    reportProgress();
                    api.stop();
                    return;
                }
            }
        } else {
            expire(activeStep);
            return; // we are expired.
        }
        if (options.async) {
            clearTimeout(intv);
            intv = setTimeout(run, activeStep.increment);
        } else {
            run();
        }
    }

    function reportProgress() {
        //TODO: break up into just id's and progress for each.
        var changes = activePath.getProgressChanges(), list = [];
        exports.each(changes, function (step) {
            list.push({uid: step.uid, progress: step.progress});
        });
        api.dispatch(events.PROGRESS, list);
    }

    function expire(step) {
        console.log("\trun expired");
        updateTime(step);
        console.log("\texpired %s %s/%s", step.label, step.time, step.maxTime);
        step.status = statuses.TIMED_OUT;
        step.state = states.COMPLETE;
    }

    function updateTime(step) {
        if (!step.startTime) step.startTime = Date.now();
        step.time = Date.now() - step.startTime;
        console.log("\tupdateTime %s %s/%s", step.label, step.time, step.maxTime);
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
    api.getSteps = getSteps;
    api.setSteps = setSteps;

    return api;
}
runner(ex);