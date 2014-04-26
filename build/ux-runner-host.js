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

var config = {
    host: {
        css: "http://webux.lh/ux-runner2/app/host/host.css"
    },
    app: {
        url: "http://webux.lh/ux-runner2/app/guest/"
    },
    win: window,
    doc: window.document
};

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

ex.util = function() {
    var self, win = window;
    function RunnerUtil() {
        self = this;
        self.pending = false;
        self.files = [];
    }
    RunnerUtil.prototype.loadJSFile = function loadJSFile(src) {
        if (!self.pending) {
            if (win.document.readyState !== "complete") {
                win.addEventListener("readystate", function() {
                    loadFile(win, src);
                });
            } else {
                loadFile(win, src);
            }
        } else {
            self.files.push([ win, src ]);
        }
    };
    RunnerUtil.prototype.onFilesLoaded = function(fn) {
        self.callback = fn;
    };
    function loadFile(win, src) {
        ex.proxy.log("loading %s", src);
        self.pending = true;
        var se = win.document.createElement("script");
        se.type = "text/javascript";
        se.onload = function() {
            console.log("	loaded %s", src);
            self.pending = false;
            if (self.files.length) {
                loadFile.apply(self, self.files.shift());
            } else if (!self.files.length && self.callback) {
                self.callback();
            }
        };
        se.src = src;
        win.document.getElementsByTagName("body")[0].appendChild(se);
    }
    return new RunnerUtil();
}();

var ui, proxy = function() {
    function RunnerProxy() {
        this.$type = "proxy";
        this.$logStyle = "color:#CCC";
    }
    var rh = new RunnerProxy(), wp, pending = [], isHost, returns = [], intv, used = [], domain;
    function onMessage(e) {
        var data, request;
        if (e.origin == "http://" + domain) {
            data = e.data;
            if (data.hasOwnProperty("$args")) {
                request = {
                    $m: data.$m,
                    $return: exec(data)
                };
                rh.log("%s(%o) :: return: %o", request.$m, data.$args || "", request.$return);
                wp.post(request);
            } else {
                if (data.$m !== returns[0].$m) {
                    console.log("%cERROR:Returns out of sync", "color:#FF0000;font-weight:bold");
                }
                rh.log("	received from %s: %o", data.$m, data.$return);
                returns.shift().callback(data.$return);
            }
        } else {
            console.log("%cERROR: Unauthorized message attempt. %o", "color:#FF0000;font-weight:bold", e);
        }
        checkPending();
    }
    function onLoad(connectToUrl, frameId) {
        rh.log("onload");
        wp = new Porthole.WindowProxy(connectToUrl, frameId);
        wp.addEventListener(onMessage);
        checkPending();
    }
    rh.connect = function(connectToUrl, frameId) {
        rh.log("%s connecting to %s", config.win.location.href, connectToUrl);
        isHost = !!frameId;
        domain = connectToUrl.match(/\/\/([\w\d\-]+\.\w+)\/?/)[1];
        function whenLoad() {
            onLoad(connectToUrl, frameId);
        }
        if (document.readyState === "complete") {
            whenLoad();
        } else {
            config.win.addEventListener("load", whenLoad);
        }
    };
    rh.getProxyAPI = function(callback) {
        rh.$call("getProxyAPI", [], function(api) {
            for (var i in api) {
                if (api.hasOwnProperty(i)) {
                    rh[i] = createProxyMethod(i, api[i]);
                }
            }
            callback();
        });
    };
    function createProxyMethod(name, data) {
        return function() {
            var args = exports.util.array.toArray(arguments), len = args.length, callback;
            if (len && typeof args[len - 1] === "function") {
                callback = args.pop();
            }
            rh.$call(name, args, callback);
        };
    }
    function exec(data) {
        var parts, ref = this, method, part, result;
        used.length = 0;
        if (data.$m.indexOf(".") !== -1) {
            parts = data.$m.split(".");
            while (parts.length > 1 && ref[parts[0]]) {
                part = parts.shift();
                used.push(part);
                ref = ref[part];
            }
            if (parts.length === 1) {
                method = parts[0];
            }
        } else {
            method = data.$m;
            ref = ui;
        }
        if (ref[method] === undefined) {
            console.log("	%cERROR: %s%o has no method %s", "color:#FF0000;font-weight:bold", used.join("."), ref, method);
            return undefined;
        }
        result = ref[method].apply(ref, data.$args);
        if (result && (result.nodeType !== undefined || result.length && result[0].nodeType !== undefined)) {
            console.log("%cERROR: cannot return dom through proxy: %o", "color:#FF0000;font-weight:bold", result);
        }
        return result;
    }
    rh.$call = function(method, args, callback) {
        pending.push([ method, args, callback || function() {} ]);
        checkPending();
    };
    rh.log = function(msg) {
        if (config.win.console && config.win.console.log) {
            var args = exports.util.array.toArray(arguments), tabCount = 0, len = msg.length;
            if (rh.$logStyle) {
                while (tabCount < len && msg.charAt(tabCount) === "	") {
                    tabCount += 1;
                }
                msg = msg.substr(0, tabCount) + "%c%s:" + msg.substr(tabCount);
                args.splice(1, 0, rh.$logStyle, rh.$type);
                args[0] = msg;
            }
            console.log.apply(console, args);
        }
    };
    function applyCall(method, args, callback) {
        if (callback) {
            returns.push({
                $m: method,
                callback: callback
            });
        }
        wp.post({
            $m: method,
            $args: args || []
        });
    }
    function checkPending() {
        rh.log("	checkPending() wp:%s", wp);
        clearTimeout(intv);
        if (wp && !returns.length && pending.length) {
            applyCall.apply(rh, pending.shift());
            return;
        }
        if (pending.length) {
            intv = setTimeout(checkPending, 0);
        }
    }
    return rh;
}();

ui = function() {
    var options = {
        async: true,
        interval: 100,
        chainInterval: 10,
        defaultTimeout: 1e3,
        frame: {
            top: 0,
            left: 0,
            width: "100%",
            height: "100%"
        },
        timeouts: {
            mini: 100,
            "short": 1e3,
            medium: 1e4,
            "long": 3e4,
            forever: 6e4
        }
    };
    function HostProxy() {}
    HostProxy.prototype.getOptions = function() {
        return options;
    };
    HostProxy.prototype.getScenarios = function() {
        return ux.runner.describeScenarios();
    };
    return new HostProxy();
}();

proxy.$type = "host";

proxy.$logStyle = "color:#F90";

ex.proxy = proxy;

function loadCss(url) {
    var link = config.doc.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = url;
    config.doc.getElementsByTagName("head")[0].appendChild(link);
}

function createFrame(url) {
    var div = config.doc.createElement("div");
    div.className = "runner-frame";
    var handle = config.doc.createElement("div");
    handle.className = "runner-handle";
    handle.addEventListener("click", function() {
        if (div.className.indexOf("runner-open") === -1) {
            div.classList.add("runner-open");
        } else {
            div.classList.remove("runner-open");
        }
    });
    div.appendChild(handle);
    var iframe = config.doc.createElement("IFRAME");
    iframe.setAttribute("id", "runner-iframe");
    iframe.onload = function() {
        proxy.connect(config.app.url, "runner-iframe");
        proxy.getProxyAPI(function() {
            proxy.getFiles(function(files) {
                var i = 0, iLen = files.length;
                while (i < iLen) {
                    ex.util.loadJSFile(files[i]);
                    i += 1;
                }
                ex.util.onFilesLoaded(function() {
                    ux.runner.on(ux.runner.events.START, function() {
                        div.classList.add("runner-running");
                    });
                    ux.runner.on(ux.runner.events.DONE, function() {
                        div.classList.remove("runner-running");
                    });
                    ux.runner.recorder.on(ux.runner.events.START_RECORDING, function() {
                        div.classList.add("runner-recording");
                    });
                    ux.runner.recorder.on(ux.runner.events.STOP_RECORDING, function() {
                        div.classList.remove("runner-recording");
                    });
                    proxy.getOptions(function(options) {
                        proxy.log("		options: %o", options);
                        ex.config(options);
                        proxy.log("		ux %o", ux);
                    });
                    proxy.ready(ex.getScenarioNames(), function(scenarios) {
                        proxy.log("		scenarios: %o", scenarios);
                    });
                });
            });
        });
    };
    iframe.className = "runner-frame-iframe";
    iframe.src = url;
    iframe.width = "20px";
    iframe.height = "20px";
    div.appendChild(iframe);
    config.doc.body.appendChild(div);
}

window.addEventListener("load", function() {
    loadCss(config.host.css);
    createFrame(config.app.url);
}, false);
}(this.ux = this.ux || {}, function() {return this;}()));
