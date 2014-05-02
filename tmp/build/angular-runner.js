/*
* uxRunner v.0.0.0
* (c) 2014, WebUX
* License: MIT.
*/
(function(exports, global){
(function() {
    var initializing = false, fnTest = /xyz/.test(function() {
        xyz;
    }) ? /\b_super\b/ : /.*/;
    this.Class = function() {};
    Class.extend = function(prop) {
        var _super = this.prototype;
        initializing = true;
        var prototype = new this();
        initializing = false;
        for (var name in prop) {
            prototype[name] = typeof prop[name] == "function" && typeof _super[name] == "function" && fnTest.test(prop[name]) ? function(name, fn) {
                return function() {
                    var tmp = this._super;
                    this._super = _super[name];
                    var ret = fn.apply(this, arguments);
                    this._super = tmp;
                    return ret;
                };
            }(name, prop[name]) : prop[name];
        }
        function Class() {
            if (!initializing && this.init) this.init.apply(this, arguments);
        }
        Class.prototype = prototype;
        Class.prototype.constructor = Class;
        Class.extend = arguments.callee;
        return Class;
    };
})();

(function(window) {
    "use strict";
    var Porthole = {
        trace: function(s) {
            if (window["console"] !== undefined) {
                window.console.log("Porthole: " + s);
            }
        },
        error: function(s) {
            if (window["console"] !== undefined) {
                window.console.error("Porthole: " + s);
            }
        }
    };
    Porthole.WindowProxy = function() {};
    Porthole.WindowProxy.prototype = {
        post: function(data, targetOrigin) {},
        addEventListener: function(f) {},
        removeEventListener: function(f) {}
    };
    Porthole.WindowProxyBase = Class.extend({
        init: function(targetWindowName) {
            if (targetWindowName === undefined) {
                targetWindowName = "";
            }
            this.targetWindowName = targetWindowName;
            this.origin = window.location.protocol + "//" + window.location.host;
            this.eventListeners = [];
        },
        getTargetWindowName: function() {
            return this.targetWindowName;
        },
        getOrigin: function() {
            return this.origin;
        },
        getTargetWindow: function() {
            return Porthole.WindowProxy.getTargetWindow(this.targetWindowName);
        },
        post: function(data, targetOrigin) {
            if (targetOrigin === undefined) {
                targetOrigin = "*";
            }
            this.dispatchMessage({
                data: data,
                sourceOrigin: this.getOrigin(),
                targetOrigin: targetOrigin,
                sourceWindowName: window.name,
                targetWindowName: this.getTargetWindowName()
            });
        },
        addEventListener: function(f) {
            this.eventListeners.push(f);
            return f;
        },
        removeEventListener: function(f) {
            var index;
            index = this.eventListeners.indexOf(f);
            this.eventListeners.splice(index, 1);
        },
        dispatchEvent: function(event) {
            var i;
            for (i = 0; i < this.eventListeners.length; i++) {
                this.eventListeners[i](event);
            }
        }
    });
    Porthole.WindowProxyLegacy = Porthole.WindowProxyBase.extend({
        init: function(proxyIFrameUrl, targetWindowName) {
            this._super(targetWindowName);
            if (proxyIFrameUrl !== null) {
                this.proxyIFrameName = this.targetWindowName + "ProxyIFrame";
                this.proxyIFrameLocation = proxyIFrameUrl;
                this.proxyIFrameElement = this.createIFrameProxy();
            } else {
                this.proxyIFrameElement = null;
                throw new Error("proxyIFrameUrl can't be null");
            }
        },
        createIFrameProxy: function() {
            var iframe = document.createElement("iframe");
            iframe.setAttribute("id", this.proxyIFrameName);
            iframe.setAttribute("name", this.proxyIFrameName);
            iframe.setAttribute("src", this.proxyIFrameLocation);
            iframe.setAttribute("frameBorder", "1");
            iframe.setAttribute("scrolling", "auto");
            iframe.setAttribute("width", 30);
            iframe.setAttribute("height", 30);
            iframe.setAttribute("style", "position: absolute; left: -100px; top:0px;");
            if (iframe.style.setAttribute) {
                iframe.style.setAttribute("cssText", "position: absolute; left: -100px; top:0px;");
            }
            document.body.appendChild(iframe);
            return iframe;
        },
        dispatchMessage: function(message) {
            var encode = window.encodeURIComponent;
            if (this.proxyIFrameElement) {
                var src = this.proxyIFrameLocation + "#" + encode(Porthole.WindowProxy.serialize(message));
                this.proxyIFrameElement.setAttribute("src", src);
                this.proxyIFrameElement.height = this.proxyIFrameElement.height > 50 ? 50 : 100;
            }
        }
    });
    Porthole.WindowProxyHTML5 = Porthole.WindowProxyBase.extend({
        init: function(proxyIFrameUrl, targetWindowName) {
            this._super(targetWindowName);
            this.eventListenerCallback = null;
        },
        dispatchMessage: function(message) {
            this.getTargetWindow().postMessage(Porthole.WindowProxy.serialize(message), message.targetOrigin);
        },
        addEventListener: function(f) {
            if (this.eventListeners.length === 0) {
                var self = this;
                this.eventListenerCallback = function(event) {
                    self.eventListener(self, event);
                };
                window.addEventListener("message", this.eventListenerCallback, false);
            }
            return this._super(f);
        },
        removeEventListener: function(f) {
            this._super(f);
            if (this.eventListeners.length === 0) {
                window.removeEventListener("message", this.eventListenerCallback);
                this.eventListenerCallback = null;
            }
        },
        eventListener: function(self, nativeEvent) {
            var data = Porthole.WindowProxy.unserialize(nativeEvent.data);
            if (data && (self.targetWindowName == "" || data.sourceWindowName == self.targetWindowName)) {
                self.dispatchEvent(new Porthole.MessageEvent(data.data, nativeEvent.origin, self));
            }
        }
    });
    if (typeof window.postMessage !== "function") {
        Porthole.trace("Using legacy browser support");
        Porthole.WindowProxy = Porthole.WindowProxyLegacy.extend({});
    } else {
        Porthole.trace("Using built-in browser support");
        Porthole.WindowProxy = Porthole.WindowProxyHTML5.extend({});
    }
    Porthole.WindowProxy.serialize = function(obj) {
        if (typeof JSON === "undefined") {
            throw new Error("Porthole serialization depends on JSON!");
        }
        return JSON.stringify(obj);
    };
    Porthole.WindowProxy.unserialize = function(text) {
        if (typeof JSON === "undefined") {
            throw new Error("Porthole unserialization dependens on JSON!");
        }
        var json = JSON.parse(text);
        return json;
    };
    Porthole.WindowProxy.getTargetWindow = function(targetWindowName) {
        if (targetWindowName === "") {
            return top;
        } else if (targetWindowName === "top" || targetWindowName === "parent") {
            return window[targetWindowName];
        }
        return parent.frames[targetWindowName];
    };
    Porthole.MessageEvent = function MessageEvent(data, origin, source) {
        this.data = data;
        this.origin = origin;
        this.source = source;
    };
    Porthole.WindowProxyDispatcher = {
        forwardMessageEvent: function(e) {
            var message, decode = window.decodeURIComponent, targetWindow, windowProxy;
            if (document.location.hash.length > 0) {
                message = Porthole.WindowProxy.unserialize(decode(document.location.hash.substr(1)));
                targetWindow = Porthole.WindowProxy.getTargetWindow(message.targetWindowName);
                windowProxy = Porthole.WindowProxyDispatcher.findWindowProxyObjectInWindow(targetWindow, message.sourceWindowName);
                if (windowProxy) {
                    if (windowProxy.origin === message.targetOrigin || message.targetOrigin === "*") {
                        windowProxy.dispatchEvent(new Porthole.MessageEvent(message.data, message.sourceOrigin, windowProxy));
                    } else {
                        Porthole.error("Target origin " + windowProxy.origin + " does not match desired target of " + message.targetOrigin);
                    }
                } else {
                    Porthole.error("Could not find window proxy object on the target window");
                }
            }
        },
        findWindowProxyObjectInWindow: function(w, sourceWindowName) {
            var i;
            if (w.RuntimeObject) {
                w = w.RuntimeObject();
            }
            if (w) {
                for (i in w) {
                    if (w.hasOwnProperty(i)) {
                        if (w[i] !== null && typeof w[i] === "object" && w[i] instanceof w.Porthole.WindowProxy && w[i].getTargetWindowName() === sourceWindowName) {
                            return w[i];
                        }
                    }
                }
            }
            return null;
        },
        start: function() {
            if (window.addEventListener) {
                window.addEventListener("resize", Porthole.WindowProxyDispatcher.forwardMessageEvent, false);
            } else if (document.body.attachEvent) {
                window.attachEvent("onresize", Porthole.WindowProxyDispatcher.forwardMessageEvent);
            } else {
                Porthole.error("Cannot attach resize event");
            }
        }
    };
    if (typeof window.exports !== "undefined") {
        window.exports.Porthole = Porthole;
    } else {
        window.Porthole = Porthole;
    }
})(this);

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

ex.elementMethods.push(function(target) {
    target.scrollUp = function(amount) {
        return target.custom("scrollUp", function() {
            return target.element.scrollTop(target.element.scrollTop() - amount);
        });
    };
    target.scrollDown = function(amount) {
        return target.custom("scrollDown", function() {
            return target.element.scrollTop(target.element.scrollTop() + amount);
        });
    };
});

function Keyboard(el, lock) {
    this.el = el = ux.runner.locals.$(el);
    if (el.scope) {
        this.scope = el.scope();
    }
    var editableTypes = "text password number email url search tel";
    this.isEditable = /textarea|select/i.test(el[0].nodeName) || el[0].type && editableTypes.indexOf(el[0].type.toLowerCase()) > -1;
    if (this.isEditable) {
        this.selStart = el.getSelectionStart() || 0;
        this.selEnd = el.getSelectionEnd() || el.val().length;
        el.setSelection(this.selStart, this.selEnd);
        this.cursorPosition = this.selEnd;
    }
    this.capsLocked = false;
    if (lock) {
        this.lock();
    }
}

Keyboard.exec = function(el, actions, options) {
    var kbd = new Keyboard(el), acl = actions.match(/"[^"]+"|\w+/gim), action, val, i = 0, len = acl.length;
    kbd.lock();
    while (i < len) {
        val = acl[i];
        action = val.match(/[^"]+/gim)[0];
        if (action === "delete") {
            action = "del";
        }
        if (typeof kbd[action] === "function") {
            kbd[action]();
        } else {
            kbd.type(action);
        }
        kbd.release();
        i += 1;
    }
};

var proto = Keyboard.prototype;

proto.checkShiftKey = function(letter) {
    var alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+{}|:"<>?~;', testLetter = letter.toUpperCase();
    if (testLetter === letter) {
        return true;
    }
    return false;
};

proto.key = {
    backspace: 8,
    tab: 9,
    enter: 13,
    shift: 16,
    ctrl: 17,
    alt: 18,
    pause: 19,
    capslock: 20,
    esc: 27,
    space: 32,
    pageup: 33,
    pagedown: 34,
    end: 35,
    home: 36,
    left: 37,
    up: 38,
    right: 39,
    down: 40,
    insert: 45,
    "delete": 46,
    "0": 48,
    "1": 49,
    "2": 50,
    "3": 51,
    "4": 52,
    "5": 53,
    "6": 54,
    "7": 55,
    "8": 56,
    "9": 57,
    a: 65,
    b: 66,
    c: 67,
    d: 68,
    e: 69,
    f: 70,
    g: 71,
    h: 72,
    i: 73,
    j: 74,
    k: 75,
    l: 76,
    m: 77,
    n: 78,
    o: 79,
    p: 80,
    q: 81,
    r: 82,
    s: 83,
    t: 84,
    u: 85,
    v: 86,
    w: 87,
    x: 88,
    y: 89,
    z: 90,
    numpad0: 96,
    numpad1: 97,
    numpad2: 98,
    numpad3: 99,
    numpad4: 100,
    numpad5: 101,
    numpad6: 102,
    numpad7: 103,
    numpad8: 104,
    numpad9: 105,
    "*": 106,
    "+": 107,
    "-": 109,
    ".": 110,
    f1: 112,
    f2: 113,
    f3: 114,
    f4: 115,
    f5: 116,
    f6: 117,
    f7: 118,
    f8: 119,
    f9: 120,
    f10: 121,
    f11: 122,
    f12: 123,
    "=": 187,
    ",": 188,
    "/": 191,
    "\\": 220
};

proto.type = function(phrase, options) {
    var str, i, len;
    if (this.selStart !== this.selEnd) {
        str = this.el.val();
        str = str.substr(0, this.selStart) + str.substr(this.selEnd);
        this.el.val(str);
        this.selStart = this.selEnd = null;
    }
    phrase = phrase || "";
    i = 0;
    len = phrase.length;
    while (i < len) {
        this.punch(phrase.charAt(i), options);
        i += 1;
    }
    return this;
};

proto.punch = function(char, options) {
    var el = this.el, scope = this.scope, evt, keyCode, shiftKey, lchar = char.toLowerCase(), curPos, val, attr = this.attr("ng-model"), ngModel;
    options = options || {};
    if (this.attr("disabled") !== "disabled") {
        keyCode = this.key[lchar];
        shiftKey = this.checkShiftKey(char);
        evt = this.createEvent("keydown", {
            shiftKey: shiftKey,
            keyCode: keyCode
        });
        this.dispatchEvent(el[0], "keydown", evt);
        if (this.isEditable && char.length === 1) {
            curPos = this.cursorPosition;
            val = el.val();
            val = val.substr(0, curPos) + char + val.substr(curPos);
            if (attr && scope) {
                scope.$eval(attr + ' = "' + val + '"');
            }
            el.val(val);
            this.cursorPosition += 1;
        }
        evt = this.createEvent("keyup", {
            shiftKey: shiftKey,
            keyCode: keyCode
        });
        this.dispatchEvent(el[0], "keyup", evt);
        if (scope) {
            if (ngModel = el.data("$ngModelController")) {
                ngModel.$setViewValue(el.val());
            }
            this.dispatchEvent(el[0], "change", this.createEvent("change", {}));
            if (!scope.$$phase) {
                scope.$apply();
            }
        }
    }
    return this;
};

proto.attr = function(attr) {
    return this.el.attr(attr) || this.el.attr("data-" + attr);
};

proto.enter = function(options) {
    this.punch("enter", options);
    return this;
};

proto.left = function(options) {
    var el = this.el;
    if (this.isEditable) {
        this.cursorPosition -= 1;
    } else {
        this.punch("left", options);
    }
    return this;
};

proto.up = function(options) {
    this.punch("up", options);
    return this;
};

proto.right = function(options) {
    var el = this.el;
    if (this.isEditable) {
        this.cursorPosition += 1;
    } else {
        this.punch("right", options);
    }
    return this;
};

proto.down = function(options) {
    this.punch("down", options);
    return this;
};

proto.home = function(options) {
    var el = this.el;
    if (this.isEditable) {
        this.cursorPosition = 0;
    } else {
        this.punch("home", options);
    }
    return this;
};

proto.end = function(options) {
    var el = this.el;
    if (this.isEditable) {
        this.cursorPosition = el.val().length;
    } else {
        this.punch("home", options);
    }
    return this;
};

proto.pageUp = function(options) {
    this.punch("pageup", options);
    return this;
};

proto.pageDown = function(options) {
    this.punch("pagedown", options);
    return this;
};

proto.del = function(options) {
    if (this.isEditable) {
        var val = this.el.val(), curPos = this.cursorPosition;
        this.el.val(val.substr(0, curPos) + val.substr(curPos + 1));
    } else {
        this.punch("delete", options);
    }
    return this;
};

proto.tab = function(options) {
    this.punch("tab", options);
    return this;
};

proto.backspace = function(options) {
    if (this.isEditable) {
        var val = this.el.val(), curPos = this.cursorPosition;
        this.el.val(val.substr(0, curPos - 1) + val.substr(curPos));
        this.cursorPosition = curPos - 1;
    } else {
        this.punch("backspace", options);
    }
    return this;
};

proto.capsLock = function() {
    this.capsLocked = !this.capsLocked;
};

proto.lock = function() {
    var doc = ux.runner.locals.$(document);
    doc.bind("mousedown", this.killEvent);
    doc.bind("keydown", this.killEvent);
    doc.bind("focus", this.killEvent);
    doc.bind("blur", this.killEvent);
    return this;
};

proto.release = function() {
    var doc = ux.runner.locals.$(document);
    doc.unbind("mousedown", this.killEvent);
    doc.unbind("keydown", this.killEvent);
    doc.unbind("focus", this.killEvent);
    doc.unbind("blur", this.killEvent);
    return this;
};

proto.killEvent = function(evt) {
    evt.preventDefault();
    evt.stopImmediatePropagation();
};

proto.dispatchEvent = function(el, type, evt) {
    if (el.dispatchEvent) {
        el.dispatchEvent(evt);
    } else if (el.fireEvent) {
        el.fireEvent("on" + type, evt);
    }
    return evt;
};

proto.createEvent = function(type, options) {
    var evt, e;
    e = ux.runner.locals.$.extend({
        bubbles: true,
        cancelable: true,
        view: window,
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false,
        keyCode: 0,
        charCode: 0
    }, options);
    if (ux.runner.locals.$.isFunction(document.createEvent)) {
        if (type.indexOf("key") !== -1) {
            try {
                evt = document.createEvent("KeyEvents");
                evt.initKeyEvent(type, e.bubbles, e.cancelable, e.view, e.ctrlKey, e.altKey, e.shiftKey, e.metaKey, e.keyCode, e.charCode);
            } catch (err) {
                evt = document.createEvent("Events");
                evt.initEvent(type, e.bubbles, e.cancelable);
                ux.runner.locals.$.extend(evt, {
                    view: e.view,
                    ctrlKey: e.ctrlKey,
                    altKey: e.altKey,
                    shiftKey: e.shiftKey,
                    metaKey: e.metaKey,
                    keyCode: e.keyCode,
                    charCode: e.charCode
                });
            }
        } else {
            evt = document.createEvent("HTMLEvents");
            evt.initEvent(type, false, true);
        }
    } else if (document.createEventObject) {
        evt = document.createEventObject();
        ux.runner.locals.$.extend(evt, e);
    }
    if (ux.runner.locals.$.browser !== undefined && (ux.runner.locals.$.browser.msie || ux.runner.locals.$.browser.opera)) {
        evt.keyCode = e.charCode > 0 ? e.charCode : e.keyCode;
        evt.charCode = undefined;
    }
    return evt;
};

function sendKeys(str, assertValue) {
    var s = {
        label: "sendKeys " + str,
        method: function() {
            if (s.element.length) {
                Keyboard.exec(s.element, str);
            }
        },
        validate: function() {
            if (!s.element.length) {
                s.label = "sendKeys failed because there is no element selected.";
                return false;
            }
            if (assertValue) {
                var attr = "ng-model", attrVal = s.element.attr(attr) || s.element.attr("data-" + attr);
                if (attrVal) {
                    s.value = s.element.scope().$eval(attrVal);
                } else {
                    s.value = s.element.val();
                }
                return s.value + "" === assertValue + "";
            }
            return true;
        }
    };
    return s;
}

ex.elementMethods.push(function(target) {
    target.sendKeys = function(str, strToCompare) {
        var s = sendKeys.apply(null, arguments);
        ex.createElementStep(s, target);
        return s;
    };
});

ex.inPageMethods.push(function() {
    "use strict";
    var $fn = this.jQuery ? this.jQuery.fn : this.angular.element.prototype, $ = this.jQuery || this.angular.element;
    $fn.getCursorPosition = function() {
        if (this.length === 0) {
            return -1;
        }
        return $(this).getSelectionStart();
    };
    $fn.setCursorPosition = function(position) {
        if (this.length === 0) {
            return this;
        }
        return $(this).setSelection(position, position);
    };
    $fn.getSelection = function() {
        if (this.length === 0) {
            return -1;
        }
        var s = $(this).getSelectionStart(), e = $(this).getSelectionEnd();
        return this[0].value.substring(s, e);
    };
    $fn.getSelectionStart = function() {
        if (this.length === 0) {
            return -1;
        }
        var input = this[0];
        var pos = input.value.length, r;
        if (input.createTextRange) {
            r = ux.runner.locals.window.document.selection.createRange().duplicate();
            r.moveEnd("character", input.value.length);
            if (r.text === "") {
                pos = input.value.length;
            }
            pos = input.value.lastIndexOf(r.text);
        } else if (input.selectionStart !== undefined) {
            pos = input.selectionStart;
        }
        return pos;
    };
    $fn.getSelectionEnd = function() {
        if (this.length === 0) {
            return -1;
        }
        var input = this[0];
        var pos = input.value.length, r;
        if (input.createTextRange) {
            r = document.selection.createRange().duplicate();
            r.moveStart("character", -input.value.length);
            if (r.text === "") {
                pos = input.value.length;
            }
            pos = input.value.lastIndexOf(r.text);
        } else if (input.selectionEnd !== undefined) {
            pos = input.selectionEnd;
        }
        return pos;
    };
    $fn.setSelection = function(selectionStart, selectionEnd) {
        if (this.length === 0) {
            return this;
        }
        var input = this[0];
        if (input.createTextRange) {
            var range = input.createTextRange();
            range.collapse(true);
            range.moveEnd("character", selectionEnd);
            range.moveStart("character", selectionStart);
            range.select();
        } else if (input.setSelectionRange) {
            input.focus();
            input.setSelectionRange(selectionStart, selectionEnd);
        }
        return this;
    };
});

ex.elementMethods.push(function(target) {
    function anchorClick(anchorObj) {
        if (anchorObj.click) {
            anchorObj.click();
        } else if (document.createEvent) {
            var evt = document.createEvent("MouseEvents");
            evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            var allowDefault = anchorObj.dispatchEvent(evt);
        }
    }
    target.sendMouse = function(focus, namespace) {
        var step, s = ex.createElementStep({
            label: "sendMouse",
            method: function() {
                if (this.element[0].href && this.element[0].href.length) {
                    anchorClick(this.element[0]);
                }
                return s;
            }
        }, this);
        namespace = namespace ? "." + namespace : "";
        step = s.trigger("mousedown" + namespace);
        if (focus) {
            step = step.focus();
        }
        return step.trigger("mouseup" + namespace).trigger("click" + namespace);
    };
});

ex.elementMethods.push(function(target) {
    function anchorClick(anchorObj) {
        if (anchorObj.click) {
            anchorObj.click();
        } else if (document.createEvent) {
            var evt = document.createEvent("MouseEvents");
            evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            var allowDefault = anchorObj.dispatchEvent(evt);
        }
    }
    target.sendTap = function(focus, namespace) {
        var step, s = ex.createElementStep({
            label: "sendTap",
            method: function() {
                if (this.element[0].href && this.element[0].href.length) {
                    anchorClick(this.element[0]);
                }
                return s;
            }
        }, this);
        namespace = namespace ? "." + namespace : "";
        step = s.trigger("touchstart" + namespace);
        if (focus) {
            step = step.focus();
        }
        return step.trigger("touchend" + namespace).trigger("touchcancel" + namespace).trigger("click" + namespace);
    };
});

ex.elementMethods.push(function(target) {
    target.toBe = function(value) {
        var s = {
            label: "toBe " + value,
            value: undefined,
            timeout: ex.locals.options.interval,
            method: function() {},
            validate: function() {
                var result = $.trim(target.value) === value;
                if (!result) {
                    s.label = 'expected "' + target.value + '" to be "' + value + '"';
                } else {
                    s.label = 'toBe "' + value + '"';
                }
                return result;
            }
        };
        return ex.createElementStep(s, target);
    };
});

(function() {
    "use strict";
    try {
        angular.module("ux");
    } catch (e) {
        angular.module("ux", []);
    }
    angular.module("ux").run(function() {
        ex.getInjector = function() {
            if (ex.options.window) {
                return ex.options.window.angular.element(ex.options.rootElement).injector();
            }
            return angular.element(ex.options.window.document).injector();
        };
    }).factory("runner", function() {
        if (ux.runner.options.autoStart && typeof ux.runner.options.autoStart === "boolean") {
            ux.runner.run();
        }
        return ux.runner;
    });
})();
}(this.ux = this.ux || {}, function() {return this;}()));
