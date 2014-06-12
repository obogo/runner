// assign the recorder.
function Recorder(config) {
    //TODO: Ignore regions... how?
    //TODO: make an FYI step. url changed or any info we want in it.
    //TODO: start flag needs to be a time stamp. If over X do not resume. May need a session id as well so it can only continue on a session.
    var self = this,
        csl = new Logger("Recorder", "color:#0099FF"),
        scenario = null,
        activeStep = null,
        rootStep = {
            uid: 'R',
            type: 'root',
            steps: []
        },
        activeParent = rootStep,
        recording = false,
        queue = new StorageQueue(storage),
        doAutoStart;

    function autoStart(event) {
//TODO: need to externalize this button.
        self.dispatch(ex.events.ON_RECORDER_INIT, self);
        doAutoStart = storage.get('autoStart');
        if (doAutoStart) {
            // wait so we don't pick up any events from the button.
            setTimeout(start, 500);
        } else {
            clear();
        }
    }

    /**
     * When starting if the activeUID is presented. It will continue recording with that as the activeStep.
     * @param {String=} activeUID
     */
    function start(activeUID) {
        //TODO: need to pull from localStorage.
        if (!queue.initialLoad) {
            queue.onOnce(StorageQueue.events.ON_SERVER_UPDATE, onDataLoad);
            queue.load();
            return;
        }
        csl.log("start %s", activeUID);
        if (activeUID) {
            csl.log("\tSTART AT UID %s", activeUID);
            activeParent.steps.push(uid(activeParent, scenario));
            setActive(activeUID);
        } else { // we are starting new. Clear the storage and local references.
            csl.log("\tCLEAR");
            clear();
        }
        recording = true;
        storage.put('autoStart', true);
        self.dispatch(ex.events.runner.ON_START_RECORDING);
        exports.each(config.eventMap, listenToEvent.bind(self));
    }

    function clear() {
        queue.clear();
        rootStep = {
            uid: 'R',
            type: 'root',
            steps: [
                {uid: 'R.0', type: 'scenario', name: 'recording', steps: []}
            ]
        };
        scenario = rootStep.steps[0];
        activeParent = scenario;
        activeStep = scenario;
        storage.remove('autoStart');
    }

    /**
     * When starting if the activeUID is presented. It will continue recording with that as the activeStep.
     * @param {String} event
     * @param {Object} data
     * @param {String=} activeUID
     */
    function onDataLoad(event, data, activeUID) {
        csl.log("ON SERVICE DATA LOAD");
        scenario = data || scenario;
        activeStep = scenario;
        start(activeUID);
    }

    function setActive(uid) {
        activeStep = pathToStep(uid);
        activeParent = pathToStep(uid.replace(/\.\d+$/, ''));
    }

    function pathToStep(path) {
        path = typeof path === "string" ? uidToPath(path) : path;
        var i = 0, len = path.length, step = rootStep;
        while (i < len) {
            step = step.steps[path[i]];
            i += 1;
        }
        return step;
    }

    function stop() {
        exports.each(config.eventMap, unlistenToEvent.bind(self));
        recording = false;
        queue.sync();
        storage.remove('autoStart');
        csl.log("stop %o", scenario);
        self.dispatch(ex.events.runner.ON_STOP_RECORDING);
    }

    function isRecording() {
        return recording;
    }

    function listenToEvent(fn, eventType) {
        win.addEventListener(eventType, self, true);
    }

    function unlistenToEvent(fn, eventType) {
        win.removeEventListener(eventType, self, true);
    }

    function handleEvent(event) {
        if (recording) {
            csl.log(event.type);
            if (config.eventMap[event.type]) {
                if (config.eventMap[event.type] instanceof Array) {
                    exports.each(config.eventMap[event.type], handleEventFn, event);
                } else {
                    handleEventFn(config.eventMap[event.type], null, null, event);
                }
            }
        }
    }

    function handleEventFn(fn, index, list, event) {
        fn.apply(self, [event, addStep]);
    }

    function uid(parent, step) {
        step.uid = parent.uid + '.' + parent.steps.length;
        return step;
    }

    function addStepHandler(event, step) {
        addStep(step);
    }

    function addStep(step) {
        csl.log("ADD STEP: %o", step);
//TODO: needs to add a timestamp to each.
        var findStep;
        if (step.selector) {
            if (!activeParent.selector) {
                findStep = {type: 'find', selector: step.selector, steps: []};
                activeParent.steps.push(uid(activeParent, findStep));
                activeParent = findStep;
            }
            delete step.selector;
            activeParent.steps.push(uid(activeParent, step));
            activeStep = step;
        } else {
            if (activeParent.selector) {
                setActive(activeParent.uid);// makes the parent the activeStep;
            }
            if (activeParent === rootStep && step !== scenario) {
                activeParent = scenario;
            }
            if (activeParent === step) {
                throw new Error("Cannot add child to it's self.");
            }
            activeParent.steps.push(uid(activeParent, step));
            activeStep = step;
        }
        queue.update(scenario, activeStep.uid);

        //TODO: key with sync for this data. user.key('lastSync').get(function(){})
        //TODO: local storage stores the pending stack.
        //TODO: stack is sent to the server based on a count and a time limit.
        //TODO: validate they were received before removing from the stack.
        //TODO: every flush of the queue it creates a timestamp and that is the ID of the queue.
    }

    function listenToConfig() {
        // now add listeners for the config.
        exports.each(config.listeners, function (fn, key) {
            csl.log("\tadd listener \"%s\"", key);
            self.on(key, fn);
        });
    }

    function addConfigPublicAPI() {
        exports.each(config.public, function (value, key) {
            csl.log("\tadd public api \"%s\"", key);
            self[key] = value;
        });
    }

    //TODO: these need to be in the config if they should be public or not.
    self.start = start;
    self.stop = stop;
    self.isRecording = isRecording;
    self.handleEvent = handleEvent;
    config.on(ex.events.ADD_STEP, addStepHandler);
    dispatcher(self);
    listenToConfig();
    addConfigPublicAPI();

    if (config.startImmediately) {
        autoStart();
    } else {
        win.addEventListener("load", autoStart);
    }
}

ex.recorder = new Recorder(recorderConfig);