/*
* goRunner v.0.0.1
* (c) 2014, Obogo
* License: Obogo 2014. All Rights Reserved.
*/
(function(exports, global){
"use strict";
var ex = exports.runner = exports.runner || {};

ex.events = {
    START: "runner:start",
    STOP: "runner:stop",
    UPDATE: "runner:update",
    RESET: "runner:reset",
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

function extend(destination, source) {
    var args = exports.util.array.toArray(arguments), i = 1, len = args.length, item, j;
    while (i < len) {
        item = args[i];
        for (j in item) {
            if (destination[j] && typeof destination[j] === "object") {
                destination[j] = extend(destination[j], item[j]);
            } else if (item[j] instanceof Array) {
                destination[j] = extend(destination[j] || [], item[j]);
            } else if (item[j] && typeof item[j] === "object") {
                destination[j] = extend(destination[j] || {}, item[j]);
            } else {
                destination[j] = item[j];
            }
        }
        i += 1;
    }
    return destination;
}

exports.extend = extend;

var _;

(function() {
    var arrayPool = [], objectPool = [];
    var maxPoolSize = 40;
    function getArray() {
        return arrayPool.pop() || [];
    }
    function releaseArray(array) {
        array.length = 0;
        if (arrayPool.length < maxPoolSize) {
            arrayPool.push(array);
        }
    }
    if (window._) {
        _ = window._;
    } else {
        Array.prototype.isArray = true;
        _ = {};
        _.extend = function(target, source) {
            target = target || {};
            for (var prop in source) {
                if (source.hasOwnProperty(prop)) {
                    if (typeof source[prop] === "object") {
                        target[prop] = _.extend(target[prop], source[prop]);
                    } else {
                        target[prop] = source[prop];
                    }
                }
            }
            return target;
        };
        _.isString = function(val) {
            return typeof val === "string";
        };
        _.isBoolean = function(val) {
            return typeof val === "boolean";
        };
        _.isNumber = function(val) {
            return typeof val === "number";
        };
        _.isArray = function(val) {
            return val ? !!val.isArray : false;
        };
        _.isEmpty = function(val) {
            if (_.isString(val)) {
                return val === "";
            }
            if (_.isArray(val)) {
                return val.length === 0;
            }
            if (_.isObject(val)) {
                for (var e in val) {
                    return false;
                }
                return true;
            }
            return false;
        };
        _.isUndefined = function(val) {
            return typeof val === "undefined";
        };
        _.isFunction = function(val) {
            return typeof val === "function";
        };
        _.isObject = function(val) {
            return typeof val === "object";
        };
        _.isDate = function(val) {
            return val instanceof Date;
        };
        var objectTypes = {
            "boolean": false,
            "function": true,
            object: true,
            number: false,
            string: false,
            undefined: false
        };
        var argsClass = "[object Arguments]", arrayClass = "[object Array]", boolClass = "[object Boolean]", dateClass = "[object Date]", funcClass = "[object Function]", numberClass = "[object Number]", objectClass = "[object Object]", regexpClass = "[object RegExp]", stringClass = "[object String]";
        _.isEqual = function baseIsEqual(a, b, callback, isWhere, stackA, stackB) {
            if (callback) {
                var result = callback(a, b);
                if (typeof result != "undefined") {
                    return !!result;
                }
            }
            if (a === b) {
                return a !== 0 || 1 / a == 1 / b;
            }
            var type = typeof a, otherType = typeof b;
            if (a === a && !(a && objectTypes[type]) && !(b && objectTypes[otherType])) {
                return false;
            }
            if (a == null || b == null) {
                return a === b;
            }
            var className = toString.call(a), otherClass = toString.call(b);
            if (className == argsClass) {
                className = objectClass;
            }
            if (otherClass == argsClass) {
                otherClass = objectClass;
            }
            if (className != otherClass) {
                return false;
            }
            switch (className) {
              case boolClass:
              case dateClass:
                return +a == +b;

              case numberClass:
                return a != +a ? b != +b : a == 0 ? 1 / a == 1 / b : a == +b;

              case regexpClass:
              case stringClass:
                return a == String(b);
            }
            var isArr = className == arrayClass;
            if (!isArr) {
                var aWrapped = hasOwnProperty.call(a, "__wrapped__"), bWrapped = hasOwnProperty.call(b, "__wrapped__");
                if (aWrapped || bWrapped) {
                    return baseIsEqual(aWrapped ? a.__wrapped__ : a, bWrapped ? b.__wrapped__ : b, callback, isWhere, stackA, stackB);
                }
                if (className != objectClass) {
                    return false;
                }
                var ctorA = a.constructor, ctorB = b.constructor;
                if (ctorA != ctorB && !(isFunction(ctorA) && ctorA instanceof ctorA && isFunction(ctorB) && ctorB instanceof ctorB) && ("constructor" in a && "constructor" in b)) {
                    return false;
                }
            }
            var initedStack = !stackA;
            stackA || (stackA = getArray());
            stackB || (stackB = getArray());
            var length = stackA.length;
            while (length--) {
                if (stackA[length] == a) {
                    return stackB[length] == b;
                }
            }
            var size = 0;
            result = true;
            stackA.push(a);
            stackB.push(b);
            if (isArr) {
                length = a.length;
                size = b.length;
                result = size == length;
                if (result || isWhere) {
                    while (size--) {
                        var index = length, value = b[size];
                        if (isWhere) {
                            while (index--) {
                                if (result = baseIsEqual(a[index], value, callback, isWhere, stackA, stackB)) {
                                    break;
                                }
                            }
                        } else if (!(result = baseIsEqual(a[size], value, callback, isWhere, stackA, stackB))) {
                            break;
                        }
                    }
                }
            } else {
                forIn(b, function(value, key, b) {
                    if (hasOwnProperty.call(b, key)) {
                        size++;
                        return result = hasOwnProperty.call(a, key) && baseIsEqual(a[key], value, callback, isWhere, stackA, stackB);
                    }
                });
                if (result && !isWhere) {
                    forIn(a, function(value, key, a) {
                        if (hasOwnProperty.call(a, key)) {
                            return result = --size > -1;
                        }
                    });
                }
            }
            stackA.pop();
            stackB.pop();
            if (initedStack) {
                releaseArray(stackA);
                releaseArray(stackB);
            }
            return result;
        };
    }
})();

exports.data = exports.data || {};

exports.data.inspector = function() {
    function Inspector(data) {
        this.data = data || {};
    }
    Inspector.prototype.get = function(path, delimiter) {
        var arr = path.split(delimiter || "."), space = "", i = 0, len = arr.length;
        var data = this.data;
        while (i < len) {
            space = arr[i];
            data = data[space];
            if (data === undefined) {
                break;
            }
            i += 1;
        }
        return data;
    };
    Inspector.prototype.set = function(path, value, delimiter, merge) {
        var arr = path.split(delimiter || "."), space = "", i = 0, len = arr.length - 1;
        var data = this.data;
        while (i < len) {
            space = arr[i];
            if (space) {
                if (data[space] === undefined || data[space] === null) {
                    data = data[space] = {};
                } else {
                    data = data[space];
                }
            }
            i += 1;
        }
        if (arr.length > 1) {
            var prop = arr.pop();
            if (data[prop] && merge) {
                angular.extend(data[prop], value);
            } else {
                data[prop] = value;
            }
        }
        return this.data;
    };
    Inspector.prototype.path = function(path) {
        return this.set(path, {});
    };
    return function(data) {
        return new Inspector(data);
    };
}();

exports.data = exports.data || {};

exports.data.diff = function(source, compare) {
    var ret = {}, dateStr;
    source = source || {};
    for (var name in compare) {
        if (name in source) {
            if (_.isDate(compare[name])) {
                dateStr = _.isDate(source[name]) ? source[name].toISOString() : source[name];
                if (compare[name].toISOString() !== dateStr) {
                    ret[name] = compare[name];
                }
            } else if (_.isObject(compare[name]) && !_.isArray(compare[name])) {
                var diff = exports.data.diff(source[name], compare[name]);
                if (!_.isEmpty(diff)) {
                    ret[name] = diff;
                }
            } else if (!_.isEqual(source[name], compare[name])) {
                ret[name] = compare[name];
            }
        } else {
            ret[name] = compare[name];
        }
    }
    if (_.isEmpty(ret)) {
        return null;
    }
    return ret;
};

var csl = function() {
    var api = {};
    function log(step) {
        var depth = step.uid.split(".").length, args = exports.util.array.toArray(arguments), str = charPack("	", depth) + step.uid + ":" + step.type + ":" + step.status + ":" + step.state + ":" + step.progress + "::";
        args.shift();
        args[0] = str + args[0];
        console.log.apply(console, args);
    }
    function charPack(c, len) {
        var s = "";
        while (s.length < len) {
            s += c;
        }
        return s;
    }
    api.log = log;
    return api;
}();

var types = {
    ROOT: "root",
    STEP: "step",
    VAR: "var",
    FIND: "find",
    FIND_TEXT: "findText",
    FIND_VAL: "findVal",
    ASSERT: "assert",
    EXPECT: "expect",
    IF: "if",
    ELSEIF: "elseif",
    ELSE: "else",
    AJAX: "ajax",
    PATH: "path",
    PAGE: "page",
    SOCKET: "socket"
}, statuses = {
    UNRESOLVED: "unresolved",
    FAIL: "fail",
    PASS: "pass",
    TIMED_OUT: "timedOut",
    SKIP: "skip"
}, states = {
    WAITING: "waiting",
    ENTERING: "entering",
    RUNNING: "running",
    COMPLETE: "complete"
}, stepsProp = "steps", events = ex.events, dependencyProp = "_depencency", typeConfigs = {};

function MethodAPI(dispatcher) {
    this.dispatcher = dispatcher;
}

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

var cb_addEventListener = function(obj, evt, fnc) {
    if (obj.addEventListener) {
        obj.addEventListener(evt, fnc, false);
        return true;
    } else if (obj.attachEvent) {
        return obj.attachEvent("on" + evt, fnc);
    } else {
        evt = "on" + evt;
        if (typeof obj[evt] === "function") {
            fnc = function(f1, f2) {
                return function() {
                    f1.apply(this, arguments);
                    f2.apply(this, arguments);
                };
            }(obj[evt], fnc);
        }
        obj[evt] = fnc;
        return true;
    }
    return false;
};

MethodAPI.prototype[types.ASSERT] = function(step) {
    var condition = true;
    return condition ? statuses.PASS : statuses.FAIL;
};

MethodAPI.prototype[types.EXPECT] = function(step) {
    var lastStep = ex.getLastStep();
    return lastStep.payload === step.data ? statuses.PASS : statuses.FAIL;
};

MethodAPI.prototype[types.FIND] = function(step) {
    if (!step.data || typeof step.data !== "string") {
        throw new Error("Invalid selector for step of type " + step.type);
    }
    var el = exports.selector.query(step.data);
    step.element = el && el[0];
    step.payload = el.length;
    return !!step.element ? statuses.PASS : statuses.FAIL;
};

MethodAPI.prototype[types.FIND + "Val"] = function(step) {
    var lastStep = ex.getLastStep();
    step.element = lastStep.element;
    step.payload = step.element.value;
    return statuses.PASS;
};

MethodAPI.prototype[types.FIND + "Text"] = function(step) {
    var lastStep = ex.getLastStep();
    step.element = lastStep.element;
    step.payload = step.element.innerText;
    return statuses.PASS;
};

function Path() {
    var selected, root, values = [], pendingProgressChanges, lastStep;
    function setData(rootStep) {
        selected = root = rootStep;
    }
    function setPath(path) {
        var step = root;
        exports.each(path, function(pathIndex) {
            csl.log(step, "%s.childIndex = %s", step.label, pathIndex);
            pathIndex = parseInt(pathIndex, 10);
            step.childIndex = pathIndex;
            step = step[stepsProp][pathIndex];
            values.push(pathIndex);
            selected = step;
            selected.state = states.ENTERING;
        });
        csl.log(step, "values %s", values.join("."));
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
            select(root);
            csl.log("	%cRoot Start: %s", "color:#F90", selected.label);
        }
        if (selectNextChild() || selectNextSibling() || selectParent()) {
            if (selected.status === statuses.SKIP) {
                next();
            }
            return;
        }
        if (selected === root) {
            csl.log(selected, "%cROOT: %s", "color:#F90", selected.label);
            return;
        } else {
            next();
        }
    }
    function uidToPath(step) {
        var path = step.uid.split("."), i = 0, len = path.length - 1;
        path.shift();
        while (i < len) {
            path[i] = parseInt(path[i], 10);
            i += 1;
        }
        return path;
    }
    function select(step) {
        var parent, path = uidToPath(step), i = 0, len = path.length;
        parent = getStepFromPath(path, 0, root, -1);
        if (parent) {
            parent.childIndex = path[len - 1] || 0;
        }
        values.length = 0;
        while (i < len) {
            values[i] = path[i];
            i += 1;
        }
        selected = step;
        selected.state = states.ENTERING;
    }
    function selectNextChild() {
        var len = selected[stepsProp].length;
        if (selected.status === statuses.SKIP || selected.childIndex >= len) {
            return false;
        }
        if (len && selected.childIndex + 1 < len) {
            select(selected[stepsProp][selected.childIndex + 1]);
            csl.log(selected, "%cgetNextChild: %s", "color:#F90", selected.label);
            return true;
        }
        selected.childrenComplete = true;
        return false;
    }
    function selectParent() {
        var step = getStepFromPath(values, 0, root, -1);
        if (step) {
            select(step);
            csl.log(selected, "%cgetParent: %s", "color:#F90", selected.label);
            return true;
        }
        return false;
    }
    function selectNextSibling() {
        var step, len = values.length - 1;
        values[len] += 1;
        step = getStepFromPath(values, 0, root, 0);
        if (step) {
            select(step);
            csl.log(selected, "%cgetNextSibling: %s", "color:#F90", selected.label);
            return true;
        } else {
            return selectParent();
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
        if (pathIndex !== undefined && step[stepsProp][pathIndex]) {
            step = step[stepsProp][pathIndex];
            return getStepFromPath(path, index + 1, step, end);
        }
        return null;
    }
    function getParentFrom(step) {
        var path = uidToPath(step);
        return path.length ? getStepFromPath(path, 0, root, -1) : root;
    }
    function getAllProgress() {
        var changed = [];
        _getAllProgress(root, null, null, changed);
        return changed;
    }
    function _getAllProgress(step, index, list, changed) {
        if (step.status === statuses.SKIP) {
            exports.each(step[stepsProp], skipStep);
        }
        exports.each(step[stepsProp], _getAllProgress, changed);
        updateProgress(step, changed);
    }
    function getRunPercent(step) {
        return step.status === statuses.PASS ? 1 : step.time > step.maxTime ? 1 : step.time / step.maxTime;
    }
    function getProgressChanges(step, changed) {
        changed = changed || pendingProgressChanges && pendingProgressChanges.slice() || [];
        step = step || getSelected();
        if (!step) {
            return;
        }
        if (pendingProgressChanges) {
            pendingProgressChanges = null;
        }
        updateProgress(step, changed);
        var parent = getParentFrom(step);
        if (parent && parent !== step) {
            getProgressChanges(parent, changed);
        }
        return changed;
    }
    function storeProgressChanges(step) {
        pendingProgressChanges = getProgressChanges(step);
    }
    function updateProgress(step, changed) {
        var len, childProgress, i = 0;
        if (step.status === statuses.SKIP) {
            step.progress = 0;
            return;
        }
        if (step.state === states.COMPLETE) {
            step.progress = 1;
        } else {
            len = step[stepsProp].length;
            if (len && step.childIndex !== -1) {
                childProgress = 0;
                step.skipCount = 0;
                while (i <= step.childIndex && i < len) {
                    if (step[stepsProp][i].status != statuses.SKIP) {
                        childProgress += step[stepsProp][i].progress;
                    } else {
                        step.skipCount += 1;
                    }
                    i += 1;
                }
                childProgress += getRunPercent(step);
                step.progress = childProgress / (len - step.skipCount + (step.type !== types.ROOT ? 1 : 0));
            } else {
                step.progress = getRunPercent(step);
            }
        }
        changed.push(step);
    }
    function skipBlock() {
        if (selected.type === types.IF || selected.type === types.ELSEIF || selected.type === types.ELSE) {
            var parent = getStepFromPath(values, 0, root, -1);
            if (selected.type === types.ELSEIF || selected.type === types.ELSE) {
                skipPreDependentChildCondition(parent);
            }
            if (selected.type === types.IF || selected.type === types.ELSEIF) {
                skipPostDependentCondition(parent);
            }
        }
    }
    function skipPreDependentChildCondition(parent) {
        var j = parent.childIndex - 1, jLen = 0;
        while (j >= jLen) {
            var s = parent[stepsProp][j];
            if (s.type === types.IF || s.type === types.ELSEIF) {
                skipStep(s);
            } else {
                break;
            }
            j -= 1;
        }
    }
    function skipPostDependentCondition(parent) {
        var i = parent.childIndex + 1, iLen = parent[stepsProp].length;
        while (i < iLen) {
            var s = parent[stepsProp][i];
            if (s.type === types.ELSEIF || s.type === types.ELSE) {
                skipStep(s);
            } else {
                break;
            }
            i += 1;
        }
    }
    function skipStep(step) {
        if (step.status !== statuses.SKIP) {
            csl.log(step, "%cSKIP %s", "color:#FF6600", step.uid);
            step.status = statuses.SKIP;
            storeProgressChanges(step);
        }
    }
    function isCondition(step) {
        return step.type === types.IF || step.type === types.ELSEIF || step.type === types.ELSE;
    }
    function getTime() {
        var result = getStepTime(root), avg = result.complete ? result.time / result.complete : 0, estimate = result.total * avg;
        if (result.totalTime > estimate) {
            estimate = result.totalTime;
        }
        return Math.ceil((estimate - result.time) * .001);
    }
    function getStepTime(step) {
        var complete = 0, total = 0, time = 0, totalTime = 0, result, i = 0, iLen = step[stepsProp].length;
        while (i < iLen) {
            if (step[stepsProp].length) {
                result = getStepTime(step[stepsProp][i]);
                complete += result.complete;
                total += result.total;
                time += result.time;
                totalTime += result.totalTime;
            }
            complete += step.state === states.COMPLETE ? 1 : 0;
            total += 1;
            time += step.time;
            totalTime += step.time || step.increment * 2;
            i += 1;
        }
        return {
            complete: complete,
            total: total,
            time: time,
            totalTime: totalTime
        };
    }
    this.setData = setData;
    this.setPath = setPath;
    this.getDepth = getDepth;
    this.next = function() {
        lastStep = getSelected();
        return next();
    };
    this.getLastStep = function() {
        return lastStep;
    };
    this.getSelected = getSelected;
    this.getPath = getPath;
    this.getProgressChanges = getProgressChanges;
    this.getAllProgress = getAllProgress;
    this.skipBlock = skipBlock;
    this.isCondition = isCondition;
    this.getTime = getTime;
    this.getParent = getParentFrom;
}

function diffThrottle(runner, rootStep, activePath, throttle) {
    var api = {}, diffRoot, lastEvent, lastTime = 0, intv;
    throttle = throttle || 0;
    function fire(evt) {
        var now = Date.now(), then = lastTime + throttle;
        clearTimeout(intv);
        if (evt) {
            console.log("%c%s", "color:#009900;", evt);
            lastEvent = evt;
        }
        if (now > then) {
            lastTime = now;
            run();
        } else {
            intv = setTimeout(fire, then - now);
        }
    }
    function run() {
        var path = activePath.getPath().join("."), exportData, myDiff;
        rootStep.activePath = "R" + (path && "." + path || "");
        activePath.getProgressChanges();
        exportData = exportStep(rootStep);
        myDiff = exports.data.diff(diffRoot, exportData);
        diffRoot = exportData;
        runner.dispatch(lastEvent, myDiff);
    }
    api.throttle = throttle;
    api.fire = fire;
    return api;
}

function register(type, options, method, dependencyMethod) {
    if (typeConfigs[type]) {
        throw new Error(type + " is already registered");
    }
    types[type.toUpperCase()] = type;
    typeConfigs[type] = options;
    MethodAPI.prototype[type] = method;
    if (dependencyMethod) {
        MethodAPI.prototype[type + dependencyProp] = dependencyMethod;
    }
}

register(types.STEP = "step", {
    label: "",
    type: types.STEP,
    status: statuses.UNRESOLVED,
    state: states.WAITING,
    childIndex: -1,
    skipCount: 0,
    startTime: 0,
    time: 0,
    execCount: 0,
    increment: 50,
    expectedTime: 100,
    maxTime: 2e3,
    progress: 0
}, function stepHandler(step) {
    return ex.statuses.PASS;
});

register("root", {}, function rootHandler() {
    return statuses.PASS;
});

(function() {
    function handleDependency(step) {
        var prevSibling = ex.getPrevSibling(step);
        if (prevSibling && (prevSibling.type === types.IF || prevSibling.type === types.ELSEIF)) {
            return prevSibling;
        }
        return null;
    }
    register(types.IF = "if", {
        increment: 10,
        expectedTime: 50,
        maxTime: 500
    }, function ifHandler(step) {
        return step.override || ex.statuses.PASS;
    });
    register(types.ELSEIF = "elseif", {
        increment: 10,
        expectedTime: 50,
        maxTime: 500
    }, function elseIfHandler(step, dependency) {
        return step.override || ex.statuses.PASS;
    }, handleDependency);
    register(types.ELSE = "else", {
        increment: 10,
        expectedTime: 50,
        maxTime: 500
    }, function elseHandler(step, dependency) {
        return step.override || ex.statuses.PASS;
    }, handleDependency);
})();

(function() {
    function handleDependency(step) {
        return ex.getParentOfType(step, types.FIND);
    }
    register(types.FIND = "find", {
        maxTime: 1e4
    }, function findHandler(step) {
        return step.override || ex.statuses.PASS;
    });
    register(types.VAL = "val", {
        maxTime: 1e4
    }, function valHandler(step, depencency) {
        return step.override || ex.statuses.PASS;
    }, handleDependency);
    register(types.TEXT = "text", {
        maxTime: 1e4
    }, function textHandler(step, dependency) {
        return step.override || ex.statuses.PASS;
    }, handleDependency);
})();

register(types.RUN = "run", {
    scenario: "",
    maxTime: 100
}, function runHandler(step) {
    return ex.statuses.PASS;
});

register(types.SCENARIO = "scenario", {
    vars: {},
    maxTime: 100
}, function scenarioHandler(step) {
    return ex.statuses.PASS;
});

register(types.SET = "set", {
    property: "",
    text: "",
    maxTime: 1e3
}, function stepHandler(step, dependency) {
    if (dependency) {
        dependency.vars[step.property] = step.text;
    } else {
        throw new Error('Type "' + types.SET + '" can only be used inside a scenario.');
    }
    return ex.statuses.PASS;
}, function handleDependency(step) {
    return ex.getParentOfType(step, types.SCENARIO);
});

function runner(api) {
    dispatcher(api);
    var rootPrefix = "R", methods = new MethodAPI(api), activePath = new Path(), options = {
        async: true
    }, intv, _steps, rootStep = importStep({
        uid: rootPrefix,
        label: types.ROOT,
        type: types.ROOT,
        index: -1,
        maxTime: 100
    }), differ = diffThrottle(api, rootStep, activePath, 1e3);
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
        csl.log(rootStep, "");
        activePath.setData(rootStep);
    }
    function start(path) {
        if (!options.async) {
            intv = 1;
        }
        if (path) {
            activePath.setPath(typeof path === "string" ? path.split(".") : path);
        } else {
            activePath.setPath([ 0 ]);
        }
        csl.log(activePath.getSelected(), "start %s", activePath.getSelected().label);
        change(events.START);
        go();
    }
    function stop() {
        if (intv) {
            clearTimeout(intv);
            intv = 0;
            change(events.STOP);
        }
    }
    function resume() {
        if (activeStep) {
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
            throw new Error('Dependency Failure: "' + activeStep + '" unable to fetch dependency.');
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
                change(events.DONE);
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
    api.getParentOfType = function(step, type) {
        var parent = ex.getParent(step);
        while (parent.type !== type && parent.type !== types.ROOT) {
            parent = ex.getParent(parent);
        }
        if (parent.type === type) {
            return parent;
        }
        return null;
    };
    api.getPrevSibling = function(step) {
        var parent = api.getParent(step), prev = parent[stepsProp][step.index - 1];
        return prev;
    };
    api.getNextSibling = function(step) {
        var parent = api.getParent(step), nxt = parent[stepsProp][step.index + 1];
        return nxt;
    };
    api.getRoot = function() {
        api.exportRoot = api.exportRoot || {};
        exportStep(rootStep, null, api.exportRoot);
        return api.exportRoot;
    };
    api.getCurrentStep = function() {
        return activePath.getSelected();
    };
    api.getLastStep = function() {
        return activePath.getLastStep();
    };
    return api;
}

runner(ex);

var justInTimeOnly = {
    $$hashKey: true,
    element: true
}, omitOnSave = {
    $$hashKey: true,
    uid: true,
    index: true,
    state: true,
    status: true,
    progress: true,
    time: true,
    startTime: true,
    timeCount: true
};

function importStep(options, index, list, parentPath) {
    console.log("	step %s", options.label);
    parentPath = parentPath || "";
    var uid = (parentPath ? parentPath + "." : "") + (index !== undefined ? index : "R"), i, iLen, children;
    var item = {};
    item.uid = uid;
    item.index = index;
    item.type = item.type || types.STEP;
    children = options[stepsProp];
    exports.extend(item, typeConfigs[types.STEP], typeConfigs[options.type] || {}, options);
    if (list) list[index] = item;
    if (children && children.length) {
        i = 0;
        iLen = item[stepsProp].length;
        item[stepsProp] = [];
        while (i < iLen) {
            importStep(children[i], i, item[stepsProp], uid);
            i += 1;
        }
    } else {
        item[stepsProp] = [];
    }
    if (!list) {
        return item;
    }
}

function exportStep(step, clearJIT, result) {
    return _exportSteps(step, null, null, null, clearJIT ? omitOnSave : justInTimeOnly, result);
}

function _exportSteps(step, index, list, outList, omits, out) {
    out = out || {};
    var defaultProps, prop;
    defaultProps = typeConfigs[step.type];
    if (!defaultProps) {
        throw new Error('Unsupported step type "' + step.type + '"');
    }
    for (prop in step) {
        if (omits[prop]) {} else if (step[prop] && step[prop].isArray) {
            out[prop] = {
                length: step[prop].length
            };
            if (step[prop].length) {
                exports.each(step[prop], _exportSteps, out[prop], omits);
            }
        } else if (step.hasOwnProperty(prop) && defaultProps[prop] !== step[prop]) {
            if (typeof step[prop] === "number" && isNaN(step[prop])) {
                throw new Error("Export NaN failure.");
            }
            out[prop] = step[prop];
        }
    }
    if (outList) {
        outList[index] = out;
    } else {
        return out;
    }
}

exports.selector = function() {
    var omitAttrs, uniqueAttrs, classFilters, classFiltersFctn, api;
    function query(selectorStr, el) {
        el = el || api.config.doc.body;
        var rx = /:eq\((\d+)\)$/, match = selectorStr.match(rx), result, count;
        if (match && match.length) {
            selectorStr = selectorStr.replace(rx, "");
            count = match[1];
        }
        result = el.querySelectorAll(selectorStr);
        if (result && count !== undefined) {
            return result[count];
        }
        return result;
    }
    function getCleanSelector(el, ignoreClass) {
        if (validateEl(el)) {
            var ignore = buildIgnoreFunction(ignoreClass), matches, index, str, maxParent = api.config.doc.body, selector = getSelectorData(el, maxParent, ignore, null, true);
            while (selector.count > selector.totalCount) {
                selector = selector.parent;
            }
            selector = selector.parent || selector;
            str = selector.str || selectorToString(selector);
            if (selector.str) {
                var child = selector.child;
                while (child) {
                    str += " " + child.str;
                    child = child.child;
                }
            }
            if (selector.count > 1 || selector.child && selector.child.count) {
                matches = exports.util.array.toArray(query(str, maxParent));
                index = matches.indexOf(el);
                str += ":eq(" + index + ")";
            }
            str += getVisible();
            return str;
        }
        return "";
    }
    function quickSelector(element, maxParent, ignoreClass) {
        if (validateEl(element)) {
            var ignore = buildIgnoreFunction(ignoreClass), selector = getSelectorData(element, maxParent, ignore);
            return selectorToString(selector) + getVisible();
        }
        return "";
    }
    function validateEl(el) {
        if (!el) {
            return "";
        }
        if (el && el.length) {
            throw new Error("selector can only build a selection to a single DOMElement. A list was passed.");
        }
        return true;
    }
    function getVisible() {
        return api.config.addVisible ? ":visible" : "";
    }
    function matchesClass(item, matcher) {
        if (typeof matcher === "string" && matcher === item) {
            return true;
        }
        if (typeof matcher === "object" && item.match(matcher)) {
            return true;
        }
        return false;
    }
    function getSelectorData(element, maxParent, ignoreClass, child, smartSelector) {
        var result;
        if (!element) {
            return "";
        }
        maxParent = maxParent || api.config.doc;
        result = {
            element: element,
            ignoreClass: ignoreClass,
            maxParent: maxParent,
            classes: getClasses(element, ignoreClass),
            attributes: getAttributes(element, child),
            type: element.nodeName && element.nodeName.toLowerCase() || "",
            child: child
        };
        if (!result.attributes.$unique || child) {
            if (smartSelector) {
                result.str = selectorToString(result, 0, null, true);
                result.count = maxParent.querySelectorAll(result.str).length;
                if (result.count > 1) {
                    result.parent = getParentSelector(element, maxParent, ignoreClass, result, smartSelector);
                }
            } else {
                result.parent = getParentSelector(element, maxParent, ignoreClass, result, smartSelector);
            }
        }
        return result;
    }
    function filterNumbers(item) {
        return typeof item !== "number";
    }
    function buildIgnoreFunction(ignoreClasses) {
        ignoreClasses = ignoreClasses || [];
        if (typeof ignoreClasses === "function") {
            return ignoreClasses;
        }
        return function(cls) {
            if (ignoreClasses instanceof Array) {
                var i = 0, iLen = ignoreClasses.length;
                while (i < iLen) {
                    if (matchesClass(cls, ignoreClasses[i])) {
                        return false;
                    }
                    i += 1;
                }
            } else if (matchesClass(cls, ignoreClasses)) {
                return false;
            }
            return true;
        };
    }
    function getClasses(element, ignoreClass) {
        var classes = ux.filter(element.classList, filterNumbers);
        classes = ux.filter(classes, classFiltersFctn);
        return ux.filter(classes, ignoreClass);
    }
    function getAttributes(element, child) {
        var i = 0, len = element.attributes ? element.attributes.length : 0, attr, attributes = [], uniqueAttr = getUniqueAttribute(element.attributes);
        if (uniqueAttr) {
            if (uniqueAttr.name === "id" && api.config.allowId) {
                attributes.push("#" + uniqueAttr.value);
            } else if (uniqueAttr.name !== "id") {
                attributes.push(createAttrStr(uniqueAttr));
            }
            if (attributes.length) {
                attributes.$unique = true;
                return attributes;
            }
        }
        if (api.config.allowAttributes) {
            while (i < len) {
                attr = element.attributes[i];
                if (!omitAttrs[attr.name] && !uniqueAttrs[attr.name]) {
                    attributes.push(createAttrStr(attr));
                }
                i += 1;
            }
        }
        return attributes;
    }
    function createAttrStr(attr) {
        return "[" + camelCase(attr.name) + "='" + escapeQuotes(attr.value) + "']";
    }
    function getUniqueAttribute(attributes) {
        var attr, i = 0, len = attributes ? attributes.length : 0, name;
        while (i < len) {
            attr = attributes[i];
            name = camelCase(attr.name);
            if (uniqueAttrs[name]) {
                return attr;
            }
            i += 1;
        }
        return null;
    }
    function camelCase(name) {
        var ary, i = 1, len;
        if (name.indexOf("-")) {
            ary = name.split("-");
            len = ary.length;
            while (i < len) {
                ary[i] = ary[i].charAt(0).toUpperCase() + ary[i].substr(1);
                i += 1;
            }
            name = ary.join("");
        }
        return name;
    }
    function escapeQuotes(str) {
        return str.replace(/"/g, "&quot;").replace(/'/g, "&apos;");
    }
    function selectorToString(selector, depth, overrideMaxParent, skipCount) {
        var matches, str, parent;
        depth = depth || 0;
        str = selector && !selector.attributes.$unique ? selectorToString(selector.parent, depth + 1) : "";
        if (selector) {
            str += (str.length ? " " : "") + getSelectorString(selector);
        }
        if (!depth && !skipCount) {
            parent = overrideMaxParent || selector.maxParent;
            matches = parent.querySelectorAll && parent.querySelectorAll(str) || [];
            if (matches.length > 1) {
                str += ":eq(" + getIndexOfTarget(matches, selector.element) + ")";
            }
        }
        return str;
    }
    function getSelectorString(selector) {
        if (selector.attributes.$unique) {
            return selector.attributes[0];
        }
        return selector.type + selector.attributes.join("") + (selector.classes.length ? "." + selector.classes.join(".") : "");
    }
    function getParentSelector(element, maxParent, ignoreClass, child, detailed) {
        var parent = element.parentNode;
        if (parent && parent !== maxParent) {
            return getSelectorData(element.parentNode, maxParent, ignoreClass, child, detailed);
        }
        return null;
    }
    function getIndexOfTarget(list, element) {
        var i, iLen = list.length;
        for (i = 0; i < iLen; i += 1) {
            if (element === list[i]) {
                return i;
            }
        }
        return -1;
    }
    function getList(obj) {
        var ary = [], i;
        for (i in obj) {
            if (obj.hasOwnProperty(i)) {
                ary.push(obj[i]);
            }
        }
        return ary;
    }
    api = {
        config: {
            doc: window.document,
            allowId: true,
            allowAttributes: true,
            addVisible: false
        },
        addOmitAttrs: function(name) {
            exports.each(arguments, function(name) {
                omitAttrs[name] = true;
            });
            return this;
        },
        removeOmitAttrs: function(name) {
            exports.each(arguments, function(name) {
                delete omitAttrs[name];
            });
            return this;
        },
        getOmitAttrs: function() {
            return getList(omitAttrs);
        },
        resetOmitAttrs: function() {
            omitAttrs = {
                "class": true,
                style: true
            };
        },
        addUniqueAttrs: function(name) {
            exports.each(arguments, function(name) {
                uniqueAttrs[name] = true;
            });
            return this;
        },
        removeUniqueAttrs: function(name) {
            exports.each(arguments, function(name) {
                delete uniqueAttrs[name];
            });
            return this;
        },
        getUniqueAttrs: function() {
            return getList(uniqueAttrs);
        },
        resetUniqueAttrs: function() {
            uniqueAttrs = {
                id: true,
                uid: true
            };
        },
        addClassOmitFilters: function() {
            exports.each(arguments, function(filter) {
                classFilters.push(filter);
            });
            classFiltersFctn = buildIgnoreFunction(classFilters);
            return this;
        },
        removeClassOmitFilters: function() {
            exports.each(arguments, function(filter) {
                var index = classFilters.indexOf(filter);
                if (index !== -1) {
                    classFilters.splice(index, 1);
                }
            });
            classFiltersFctn = buildIgnoreFunction(classFilters);
            return this;
        },
        getClassOmitFilters: function() {
            return classFilters.slice(0);
        },
        resetClassOmitFilters: function() {
            classFilters = [];
            classFiltersFctn = buildIgnoreFunction(classFilters);
        },
        query: query,
        get: getCleanSelector,
        getCleanSelector: getCleanSelector,
        quickSelector: quickSelector,
        reset: function() {
            api.resetOmitAttrs();
            api.resetUniqueAttrs();
            api.resetClassOmitFilters();
        }
    };
    api.reset();
    return api;
}();

(function(exports, global) {
    function setter(obj, path, setValue, fullExp, options) {
        options = options || {};
        var element = path.split("."), key;
        for (var i = 0; element.length > 1; i++) {
            key = ensureSafeMemberName(element.shift(), fullExp);
            var propertyObj = obj[key];
            if (!propertyObj) {
                propertyObj = {};
                obj[key] = propertyObj;
            }
            obj = propertyObj;
            if (obj.then && options.unwrapPromises) {
                promiseWarning(fullExp);
                if (!("$$v" in obj)) {
                    (function(promise) {
                        promise.then(function(val) {
                            promise.$$v = val;
                        });
                    })(obj);
                }
                if (obj.$$v === undefined) {
                    obj.$$v = {};
                }
                obj = obj.$$v;
            }
        }
        key = ensureSafeMemberName(element.shift(), fullExp);
        obj[key] = setValue;
        return setValue;
    }
    var getterFnCache = {};
    function cspSafeGetterFn(key0, key1, key2, key3, key4, fullExp, options) {
        ensureSafeMemberName(key0, fullExp);
        ensureSafeMemberName(key1, fullExp);
        ensureSafeMemberName(key2, fullExp);
        ensureSafeMemberName(key3, fullExp);
        ensureSafeMemberName(key4, fullExp);
        return !options.unwrapPromises ? function cspSafeGetter(scope, locals) {
            var pathVal = locals && locals.hasOwnProperty(key0) ? locals : scope;
            if (pathVal == null) return pathVal;
            pathVal = pathVal[key0];
            if (!key1) return pathVal;
            if (pathVal == null) return undefined;
            pathVal = pathVal[key1];
            if (!key2) return pathVal;
            if (pathVal == null) return undefined;
            pathVal = pathVal[key2];
            if (!key3) return pathVal;
            if (pathVal == null) return undefined;
            pathVal = pathVal[key3];
            if (!key4) return pathVal;
            if (pathVal == null) return undefined;
            pathVal = pathVal[key4];
            return pathVal;
        } : function cspSafePromiseEnabledGetter(scope, locals) {
            var pathVal = locals && locals.hasOwnProperty(key0) ? locals : scope, promise;
            if (pathVal == null) return pathVal;
            pathVal = pathVal[key0];
            if (pathVal && pathVal.then) {
                promiseWarning(fullExp);
                if (!("$$v" in pathVal)) {
                    promise = pathVal;
                    promise.$$v = undefined;
                    promise.then(function(val) {
                        promise.$$v = val;
                    });
                }
                pathVal = pathVal.$$v;
            }
            if (!key1) return pathVal;
            if (pathVal == null) return undefined;
            pathVal = pathVal[key1];
            if (pathVal && pathVal.then) {
                promiseWarning(fullExp);
                if (!("$$v" in pathVal)) {
                    promise = pathVal;
                    promise.$$v = undefined;
                    promise.then(function(val) {
                        promise.$$v = val;
                    });
                }
                pathVal = pathVal.$$v;
            }
            if (!key2) return pathVal;
            if (pathVal == null) return undefined;
            pathVal = pathVal[key2];
            if (pathVal && pathVal.then) {
                promiseWarning(fullExp);
                if (!("$$v" in pathVal)) {
                    promise = pathVal;
                    promise.$$v = undefined;
                    promise.then(function(val) {
                        promise.$$v = val;
                    });
                }
                pathVal = pathVal.$$v;
            }
            if (!key3) return pathVal;
            if (pathVal == null) return undefined;
            pathVal = pathVal[key3];
            if (pathVal && pathVal.then) {
                promiseWarning(fullExp);
                if (!("$$v" in pathVal)) {
                    promise = pathVal;
                    promise.$$v = undefined;
                    promise.then(function(val) {
                        promise.$$v = val;
                    });
                }
                pathVal = pathVal.$$v;
            }
            if (!key4) return pathVal;
            if (pathVal == null) return undefined;
            pathVal = pathVal[key4];
            if (pathVal && pathVal.then) {
                promiseWarning(fullExp);
                if (!("$$v" in pathVal)) {
                    promise = pathVal;
                    promise.$$v = undefined;
                    promise.then(function(val) {
                        promise.$$v = val;
                    });
                }
                pathVal = pathVal.$$v;
            }
            return pathVal;
        };
    }
    function simpleGetterFn1(key0, fullExp) {
        ensureSafeMemberName(key0, fullExp);
        return function simpleGetterFn1(scope, locals) {
            if (scope == null) return undefined;
            return (locals && locals.hasOwnProperty(key0) ? locals : scope)[key0];
        };
    }
    function simpleGetterFn2(key0, key1, fullExp) {
        ensureSafeMemberName(key0, fullExp);
        ensureSafeMemberName(key1, fullExp);
        return function simpleGetterFn2(scope, locals) {
            if (scope == null) return undefined;
            scope = (locals && locals.hasOwnProperty(key0) ? locals : scope)[key0];
            return scope == null ? undefined : scope[key1];
        };
    }
    function getterFn(path, options, fullExp) {
        if (getterFnCache.hasOwnProperty(path)) {
            return getterFnCache[path];
        }
        var pathKeys = path.split("."), pathKeysLength = pathKeys.length, fn;
        if (!options.unwrapPromises && pathKeysLength === 1) {
            fn = simpleGetterFn1(pathKeys[0], fullExp);
        } else if (!options.unwrapPromises && pathKeysLength === 2) {
            fn = simpleGetterFn2(pathKeys[0], pathKeys[1], fullExp);
        } else if (options.csp) {
            if (pathKeysLength < 6) {
                fn = cspSafeGetterFn(pathKeys[0], pathKeys[1], pathKeys[2], pathKeys[3], pathKeys[4], fullExp, options);
            } else {
                fn = function(scope, locals) {
                    var i = 0, val;
                    do {
                        val = cspSafeGetterFn(pathKeys[i++], pathKeys[i++], pathKeys[i++], pathKeys[i++], pathKeys[i++], fullExp, options)(scope, locals);
                        locals = undefined;
                        scope = val;
                    } while (i < pathKeysLength);
                    return val;
                };
            }
        } else {
            var code = "var p;\n";
            forEach(pathKeys, function(key, index) {
                ensureSafeMemberName(key, fullExp);
                code += "if(s == null) return undefined;\n" + "s=" + (index ? "s" : '((k&&k.hasOwnProperty("' + key + '"))?k:s)') + '["' + key + '"]' + ";\n" + (options.unwrapPromises ? "if (s && s.then) {\n" + ' pw("' + fullExp.replace(/(["\r\n])/g, "\\$1") + '");\n' + ' if (!("$$v" in s)) {\n' + " p=s;\n" + " p.$$v = undefined;\n" + " p.then(function(v) {p.$$v=v;});\n" + "}\n" + " s=s.$$v\n" + "}\n" : "");
            });
            code += "return s;";
            var evaledFnGetter = new Function("s", "k", "pw", code);
            evaledFnGetter.toString = valueFn(code);
            fn = options.unwrapPromises ? function(scope, locals) {
                return evaledFnGetter(scope, locals, promiseWarning);
            } : evaledFnGetter;
        }
        if (path !== "hasOwnProperty") {
            getterFnCache[path] = fn;
        }
        return fn;
    }
    "use strict";
    var OPERATORS = {
        "null": function() {
            return null;
        },
        "true": function() {
            return true;
        },
        "false": function() {
            return false;
        },
        undefined: noop,
        "+": function(self, locals, a, b) {
            a = a(self, locals);
            b = b(self, locals);
            if (isDefined(a)) {
                if (isDefined(b)) {
                    return a + b;
                }
                return a;
            }
            return isDefined(b) ? b : undefined;
        },
        "-": function(self, locals, a, b) {
            a = a(self, locals);
            b = b(self, locals);
            return (isDefined(a) ? a : 0) - (isDefined(b) ? b : 0);
        },
        "*": function(self, locals, a, b) {
            return a(self, locals) * b(self, locals);
        },
        "/": function(self, locals, a, b) {
            return a(self, locals) / b(self, locals);
        },
        "%": function(self, locals, a, b) {
            return a(self, locals) % b(self, locals);
        },
        "^": function(self, locals, a, b) {
            return a(self, locals) ^ b(self, locals);
        },
        "=": noop,
        "===": function(self, locals, a, b) {
            return a(self, locals) === b(self, locals);
        },
        "!==": function(self, locals, a, b) {
            return a(self, locals) !== b(self, locals);
        },
        "==": function(self, locals, a, b) {
            return a(self, locals) == b(self, locals);
        },
        "!=": function(self, locals, a, b) {
            return a(self, locals) != b(self, locals);
        },
        "<": function(self, locals, a, b) {
            return a(self, locals) < b(self, locals);
        },
        ">": function(self, locals, a, b) {
            return a(self, locals) > b(self, locals);
        },
        "<=": function(self, locals, a, b) {
            return a(self, locals) <= b(self, locals);
        },
        ">=": function(self, locals, a, b) {
            return a(self, locals) >= b(self, locals);
        },
        "&&": function(self, locals, a, b) {
            return a(self, locals) && b(self, locals);
        },
        "||": function(self, locals, a, b) {
            return a(self, locals) || b(self, locals);
        },
        "&": function(self, locals, a, b) {
            return a(self, locals) & b(self, locals);
        },
        "|": function(self, locals, a, b) {
            return b(self, locals)(self, locals, a(self, locals));
        },
        "!": function(self, locals, a) {
            return !a(self, locals);
        }
    };
    function ensureSafeMemberName(name, fullExpression) {
        if (name === "constructor") {
            throw $parseMinErr("isecfld", 'Referencing "constructor" field in Angular expressions is disallowed! Expression: {0}', fullExpression);
        }
        return name;
    }
    function ensureSafeObject(obj, fullExpression) {
        if (obj) {
            if (obj.constructor === obj) {
                throw $parseMinErr("isecfn", "Referencing Function in Angular expressions is disallowed! Expression: {0}", fullExpression);
            } else if (obj.document && obj.location && obj.alert && obj.setInterval) {
                throw $parseMinErr("isecwindow", "Referencing the Window in Angular expressions is disallowed! Expression: {0}", fullExpression);
            } else if (obj.children && (obj.nodeName || obj.prop && obj.attr && obj.find)) {
                throw $parseMinErr("isecdom", "Referencing DOM nodes in Angular expressions is disallowed! Expression: {0}", fullExpression);
            }
        }
        return obj;
    }
    var ESCAPE = {
        n: "\n",
        f: "\f",
        r: "\r",
        t: "	",
        v: "",
        "'": "'",
        '"': '"'
    };
    function valueFn(value) {
        return function() {
            return value;
        };
    }
    var promiseWarning = function promiseWarningFn(fullExp) {
        if (!$parseOptions.logPromiseWarnings || promiseWarningCache.hasOwnProperty(fullExp)) return;
        promiseWarningCache[fullExp] = true;
        $log.warn("[$parse] Promise found in the expression `" + fullExp + "`. " + "Automatic unwrapping of promises in Angular expressions is deprecated.");
    };
    function noop() {}
    function isDefined(value) {
        return typeof value !== "undefined";
    }
    function toJsonReplacer(key, value) {
        var val = value;
        if (typeof key === "string" && key.charAt(0) === "$") {
            val = undefined;
        } else if (isWindow(value)) {
            val = "$WINDOW";
        } else if (value && document === value) {
            val = "$DOCUMENT";
        } else if (isScope(value)) {
            val = "$SCOPE";
        }
        return val;
    }
    function isWindow(obj) {
        return obj && obj.document && obj.location && obj.alert && obj.setInterval;
    }
    function isScope(obj) {
        return obj && obj.$evalAsync && obj.$watch;
    }
    function toJson(obj, pretty) {
        if (typeof obj === "undefined") return undefined;
        return JSON.stringify(obj, toJsonReplacer, pretty ? "  " : null);
    }
    var $parseMinErr = minErr("$parse");
    function minErr(module) {
        return function() {
            var code = arguments[0], prefix = "[" + (module ? module + ":" : "") + code + "] ", template = arguments[1], templateArgs = arguments, stringify = function(obj) {
                if (typeof obj === "function") {
                    return obj.toString().replace(/ \{[\s\S]*$/, "");
                } else if (typeof obj === "undefined") {
                    return "undefined";
                } else if (typeof obj !== "string") {
                    return JSON.stringify(obj);
                }
                return obj;
            }, message, i;
            message = prefix + template.replace(/\{\d+\}/g, function(match) {
                var index = +match.slice(1, -1), arg;
                if (index + 2 < templateArgs.length) {
                    arg = templateArgs[index + 2];
                    if (typeof arg === "function") {
                        return arg.toString().replace(/ ?\{[\s\S]*$/, "");
                    } else if (typeof arg === "undefined") {
                        return "undefined";
                    } else if (typeof arg !== "string") {
                        return toJson(arg);
                    }
                    return arg;
                }
                return match;
            });
            message = message + "\nhttp://errors.angularjs.org/1.3.0-beta.8/" + (module ? module + "/" : "") + code;
            for (i = 2; i < arguments.length; i++) {
                message = message + (i == 2 ? "?" : "&") + "p" + (i - 2) + "=" + encodeURIComponent(stringify(arguments[i]));
            }
            return new Error(message);
        };
    }
    var lowercase = function(string) {
        return isString(string) ? string.toLowerCase() : string;
    };
    function isString(value) {
        return typeof value === "string";
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
    function forEach(list, method, data) {
        var i = 0, len, result, extraArgs;
        if (arguments.length > 2) {
            extraArgs = toArray(arguments);
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
    function setHashKey(obj, h) {
        if (h) {
            obj.$$hashKey = h;
        } else {
            delete obj.$$hashKey;
        }
    }
    function extend(dst) {
        var h = dst.$$hashKey;
        forEach(arguments, function(obj) {
            if (obj !== dst) {
                forEach(obj, function(value, key) {
                    dst[key] = value;
                });
            }
        });
        setHashKey(dst, h);
        return dst;
    }
    var Lexer = function(options) {
        this.options = options;
    };
    Lexer.prototype = {
        constructor: Lexer,
        lex: function(text) {
            this.text = text;
            this.index = 0;
            this.ch = undefined;
            this.lastCh = ":";
            this.tokens = [];
            var token;
            var json = [];
            while (this.index < this.text.length) {
                this.ch = this.text.charAt(this.index);
                if (this.is("\"'")) {
                    this.readString(this.ch);
                } else if (this.isNumber(this.ch) || this.is(".") && this.isNumber(this.peek())) {
                    this.readNumber();
                } else if (this.isIdent(this.ch)) {
                    this.readIdent();
                    if (this.was("{,") && json[0] === "{" && (token = this.tokens[this.tokens.length - 1])) {
                        token.json = token.text.indexOf(".") === -1;
                    }
                } else if (this.is("(){}[].,;:?")) {
                    this.tokens.push({
                        index: this.index,
                        text: this.ch,
                        json: this.was(":[,") && this.is("{[") || this.is("}]:,")
                    });
                    if (this.is("{[")) json.unshift(this.ch);
                    if (this.is("}]")) json.shift();
                    this.index++;
                } else if (this.isWhitespace(this.ch)) {
                    this.index++;
                    continue;
                } else {
                    var ch2 = this.ch + this.peek();
                    var ch3 = ch2 + this.peek(2);
                    var fn = OPERATORS[this.ch];
                    var fn2 = OPERATORS[ch2];
                    var fn3 = OPERATORS[ch3];
                    if (fn3) {
                        this.tokens.push({
                            index: this.index,
                            text: ch3,
                            fn: fn3
                        });
                        this.index += 3;
                    } else if (fn2) {
                        this.tokens.push({
                            index: this.index,
                            text: ch2,
                            fn: fn2
                        });
                        this.index += 2;
                    } else if (fn) {
                        this.tokens.push({
                            index: this.index,
                            text: this.ch,
                            fn: fn,
                            json: this.was("[,:") && this.is("+-")
                        });
                        this.index += 1;
                    } else {
                        this.throwError("Unexpected next character ", this.index, this.index + 1);
                    }
                }
                this.lastCh = this.ch;
            }
            return this.tokens;
        },
        is: function(chars) {
            return chars.indexOf(this.ch) !== -1;
        },
        was: function(chars) {
            return chars.indexOf(this.lastCh) !== -1;
        },
        peek: function(i) {
            var num = i || 1;
            return this.index + num < this.text.length ? this.text.charAt(this.index + num) : false;
        },
        isNumber: function(ch) {
            return "0" <= ch && ch <= "9";
        },
        isWhitespace: function(ch) {
            return ch === " " || ch === "\r" || ch === "	" || ch === "\n" || ch === "" || ch === " ";
        },
        isIdent: function(ch) {
            return "a" <= ch && ch <= "z" || "A" <= ch && ch <= "Z" || "_" === ch || ch === "$";
        },
        isExpOperator: function(ch) {
            return ch === "-" || ch === "+" || this.isNumber(ch);
        },
        throwError: function(error, start, end) {
            end = end || this.index;
            var colStr = isDefined(start) ? "s " + start + "-" + this.index + " [" + this.text.substring(start, end) + "]" : " " + end;
            throw $parseMinErr("lexerr", "Lexer Error: {0} at column{1} in expression [{2}].", error, colStr, this.text);
        },
        readNumber: function() {
            var number = "";
            var start = this.index;
            while (this.index < this.text.length) {
                var ch = lowercase(this.text.charAt(this.index));
                if (ch == "." || this.isNumber(ch)) {
                    number += ch;
                } else {
                    var peekCh = this.peek();
                    if (ch == "e" && this.isExpOperator(peekCh)) {
                        number += ch;
                    } else if (this.isExpOperator(ch) && peekCh && this.isNumber(peekCh) && number.charAt(number.length - 1) == "e") {
                        number += ch;
                    } else if (this.isExpOperator(ch) && (!peekCh || !this.isNumber(peekCh)) && number.charAt(number.length - 1) == "e") {
                        this.throwError("Invalid exponent");
                    } else {
                        break;
                    }
                }
                this.index++;
            }
            number = 1 * number;
            this.tokens.push({
                index: start,
                text: number,
                json: true,
                fn: function() {
                    return number;
                }
            });
        },
        readIdent: function() {
            var parser = this;
            var ident = "";
            var start = this.index;
            var lastDot, peekIndex, methodName, ch;
            while (this.index < this.text.length) {
                ch = this.text.charAt(this.index);
                if (ch === "." || this.isIdent(ch) || this.isNumber(ch)) {
                    if (ch === ".") lastDot = this.index;
                    ident += ch;
                } else {
                    break;
                }
                this.index++;
            }
            if (lastDot) {
                peekIndex = this.index;
                while (peekIndex < this.text.length) {
                    ch = this.text.charAt(peekIndex);
                    if (ch === "(") {
                        methodName = ident.substr(lastDot - start + 1);
                        ident = ident.substr(0, lastDot - start);
                        this.index = peekIndex;
                        break;
                    }
                    if (this.isWhitespace(ch)) {
                        peekIndex++;
                    } else {
                        break;
                    }
                }
            }
            var token = {
                index: start,
                text: ident
            };
            if (OPERATORS.hasOwnProperty(ident)) {
                token.fn = OPERATORS[ident];
                token.json = OPERATORS[ident];
            } else {
                var getter = getterFn(ident, this.options, this.text);
                token.fn = extend(function(self, locals) {
                    return getter(self, locals);
                }, {
                    assign: function(self, value) {
                        return setter(self, ident, value, parser.text, parser.options);
                    }
                });
            }
            this.tokens.push(token);
            if (methodName) {
                this.tokens.push({
                    index: lastDot,
                    text: ".",
                    json: false
                });
                this.tokens.push({
                    index: lastDot + 1,
                    text: methodName,
                    json: false
                });
            }
        },
        readString: function(quote) {
            var start = this.index;
            this.index++;
            var string = "";
            var rawString = quote;
            var escape = false;
            while (this.index < this.text.length) {
                var ch = this.text.charAt(this.index);
                rawString += ch;
                if (escape) {
                    if (ch === "u") {
                        var hex = this.text.substring(this.index + 1, this.index + 5);
                        if (!hex.match(/[\da-f]{4}/i)) this.throwError("Invalid unicode escape [\\u" + hex + "]");
                        this.index += 4;
                        string += String.fromCharCode(parseInt(hex, 16));
                    } else {
                        var rep = ESCAPE[ch];
                        if (rep) {
                            string += rep;
                        } else {
                            string += ch;
                        }
                    }
                    escape = false;
                } else if (ch === "\\") {
                    escape = true;
                } else if (ch === quote) {
                    this.index++;
                    this.tokens.push({
                        index: start,
                        text: rawString,
                        string: string,
                        json: true,
                        fn: function() {
                            return string;
                        }
                    });
                    return;
                } else {
                    string += ch;
                }
                this.index++;
            }
            this.throwError("Unterminated quote", start);
        }
    };
    var Parser = function(lexer, $filter, options) {
        this.lexer = lexer;
        this.$filter = $filter;
        this.options = options;
    };
    Parser.ZERO = extend(function() {
        return 0;
    }, {
        constant: true
    });
    Parser.prototype = {
        constructor: Parser,
        parse: function(text, json) {
            this.text = text;
            this.json = json;
            this.tokens = this.lexer.lex(text);
            if (json) {
                this.assignment = this.logicalOR;
                this.functionCall = this.fieldAccess = this.objectIndex = this.filterChain = function() {
                    this.throwError("is not valid json", {
                        text: text,
                        index: 0
                    });
                };
            }
            var value = json ? this.primary() : this.statements();
            if (this.tokens.length !== 0) {
                this.throwError("is an unexpected token", this.tokens[0]);
            }
            value.literal = !!value.literal;
            value.constant = !!value.constant;
            return value;
        },
        primary: function() {
            var primary;
            if (this.expect("(")) {
                primary = this.filterChain();
                this.consume(")");
            } else if (this.expect("[")) {
                primary = this.arrayDeclaration();
            } else if (this.expect("{")) {
                primary = this.object();
            } else {
                var token = this.expect();
                primary = token.fn;
                if (!primary) {
                    this.throwError("not a primary expression", token);
                }
                if (token.json) {
                    primary.constant = true;
                    primary.literal = true;
                }
            }
            var next, context;
            while (next = this.expect("(", "[", ".")) {
                if (next.text === "(") {
                    primary = this.functionCall(primary, context);
                    context = null;
                } else if (next.text === "[") {
                    context = primary;
                    primary = this.objectIndex(primary);
                } else if (next.text === ".") {
                    context = primary;
                    primary = this.fieldAccess(primary);
                } else {
                    this.throwError("IMPOSSIBLE");
                }
            }
            return primary;
        },
        throwError: function(msg, token) {
            throw $parseMinErr("syntax", "Syntax Error: Token '{0}' {1} at column {2} of the expression [{3}] starting at [{4}].", token.text, msg, token.index + 1, this.text, this.text.substring(token.index));
        },
        peekToken: function() {
            if (this.tokens.length === 0) throw $parseMinErr("ueoe", "Unexpected end of expression: {0}", this.text);
            return this.tokens[0];
        },
        peek: function(e1, e2, e3, e4) {
            if (this.tokens.length > 0) {
                var token = this.tokens[0];
                var t = token.text;
                if (t === e1 || t === e2 || t === e3 || t === e4 || !e1 && !e2 && !e3 && !e4) {
                    return token;
                }
            }
            return false;
        },
        expect: function(e1, e2, e3, e4) {
            var token = this.peek(e1, e2, e3, e4);
            if (token) {
                if (this.json && !token.json) {
                    this.throwError("is not valid json", token);
                }
                this.tokens.shift();
                return token;
            }
            return false;
        },
        consume: function(e1) {
            if (!this.expect(e1)) {
                this.throwError("is unexpected, expecting [" + e1 + "]", this.peek());
            }
        },
        unaryFn: function(fn, right) {
            return extend(function(self, locals) {
                return fn(self, locals, right);
            }, {
                constant: right.constant
            });
        },
        ternaryFn: function(left, middle, right) {
            return extend(function(self, locals) {
                return left(self, locals) ? middle(self, locals) : right(self, locals);
            }, {
                constant: left.constant && middle.constant && right.constant
            });
        },
        binaryFn: function(left, fn, right) {
            return extend(function(self, locals) {
                return fn(self, locals, left, right);
            }, {
                constant: left.constant && right.constant
            });
        },
        statements: function() {
            var statements = [];
            while (true) {
                if (this.tokens.length > 0 && !this.peek("}", ")", ";", "]")) statements.push(this.filterChain());
                if (!this.expect(";")) {
                    return statements.length === 1 ? statements[0] : function(self, locals) {
                        var value;
                        for (var i = 0; i < statements.length; i++) {
                            var statement = statements[i];
                            if (statement) {
                                value = statement(self, locals);
                            }
                        }
                        return value;
                    };
                }
            }
        },
        filterChain: function() {
            var left = this.expression();
            var token;
            while (true) {
                if (token = this.expect("|")) {
                    left = this.binaryFn(left, token.fn, this.filter());
                } else {
                    return left;
                }
            }
        },
        filter: function() {
            var token = this.expect();
            var fn = this.$filter(token.text);
            var argsFn = [];
            while (true) {
                if (token = this.expect(":")) {
                    argsFn.push(this.expression());
                } else {
                    var fnInvoke = function(self, locals, input) {
                        var args = [ input ];
                        for (var i = 0; i < argsFn.length; i++) {
                            args.push(argsFn[i](self, locals));
                        }
                        return fn.apply(self, args);
                    };
                    return function() {
                        return fnInvoke;
                    };
                }
            }
        },
        expression: function() {
            return this.assignment();
        },
        assignment: function() {
            var left = this.ternary();
            var right;
            var token;
            if (token = this.expect("=")) {
                if (!left.assign) {
                    this.throwError("implies assignment but [" + this.text.substring(0, token.index) + "] can not be assigned to", token);
                }
                right = this.ternary();
                return function(scope, locals) {
                    return left.assign(scope, right(scope, locals), locals);
                };
            }
            return left;
        },
        ternary: function() {
            var left = this.logicalOR();
            var middle;
            var token;
            if (token = this.expect("?")) {
                middle = this.ternary();
                if (token = this.expect(":")) {
                    return this.ternaryFn(left, middle, this.ternary());
                } else {
                    this.throwError("expected :", token);
                }
            } else {
                return left;
            }
        },
        logicalOR: function() {
            var left = this.logicalAND();
            var token;
            while (true) {
                if (token = this.expect("||")) {
                    left = this.binaryFn(left, token.fn, this.logicalAND());
                } else {
                    return left;
                }
            }
        },
        logicalAND: function() {
            var left = this.equality();
            var token;
            if (token = this.expect("&&")) {
                left = this.binaryFn(left, token.fn, this.logicalAND());
            }
            return left;
        },
        equality: function() {
            var left = this.relational();
            var token;
            if (token = this.expect("==", "!=", "===", "!==")) {
                left = this.binaryFn(left, token.fn, this.equality());
            }
            return left;
        },
        relational: function() {
            var left = this.additive();
            var token;
            if (token = this.expect("<", ">", "<=", ">=")) {
                left = this.binaryFn(left, token.fn, this.relational());
            }
            return left;
        },
        additive: function() {
            var left = this.multiplicative();
            var token;
            while (token = this.expect("+", "-")) {
                left = this.binaryFn(left, token.fn, this.multiplicative());
            }
            return left;
        },
        multiplicative: function() {
            var left = this.unary();
            var token;
            while (token = this.expect("*", "/", "%")) {
                left = this.binaryFn(left, token.fn, this.unary());
            }
            return left;
        },
        unary: function() {
            var token;
            if (this.expect("+")) {
                return this.primary();
            } else if (token = this.expect("-")) {
                return this.binaryFn(Parser.ZERO, token.fn, this.unary());
            } else if (token = this.expect("!")) {
                return this.unaryFn(token.fn, this.unary());
            } else {
                return this.primary();
            }
        },
        fieldAccess: function(object) {
            var parser = this;
            var field = this.expect().text;
            var getter = getterFn(field, this.options, this.text);
            return extend(function(scope, locals, self) {
                return getter(self || object(scope, locals));
            }, {
                assign: function(scope, value, locals) {
                    return setter(object(scope, locals), field, value, parser.text, parser.options);
                }
            });
        },
        objectIndex: function(obj) {
            var parser = this;
            var indexFn = this.expression();
            this.consume("]");
            return extend(function(self, locals) {
                var o = obj(self, locals), i = indexFn(self, locals), v, p;
                if (!o) return undefined;
                v = ensureSafeObject(o[i], parser.text);
                if (v && v.then && parser.options.unwrapPromises) {
                    p = v;
                    if (!("$$v" in v)) {
                        p.$$v = undefined;
                        p.then(function(val) {
                            p.$$v = val;
                        });
                    }
                    v = v.$$v;
                }
                return v;
            }, {
                assign: function(self, value, locals) {
                    var key = indexFn(self, locals);
                    var safe = ensureSafeObject(obj(self, locals), parser.text);
                    return safe[key] = value;
                }
            });
        },
        functionCall: function(fn, contextGetter) {
            var argsFn = [];
            if (this.peekToken().text !== ")") {
                do {
                    argsFn.push(this.expression());
                } while (this.expect(","));
            }
            this.consume(")");
            var parser = this;
            return function(scope, locals) {
                var args = [];
                var context = contextGetter ? contextGetter(scope, locals) : scope;
                for (var i = 0; i < argsFn.length; i++) {
                    args.push(argsFn[i](scope, locals));
                }
                var fnPtr = fn(scope, locals, context) || noop;
                ensureSafeObject(context, parser.text);
                ensureSafeObject(fnPtr, parser.text);
                var v = fnPtr.apply ? fnPtr.apply(context, args) : fnPtr(args[0], args[1], args[2], args[3], args[4]);
                return ensureSafeObject(v, parser.text);
            };
        },
        arrayDeclaration: function() {
            var elementFns = [];
            var allConstant = true;
            if (this.peekToken().text !== "]") {
                do {
                    if (this.peek("]")) {
                        break;
                    }
                    var elementFn = this.expression();
                    elementFns.push(elementFn);
                    if (!elementFn.constant) {
                        allConstant = false;
                    }
                } while (this.expect(","));
            }
            this.consume("]");
            return extend(function(self, locals) {
                var array = [];
                for (var i = 0; i < elementFns.length; i++) {
                    array.push(elementFns[i](self, locals));
                }
                return array;
            }, {
                literal: true,
                constant: allConstant
            });
        },
        object: function() {
            var keyValues = [];
            var allConstant = true;
            if (this.peekToken().text !== "}") {
                do {
                    if (this.peek("}")) {
                        break;
                    }
                    var token = this.expect(), key = token.string || token.text;
                    this.consume(":");
                    var value = this.expression();
                    keyValues.push({
                        key: key,
                        value: value
                    });
                    if (!value.constant) {
                        allConstant = false;
                    }
                } while (this.expect(","));
            }
            this.consume("}");
            return extend(function(self, locals) {
                var object = {};
                for (var i = 0; i < keyValues.length; i++) {
                    var keyValue = keyValues[i];
                    object[keyValue.key] = keyValue.value(self, locals);
                }
                return object;
            }, {
                literal: true,
                constant: allConstant
            });
        }
    };
    var ex = exports.parser = function() {
        var lexer = new Lexer({}), $filter = {}, parser = new Parser(lexer, $filter, {
            unwrapPromises: true
        });
        return parser;
    }();
})(this ? this.ux = this.ux || {} : exports, function() {
    return this;
}());

(function() {
    "use strict";
    var api = {
        extend: exports.extend,
        each: exports.each,
        isArray: _.isArray
    };
    function typeCast(val) {
        if (val === "true" || val === "false") {
            return val === "true";
        } else if (val !== "" && val && !isNaN(val)) {
            return parseFloat(val);
        }
        return val;
    }
    api.extend(api, {
        parse: function(str) {
            var result;
            str = this.closeOpenNodes(str);
            str = str.replace(/<(\w+)/g, '<steps type="$1"');
            str = str.replace(/<\/\w+/g, "</steps");
            result = this.xml2json(str);
            return result;
        },
        closeOpenNodes: function(str) {
            str = str.replace(/<(\w+)\/>/gim, "<$1></$1>");
            str = str.replace(/(<(\w+)[^>]+?)\/>/gim, "$1></$2>");
            return str;
        },
        xml2json: function(xml, extended) {
            if (!xml) {
                return {};
            }
            function parseXML(node, simple) {
                if (!node) {
                    return null;
                }
                var txt = "", obj = null, att = null, cnn;
                var nt = node.nodeType, nn = jsVar(node.localName || node.nodeName);
                var nv = node.text || node.nodeValue || "";
                if (node.childNodes) {
                    if (node.childNodes.length > 0) {
                        api.each(node.childNodes, function(cn, n) {
                            var cnt = cn.nodeType, cnn = jsVar(cn.localName || cn.nodeName);
                            var cnv = cn.text || cn.nodeValue || "";
                            if (cnt === 8) {
                                return;
                            } else if (cnt === 3 || cnt === 4 || !cnn) {
                                if (cnv.match(/^\s+$/)) {
                                    return;
                                }
                                txt += cnv.replace(/^\s+/, "").replace(/\s+$/, "");
                            } else {
                                obj = obj || {};
                                if (obj[cnn]) {
                                    if (!obj[cnn].length) {
                                        obj[cnn] = myArr(obj[cnn]);
                                    }
                                    obj[cnn] = myArr(obj[cnn]);
                                    obj[cnn][obj[cnn].length] = parseXML(cn, true);
                                    obj[cnn].length = obj[cnn].length;
                                } else {
                                    obj[cnn] = parseXML(cn);
                                }
                            }
                        });
                    }
                }
                if (txt) {
                    txt = typeCast(txt);
                }
                if (node.attributes) {
                    if (node.attributes.length > 0) {
                        att = {};
                        obj = obj || {};
                        api.each(node.attributes, function(at, a) {
                            var atn = jsVar(at.name), atv = at.value;
                            if (atn !== "xmlns") {
                                att[atn] = atv;
                                if (obj[atn]) {
                                    obj[cnn] = myArr(obj[cnn]);
                                    obj[atn][obj[atn].length] = atv;
                                    obj[atn].length = obj[atn].length;
                                } else {
                                    obj[atn] = typeCast(atv);
                                }
                            }
                        });
                    }
                }
                if (obj) {
                    if (txt === "") {
                        obj = api.extend({}, obj || {});
                    }
                    if (obj.text) {
                        if (typeof obj.text === "object") {
                            txt = obj.text;
                        } else {
                            txt = obj.txt || txt || "";
                        }
                    } else {
                        txt = txt;
                    }
                    if (txt !== undefined && txt !== "") {
                        obj.text = txt;
                    }
                    txt = "";
                }
                var out = obj || txt;
                if (extended) {
                    if (txt) {
                        out = {};
                    }
                    txt = out.text || txt || "";
                    if (txt) {
                        out.text = txt;
                    }
                    if (!simple) {
                        out = myArr(out);
                    }
                }
                return out;
            }
            var jsVar = function(s) {
                return String(s || "").replace(/-/g, "_");
            };
            function isNum(s) {
                var regexp = /^((-)?([0-9]+)(([\.\,]{0,1})([0-9]+))?$)/;
                return typeof s === "number" || regexp.test(String(s && typeof s === "string" ? s.trim() : ""));
            }
            var myArr = function(o) {
                if (!api.isArray(o)) {
                    o = [ o ];
                }
                o.length = o.length;
                return o;
            };
            if (typeof xml === "string") {
                xml = api.text2xml(xml);
            }
            if (!xml.nodeType) {
                return;
            }
            if (xml.nodeType === 3 || xml.nodeType === 4) {
                return xml.nodeValue;
            }
            var root = xml.nodeType === 9 ? xml.documentElement : xml;
            var out = parseXML(root, true);
            xml = null;
            root = null;
            return out;
        },
        text2xml: function(str) {
            var out, xml;
            try {
                xml = DOMParser ? new DOMParser() : new ActiveXObject("Microsoft.XMLDOM");
                xml.async = false;
            } catch (e) {
                throw new Error("XML Parser could not be instantiated");
            }
            try {
                if (!DOMParser) {
                    out = xml.loadXML(str) ? xml : false;
                } else {
                    out = xml.parseFromString(str, "text/xml");
                }
            } catch (e) {
                throw new Error("Error parsing XML string");
            }
            return out;
        }
    });
    ex.parse = api;
})();
}(this.go = this.go || {}, function() {return this;}()));
