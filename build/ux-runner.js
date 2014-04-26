/*
* uxRunner v.0.0.0
* (c) 2014, WebUX
* License: MIT.
*/
(function(exports, global){
var ex = exports.runner = exports.runner || {};

ex.events = {
    START: "runner:start",
    PROGRESS: "runner:progress",
    STEP_START: "runner:stepStart",
    STEP_UPDATE: "runner:stepUpdate",
    STEP_END: "runner:stepEnd",
    STEP_PAUSE: "runner:stepPause",
    DONE: "runner:done",
    START_RECORDING: "runner:startRecording",
    STOP_RECORDING: "runner:stopRecording"
};

function dispatcher(target, scope, map) {
    var listeners = {};
    function off(event, callback) {
        var index, list;
        list = listeners[event];
        if (list) {
            if (callback) {
                index = list.indexOf(callback);
                if (index !== -1) {
                    list.splice(index, 1);
                }
            } else {
                list.length = 0;
            }
        }
    }
    function on(event, callback) {
        listeners[event] = listeners[event] || [];
        listeners[event].push(callback);
        return function() {
            off(event, callback);
        };
    }
    function fire(callback, args) {
        return callback && callback.apply(target, args);
    }
    function dispatch(event) {
        if (listeners[event]) {
            var i = 0, list = listeners[event], len = list.length;
            while (i < len) {
                fire(list[i], arguments);
                i += 1;
            }
        }
    }
    if (scope && map) {
        target.on = scope[map.on] && scope[map.on].bind(scope);
        target.off = scope[map.off] && scope[map.off].bind(scope);
        target.dispatch = scope[map.dispatch].bind(scope);
    } else {
        target.on = on;
        target.off = off;
        target.dispatch = dispatch;
    }
}

function toArray(obj) {
    var result = [], i = 0, len = obj.length;
    if (obj.length !== undefined) {
        while (i < len) {
            result.push(obj[i]);
            i += 1;
        }
    } else {
        for (i in obj) {
            if (obj.hasOwnProperty(i)) {
                result.push(obj[i]);
            }
        }
    }
    return result;
}

function sort(ary, compareFn) {
    var c, len, v, rlen, holder;
    if (!compareFn) {
        compareFn = function(a, b) {
            return a > b ? 1 : a < b ? -1 : 0;
        };
    }
    len = ary.length;
    rlen = len - 1;
    for (c = 0; c < len; c += 1) {
        for (v = 0; v < rlen; v += 1) {
            if (compareFn(ary[v], ary[v + 1]) > 0) {
                holder = ary[v + 1];
                ary[v + 1] = ary[v];
                ary[v] = holder;
            }
        }
    }
    return ary;
}

exports.util = exports.util || {};

exports.util.array = exports.util.array || {};

exports.util.array.toArray = toArray;

exports.util.array.sort = sort;

function each(list, method, data) {
    var i = 0, len, result, extraArgs;
    if (arguments.length > 2) {
        extraArgs = exports.util.array.toArray(arguments);
        extraArgs.splice(0, 2);
    }
    if (list && list.length) {
        len = list.length;
        while (i < len) {
            result = method.apply(null, [ list[i], i, list ].concat(extraArgs));
            if (result !== undefined) {
                return result;
            }
            i += 1;
        }
    } else if (!(list instanceof Array)) {
        for (i in list) {
            if (list.hasOwnProperty(i)) {
                result = method.apply(null, [ list[i], i, list ].concat(extraArgs));
                if (result !== undefined) {
                    return result;
                }
            }
        }
    }
    return list;
}

exports.each = each;

exports.extend = function(destination, source) {
    var args = exports.util.array.toArray(arguments), i = 1, len = args.length, item, j;
    while (i < len) {
        item = args[i];
        for (j in item) {
            if (destination[j] && typeof destination[j] === "object") {
                destination[j] = exports.extend(destination[j], item[j]);
            } else {
                destination[j] = item[j];
            }
        }
        i += 1;
    }
    return destination;
};

var types = {
    ROOT: "root",
    STEP: "step",
    FIND: "find",
    CHAIN: "chain",
    CONDITION: "condition"
}, statuses = {
    FAIL: "fail",
    PASS: "pass",
    TIMED_OUT: "timedOut"
}, states = {
    WAITING: "waiting",
    ENTERING: "entering",
    RUNNING: "running",
    COMPLETE: "complete"
}, events = ex.events;

function step(options, index, list, parentPath) {
    console.log("	step %s", options.label);
    parentPath = parentPath || "";
    var uid = (parentPath ? parentPath + "." : "") + (index !== undefined ? index : "R");
    var item = {
        uid: uid,
        index: index,
        label: "",
        type: "step",
        selector: "",
        check: "",
        pass: false,
        childIndex: -1,
        children: [],
        startTime: 0,
        time: 0,
        increment: 100,
        maxTime: 2e3,
        progress: 0,
        state: states.WAITING
    };
    exports.extend(item, options);
    if (list) list[index] = item;
    if (item.children.length) {
        exports.each(item.children, step, uid);
    }
    if (!list) {
        return item;
    }
}

function MethodAPI(dispatcher) {
    this.dispatcher = dispatcher;
}

MethodAPI.prototype[types.STEP] = function(step) {
    step.status = statuses.PASS;
    step.state = states.COMPLETE;
};

MethodAPI.prototype[types.FIND] = function(step) {
    step.status = statuses.PASS;
    step.state = states.COMPLETE;
};

MethodAPI.prototype[types.ROOT] = MethodAPI.prototype[types.STEP];

function fireEvent(node, eventName) {
    var doc, event, bubbles, eventClass;
    if (node.ownerDocument) {
        doc = node.ownerDocument;
    } else if (node.nodeType == 9) {
        doc = node;
    } else {
        throw new Error("Invalid node passed to fireEvent: " + node.id);
    }
    if (node.dispatchEvent) {
        eventClass = "";
        switch (eventName) {
          case "click":
          case "mousedown":
          case "mouseup":
            eventClass = "MouseEvents";
            break;

          case "focus":
          case "change":
          case "blur":
          case "select":
            eventClass = "HTMLEvents";
            break;

          default:
            throw "fireEvent: Couldn't find an event class for event '" + eventName + "'.";
        }
        event = doc.createEvent(eventClass);
        bubbles = eventName == "change" ? false : true;
        event.initEvent(eventName, bubbles, true);
        event.synthetic = true;
        node.dispatchEvent(event, true);
    } else if (node.fireEvent) {
        event = doc.createEventObject();
        event.synthetic = true;
        node.fireEvent("on" + eventName, event);
    }
}

function Path() {
    var selected, root, values = [], prop = "children";
    function setData(rootStep) {
        selected = root = rootStep;
    }
    function setPath(path) {
        var step = root;
        exports.each(path, function(pathIndex) {
            console.log("%s.childIndex = %s", step.label, pathIndex);
            pathIndex = parseInt(pathIndex, 10);
            step.childIndex = pathIndex;
            step = step[prop][pathIndex];
            values.push(pathIndex);
            selected = step;
            selected.state = states.ENTERING;
        });
        console.log("values %s", values.join("."));
    }
    function getPath(offShift) {
        if (offShift) {
            return values.slice(0, offShift);
        }
        return values;
    }
    function getSelected() {
        return selected;
    }
    function getDepth() {
        return values.length;
    }
    function next() {
        if (!selected) {
            selected = root;
            selected.state = states.ENTERING;
            console.log("	%cRoot Start: %s", "color:#F90", selected.label);
        }
        if (getNextChild() || getNextSibling() || getParent()) {
            return;
        }
        if (selected === root) {
            console.log("	%cROOT: %s", "color:#F90", selected.label);
            return;
        } else {
            next();
        }
    }
    function getNextChild() {
        var len = selected.children.length;
        if (selected.childIndex >= len) {
            return false;
        }
        if (len && selected.childIndex + 1 < len) {
            selected.childIndex += 1;
            values.push(selected.childIndex);
            selected = selected.children[selected.childIndex];
            selected.state = states.ENTERING;
            console.log("	%cgetNextChild: %s", "color:#F90", selected.label);
            return true;
        }
        selected.childrenComplete = true;
        return false;
    }
    function getParent() {
        var step = getStepFromPath(values, 0, root, -1);
        if (step) {
            values.pop();
            selected = step;
            selected.state = states.ENTERING;
            console.log("	%cgetParent: %s", "color:#F90", selected.label);
            return true;
        }
        return false;
    }
    function getNextSibling() {
        var step, parent, len = values.length - 1;
        values[len] += 1;
        step = getStepFromPath(values);
        if (step) {
            parent = getStepFromPath(values, 0, root, -1);
            parent.childIndex = values[len];
            selected = step;
            selected.state = states.ENTERING;
            console.log("	%cgetNextSibling: %s", "color:#F90", selected.label);
            return true;
        } else {
            return getParent();
        }
        return false;
    }
    function getStepFromPath(path, index, step, end) {
        step = step || root;
        index = index || 0;
        end = end || 0;
        var pathIndex = path[index];
        if (index >= path.length + end) {
            return step;
        }
        if (pathIndex !== undefined && step.children[pathIndex]) {
            step = step.children[pathIndex];
            return getStepFromPath(path, index + 1, step, end);
        }
        return null;
    }
    function getParentFrom(step) {
        var path = step.uid.split(".");
        path.shift();
        path.pop();
        return path.length ? getStepFromPath(path) : root;
    }
    function getRunPercent(step) {
        return step.time > step.maxTime ? 1 : step.time / step.maxTime;
    }
    function getProgressChanges(step, changed) {
        changed = changed || [];
        step = step || getSelected();
        updateProgress(step, changed);
        var parent = getParentFrom(step);
        if (parent && parent !== step) {
            getProgressChanges(parent, changed);
        }
        return changed;
    }
    function updateProgress(step, changed) {
        var len, childProgress, i = 0;
        if (step.state === states.COMPLETE) {
            step.progress = 1;
        } else {
            len = step.children.length;
            if (len && step.childIndex !== -1) {
                childProgress = 0;
                while (i <= step.childIndex && i < len) {
                    childProgress += step.children[i].progress;
                    i += 1;
                }
                childProgress += getRunPercent(step);
                step.progress = childProgress / (len + 1);
            } else {
                step.progress = getRunPercent(step);
            }
        }
        changed.push(step);
    }
    this.setData = setData;
    this.setPath = setPath;
    this.getDepth = getDepth;
    this.next = next;
    this.getSelected = getSelected;
    this.getPath = getPath;
    this.getProgressChanges = getProgressChanges;
}

function runner(api) {
    dispatcher(api);
    var methods = new MethodAPI(api), activePath = new Path(), options = {
        async: true
    }, intv, rootStep = step({
        uid: "R",
        label: "root",
        type: "root",
        index: -1
    });
    function getSteps() {
        return rootStep.children;
    }
    function setSteps(steps) {
        console.log("setSteps");
        exports.each(steps, step, "R");
        rootStep.children = steps;
        console.log(rootStep);
        activePath.setData(rootStep);
    }
    function start(path) {
        if (path) {
            activePath.setPath(typeof path === "string" ? path.split(".") : path);
        } else {
            activePath.setPath([ 0 ]);
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
            console.log("	complete %s", activeStep.label);
            if (activeStep.type === types.ROOT) {
                api.stop();
                return;
            }
            api.dispatch(events.STEP_END, activeStep, activePath.getPath());
            activePath.next();
            api.dispatch(events.STEP_START, activePath.getSelected(), activePath.getPath());
        } else if (activeStep.time < activeStep.maxTime) {
            activeStep.state = states.RUNNING;
            console.log("	run method %s", activeStep.type);
            methods[activeStep.type](activeStep);
            updateTime(activeStep);
            api.dispatch(events.STEP_UPDATE, activePath.getSelected(), activePath.getPath());
            if (activeStep.status === statuses.PASS) {
                console.log("	pass %s", activeStep.label);
                if (activeStep.type === types.ROOT) {
                    activeStep.state = states.COMPLETE;
                    reportProgress();
                    api.stop();
                    return;
                }
            }
        } else {
            expire(activeStep);
            return;
        }
        if (options.async) {
            clearTimeout(intv);
            intv = setTimeout(run, activeStep.increment);
        } else {
            run();
        }
    }
    function reportProgress() {
        var changes = activePath.getProgressChanges(), list = [];
        exports.each(changes, function(step) {
            list.push({
                uid: step.uid,
                progress: step.progress
            });
        });
        api.dispatch(events.PROGRESS, list);
    }
    function expire(step) {
        console.log("	run expired");
        updateTime(step);
        console.log("	expired %s %s/%s", step.label, step.time, step.maxTime);
        step.status = statuses.TIMED_OUT;
        step.state = states.COMPLETE;
    }
    function updateTime(step) {
        if (!step.startTime) step.startTime = Date.now();
        step.time = Date.now() - step.startTime;
        console.log("	updateTime %s %s/%s", step.label, step.time, step.maxTime);
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
}(this.ux = this.ux || {}, function() {return this;}()));
