/*
* goRunner v.0.0.1
* (c) 2014, Obogo
* License: Obogo 2014. All Rights Reserved.
*/
(function(exports, global){
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
}, events = ex.events, defaults = {
    root: {},
    step: {
        label: "",
        type: "step",
        status: statuses.UNRESOLVED,
        state: states.WAITING,
        childIndex: -1,
        skipCount: 0,
        startTime: 0,
        endTime: 0,
        time: 0,
        increment: 50,
        expectedTime: 100,
        maxTime: 2e3,
        progress: 0,
        data: undefined,
        payload: undefined
    },
    "var": {
        maxTime: 200
    },
    assert: {
        maxTime: 1e3
    },
    expect: {
        maxTime: 1e3
    },
    find: {
        maxTime: 1e4
    },
    findVal: {
        maxTime: 1e3
    },
    findText: {
        maxTime: 1e3
    },
    "if": {
        increment: 10,
        expectedTime: 50,
        maxTime: 500
    },
    elseif: {
        increment: 10,
        expectedTime: 50,
        maxTime: 500
    },
    "else": {
        increment: 10,
        expectedTime: 50,
        maxTime: 500
    },
    ajax: {
        expectedTime: 600,
        maxTime: 6e4
    },
    path: {
        expectedTime: 1e3,
        maxTime: 1e4
    },
    page: {
        expectedTime: 2e3,
        maxTime: 3e4
    },
    socked: {
        expectedTime: 1e3,
        maxTime: 1e4
    }
};

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
    endTime: true
};

function importStep(options, index, list, parentPath) {
    console.log("	step %s", options.label);
    parentPath = parentPath || "";
    var uid = (parentPath ? parentPath + "." : "") + (index !== undefined ? index : "R"), i, iLen, children;
    var item = {};
    item.uid = uid;
    item.index = index;
    children = options.children;
    exports.extend(item, defaults[types.STEP], defaults[options.type] || {}, options);
    if (list) list[index] = item;
    if (children && children.length) {
        i = 0;
        iLen = item.children.length;
        item.children = [];
        while (i < iLen) {
            importStep(children[i], i, item.children, uid);
            i += 1;
        }
    } else {
        item.children = [];
    }
    if (!list) {
        return item;
    }
}

function exportStep(step, clearJIT) {
    return _exportSteps(step, null, null, null, clearJIT ? omitOnSave : justInTimeOnly);
}

function _exportSteps(step, index, list, outList, omits) {
    var out = {}, defaultProps, prop;
    defaultProps = defaults[step.type];
    for (prop in step) {
        if (omits[prop]) {} else if (prop === "children") {
            out[prop] = {
                length: step.children.length
            };
            exports.each(step.children, _exportSteps, out[prop], omits);
        } else if (step.hasOwnProperty(prop) && defaultProps[prop] !== step[prop]) {
            out[prop] = step[prop];
        }
    }
    if (outList) {
        outList[index] = out;
    } else {
        return out;
    }
}

function MethodAPI(dispatcher) {
    this.dispatcher = dispatcher;
}

MethodAPI.prototype[types.STEP] = function(step) {
    return statuses.PASS;
};

MethodAPI.prototype[types.ROOT] = MethodAPI.prototype[types.STEP];

MethodAPI.prototype[types.IF] = function(step) {
    return step.override || statuses.PASS;
};

MethodAPI.prototype[types.ELSEIF] = function(step) {
    return step.override || statuses.PASS;
};

MethodAPI.prototype[types.ELSE] = function(step) {
    return step.override || statuses.PASS;
};

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
    var selected, root, values = [], prop = "children", pendingProgressChanges, lastStep;
    function setData(rootStep) {
        selected = root = rootStep;
    }
    function setPath(path) {
        var step = root;
        exports.each(path, function(pathIndex) {
            csl.log(step, "%s.childIndex = %s", step.label, pathIndex);
            pathIndex = parseInt(pathIndex, 10);
            step.childIndex = pathIndex;
            step = step[prop][pathIndex];
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
        var len = selected.children.length;
        if (selected.status === statuses.SKIP || selected.childIndex >= len) {
            return false;
        }
        if (len && selected.childIndex + 1 < len) {
            select(selected.children[selected.childIndex + 1]);
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
        if (pathIndex !== undefined && step.children[pathIndex]) {
            step = step.children[pathIndex];
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
            exports.each(step.children, skipStep);
        }
        exports.each(step.children, _getAllProgress, changed);
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
            len = step.children.length;
            if (len && step.childIndex !== -1) {
                childProgress = 0;
                step.skipCount = 0;
                while (i <= step.childIndex && i < len) {
                    if (step.children[i].status != statuses.SKIP) {
                        childProgress += step.children[i].progress;
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
            var s = parent.children[j];
            if (s.type === types.IF || s.type === types.ELSEIF) {
                skipStep(s);
            } else {
                break;
            }
            j -= 1;
        }
    }
    function skipPostDependentCondition(parent) {
        var i = parent.childIndex + 1, iLen = parent.children.length;
        while (i < iLen) {
            var s = parent.children[i];
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
        var complete = 0, total = 0, time = 0, totalTime = 0, result, i = 0, iLen = step.children.length;
        while (i < iLen) {
            if (step.children.length) {
                result = getStepTime(step.children[i]);
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

function runner(api) {
    dispatcher(api);
    var rootPrefix = "R", methods = new MethodAPI(api), activePath = new Path(), options = {
        async: true
    }, intv, _steps, rootStep = importStep({
        uid: rootPrefix,
        label: types.ROOT,
        type: types.ROOT,
        children: [],
        index: -1,
        maxTime: 100
    }), differ = diffThrottle(api, rootStep, activePath, 1e3);
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
        change(events.RESET);
    }
    function applySteps(steps) {
        var mySteps = exports.each(steps.slice(), importStep, rootPrefix);
        rootStep.children = mySteps;
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
        change(events.UPDATE);
        go();
    }
    function next() {
        activePath.next();
        change();
    }
    function exec(activeStep) {
        activeStep.state = states.RUNNING;
        csl.log(activeStep, "run method %s", activeStep.type);
        activeStep.status = methods[activeStep.type](activeStep);
        updateTime(activeStep);
        if (activeStep.status === statuses.PASS) {
            activeStep.state = states.COMPLETE;
            activePath.skipBlock();
            csl.log(activeStep, "pass %s", activeStep.label);
            if (activeStep.type === types.ROOT) {
                api.stop();
                change(events.DONE);
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
    function change(evt) {
        differ.fire(evt);
    }
    api.types = types;
    api.start = start;
    api.stop = stop;
    api.resume = resume;
    api.reset = reset;
    api.getSteps = getSteps;
    api.setSteps = setSteps;
    api.getRoot = function() {
        return exportStep(rootStep);
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
}(this.go = this.go || {}, function() {return this;}()));
