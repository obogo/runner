/*
* goRunner v.0.0.1
* (c) 2014, Obogo
* License: Obogo 2014. All Rights Reserved.
*/
(function(exports, global){
"use strict";
var ex = exports.runnerAdmin = exports.runnerAdmin || {};

var win = window, doc = win.document;

ex.events = {
    admin: {
        START: "runner:start",
        STOP: "runner:stop",
        UPDATE: "runner:update",
        RESET: "runner:reset",
        DONE: "runner:done",
        START_RECORDING: "runner:startRecording",
        STOP_RECORDING: "runner:stopRecording",
        LOAD_TEST: "runner:loadTest",
        REGISTER_SCENARIO: "runner:registerScenario"
    },
    runner: {
        ON_START: "runner:onStart",
        ON_STOP: "runner:onStop",
        ON_UPDATE: "runner:onUpdate",
        ON_RESET: "runner:onReset",
        ON_DONE: "runner:onDone",
        ON_START_RECORDING: "runner:onStartRecording",
        ON_STOP_RECORDING: "runner:onStopRecording",
        ON_LOAD_TEST: "runner:onLoadTest",
        ON_REGISTER_SCENARIO: "runner:onRegisterScenario"
    }
};

function extend(destination, source) {
    var args = exports.util.array.toArray(arguments), i = 1, len = args.length, item, j;
    var options = this || {};
    while (i < len) {
        item = args[i];
        for (j in item) {
            if (item.hasOwnProperty(j)) {
                if (destination[j] && typeof destination[j] === "object") {
                    destination[j] = extend.apply(options, [ destination[j], item[j] ]);
                } else if (item[j] instanceof Array) {
                    destination[j] = destination[j] || (options && options.arrayAsObject ? {
                        length: item[j].length
                    } : []);
                    if (item[j].length) {
                        destination[j] = extend.apply(options, [ destination[j], item[j] ]);
                    }
                } else if (item[j] && typeof item[j] === "object") {
                    destination[j] = extend.apply(options, [ destination[j] || {}, item[j] ]);
                } else {
                    destination[j] = item[j];
                }
            }
        }
        i += 1;
    }
    return destination;
}

exports.extend = extend;

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
    var forIn = function(collection, callback, thisArg) {
        var index, iterable = collection, result = iterable;
        if (!iterable) return result;
        if (!objectTypes[typeof iterable]) return result;
        callback = callback && typeof thisArg == "undefined" ? callback : baseCreateCallback(callback, thisArg, 3);
        for (index in iterable) {
            if (callback(iterable[index], index, collection) === false) return result;
        }
        return result;
    };
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

var rootScope, myApp = angular.module("admin", [ "ux" ]).run([ "$rootScope", function($rootScope) {
    rootScope = $rootScope;
} ]), data = {};

function getXML_file(xml_file) {
    var xhttp;
    if (window.XMLHttpRequest) {
        xhttp = new XMLHttpRequest();
    } else {
        xhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xhttp.open("GET", xml_file, false);
    xhttp.send(null);
    return xhttp.responseText;
}

myApp.controller("myController", function($scope) {
    $scope.sampleData = {
        events: [],
        root: {}
    };
    go.each(ex.events.runner, function(eventName) {
        $scope.$on(eventName, function() {
            var args = go.util.array.toArray(arguments);
            args[0] = args[0].name;
            _.extend(data, arguments[1]);
            if (!$scope.sampleData.root) {
                $scope.sampleData.root = data;
            } else {
                go.extend($scope.sampleData.root, data);
            }
            $scope.sampleData.events.push(args);
        });
    });
    $scope.parseXML = function() {
        var steps = go.runnerAdmin.xml.parse($scope.xmlData);
        console.log(steps);
        return extend.apply({
            arrayAsObject: true
        }, [ {}, steps ]);
    };
    $scope.sendTest = function() {
        $scope.$emit(ex.events.admin.LOAD_TEST, $scope.parseXML());
        $scope.xmlData = "";
    };
    $scope.registerScenario = function() {
        $scope.$emit(ex.events.admin.REGISTER_SCENARIO, $scope.parseXML());
        $scope.xmlData = "";
    };
    $scope.setScenarioXML = function() {
        $scope.xmlData = getXML_file("xml/registerScenarioSimple.xml");
    };
    $scope.setSimpleXML = function() {
        $scope.xmlData = getXML_file("xml/simple.xml");
    };
    $scope.start = function() {
        $scope.$emit(ex.events.admin.START, $scope.startNode);
    };
    $scope.stop = function() {
        $scope.$emit(ex.events.admin.STOP);
    };
    $scope.reset = function() {
        $scope.$emit(ex.events.admin.RESET);
    };
});

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
    function parseCondition(item, index, list) {
        if (item.type === "condition") {
            item.conditions = [];
            var i = 0, iLen = item.steps.length;
            while (i < iLen) {
                api.each(item.steps, parseCondition);
                item.conditions.push(item.steps[i]);
                i += 1;
            }
            item.steps = [];
        }
    }
    api.extend(api, {
        parse: function(str) {
            var result;
            str = this.closeOpenNodes(str);
            str = str.replace(/<(\w+)/g, '<steps type="$1"');
            str = str.replace(/<\/\w+/g, "</steps");
            result = this.xml2json(str);
            this.each(result.steps, parseCondition);
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
    ex.xml = api;
})();

var socket = {}, project = {
    name: "ProjectA"
}, user = {
    displayName: "Admin Panel",
    isAdmin: true,
    visible: false,
    ua: navigator.userAgent,
    tracks: {}
}, devices = {};

function onTrackConnectionSuccess(trackRoom) {
    console.log("Track connected");
    function addDevice(userInfo) {
        var channel, channelId;
        if (!userInfo.isAdmin) {
            if (!devices[userInfo.id]) {
                console.log("	User Joined %s", userInfo.displayName);
                devices[userInfo.id] = userInfo;
                channelId = userInfo.id.split(":").pop();
                channel = trackRoom.channel(channelId);
                console.log("connected on chanel %s", channelId);
                channel.on("message", function(data, context) {
                    console.log("message received from %s", userInfo.id);
                    var args = exports.util.array.toArray(data);
                    rootScope.$broadcast.apply(rootScope, args);
                });
            }
        }
    }
    function removeDevice(userInfo) {
        if (devices[userInfo.id]) {
            trackRoom.channel(userInfo.id).off("message");
            delete devices[userInfo.id];
            console.log("	User Left %s", userInfo.displayName);
        }
    }
    function sendMessageToDevices(event) {
        var args = exports.util.array.toArray(arguments);
        exports.each(devices, sendMessageToDevice, args);
    }
    function sendMessageToDevice(device, index, list, args) {
        args[0] = args[0].name;
        var channelId = device.id.split(":").pop(), channel = trackRoom.channel(channelId), argsToObject = exports.extend.apply({
            arrayAsObject: true
        }, [ {}, args ]);
        console.log("	sendToDevice on channel %s %o", channelId, argsToObject);
        channel.message.apply(channel, [ argsToObject ]);
    }
    function mapEvents(events, method) {
        rootScope.$on(events, method);
    }
    trackRoom.users.get(function(err, usersInfo, context) {
        console.log("TrackUsers.get() %o", usersInfo);
        exports.each(usersInfo, addDevice);
    });
    trackRoom.on("join", addDevice);
    trackRoom.on("leave", removeDevice);
    trackRoom.channel("public").on("message", function(data, context) {
        console.log("message received on PUBLIC", data, context);
    });
    function setTrackOnDevices(event, track) {
        exports.each(devices, setTrackOnDevice, track);
    }
    function setTrackOnDevice(device, index, list, track) {
        var str = "/.users/" + device.id + "/track";
        trackRoom.key(str).set(track, function() {
            console.log("set param ", arguments);
        });
    }
    exports.each(ex.events.admin, function(event, payload) {
        if (event === ex.events.admin.LOAD_TEST) {
            mapEvents(event, setTrackOnDevices);
        } else {
            mapEvents(event, sendMessageToDevices);
        }
    });
}

(function() {
    var _subscriptions = {};
    socket.on = function(eventName, callback) {
        console.log("const:on %s", eventName);
        var subscribers = _subscriptions[eventName];
        if (typeof subscribers === "undefined") {
            subscribers = _subscriptions[eventName] = [];
        }
        subscribers.push(callback);
    };
    socket.dispatch = function(eventName, data, context) {
        console.log("dispatch:dispatch %s", eventName);
        var subscribers = _subscriptions[eventName], i = 0, len;
        if (typeof subscribers === "undefined") {
            return;
        }
        data = data instanceof Array ? data : [ data ];
        context = context || socket;
        len = subscribers.length;
        while (i < len) {
            subscribers[i].apply(context, data);
            i += 1;
        }
    };
    socket.config = {};
    socket.config.GOINSTANT_URL = "https://goinstant.net/0fc17c9b2a8f/runner-dev";
    socket.events = {};
    socket.events.ON_USER_READY = "onUserReady";
    socket.events.ON_CONNECTION_SUCCESS = "onConnectionSuccess";
    socket.events.ON_CONNECTION_ERROR = "onConnectionError";
    socket.events.ON_TRACK_CONNECTION_SUCCESS = "onTrackConnectionSuccess";
    socket.events.ON_TRACK_CONNECTION_ERROR = "onTrackConnectionError";
})();

(function() {
    var scope = this || {}, connection, user;
    function init() {
        console.log("socketService:init");
        socket.on(socket.events.ON_USER_READY, onUserReady);
    }
    function connect() {
        console.log("socketService:connect");
        scope.isConnected = false;
        connection = new goinstant.Connection(socket.config.GOINSTANT_URL);
        connection.connect(user, onConnection);
    }
    function onUserReady(userData) {
        console.log("socketService:onUserReady");
        user = userData;
        connect();
    }
    function onConnection(err) {
        console.log("socketService:onConnection");
        if (err) {
            scope.isConnected = false;
            return socket.dispatch(socket.events.ON_CONNECTION_ERROR, err);
        }
        scope.isConnected = true;
        socket.dispatch(socket.events.ON_CONNECTION_SUCCESS, connection);
    }
    scope.isConnected = false;
    init();
})();

(function() {
    var project, trackRoom;
    function init() {
        console.log("trackRoomService:init");
        socket.on(socket.events.ON_USER_READY, onUserReady);
        socket.on(socket.events.ON_PROJECT_READY, onProjectReady);
        socket.on(socket.events.ON_CONNECTION_SUCCESS, onConnectionSuccess);
    }
    function onUserReady(projectInfo) {
        console.log("trackRoomService:onUserRead");
        project = projectInfo;
    }
    function onConnectionSuccess(connection) {
        console.log("trackRoomService:onConnectionSuccess");
        trackRoom = connection.room(project.name);
        trackRoom.join().then(function(res) {
            socket.dispatch(socket.events.ON_TRACK_CONNECTION_SUCCESS, res.room);
        }, function(err) {
            socket.dispatch(socket.events.ON_TRACK_CONNECTION_ERROR, err);
        });
    }
    function onProjectReady(projectData) {
        console.log("trackRoomService:onProjectReady %o", projectData);
        project = projectData;
    }
    init();
})();

(function() {
    socket.on(socket.events.ON_TRACK_CONNECTION_SUCCESS, onTrackConnectionSuccess);
    console.log("what is ua", navigator.userAgent);
    socket.dispatch(socket.events.ON_USER_READY, user);
    socket.dispatch(socket.events.ON_PROJECT_READY, project);
})();
}(this.go = this.go || {}, function() {return this;}()));
