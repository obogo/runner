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

exports.charPack = function(c, len) {
    var s = "";
    while (s.length < len) {
        s += c;
    }
    return s;
};

function Logger(name, style) {
    this.name = name;
    this.style = style;
}

Logger.prototype.log = function log(step) {
    var depth, args = exports.util.array.toArray(arguments), str;
    if (step && step.uid) {
        depth = step.uid.split(".").length;
        str = exports.charPack("	", depth) + step.uid + ":" + step.type + ":" + step.status + ":" + step.state + ":[" + step.progress + "]::";
        args.shift();
        args[0] = str + args[0];
    }
    this.applyName(args);
    this.applyStyle(args);
    console.log.apply(console, args);
};

Logger.prototype.applyName = function(args) {
    var str = args[0];
    if (this.name) {
        var index = 0;
        if (typeof str === "string" && str.charAt(index) === "	") {
            while (str.charAt(index) === "	") {
                index += 1;
            }
            if (index) {
                str = str.substr(0, index) + this.name + str.substr(index + 1);
            }
        }
        str = this.name + "::" + str;
        args[0] = str;
    }
};

Logger.prototype.applyStyle = function(args) {
    if (this.style) {
        args[0] = "%c" + args[0];
        args.splice(1, 0, this.style);
    }
};

var csl = new Logger();

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
    var xmlParser = new X2JS();
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
    function parse(str) {
        var result;
        str = closeOpenNodes(str);
        str = str.replace(/<(\w+)/g, '<steps type="$1"');
        str = str.replace(/<\/\w+/g, "</steps");
        result = xmlParser.xml_str2json(str);
        this.each(result.steps, parseCondition);
        return result;
    }
    function closeOpenNodes(str) {
        str = str.replace(/<(\w+)\/>/gim, "<$1></$1>");
        str = str.replace(/(<(\w+)[^>]+?)\/>/gim, "$1></$2>");
        return str;
    }
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

function X2JS(config) {
    "use strict";
    var VERSION = "1.1.5";
    config = config || {};
    initConfigDefaults();
    initRequiredPolyfills();
    function initConfigDefaults() {
        if (config.escapeMode === undefined) {
            config.escapeMode = true;
        }
        config.attributePrefix = config.attributePrefix || "_";
        config.arrayAccessForm = config.arrayAccessForm || "none";
        config.emptyNodeForm = config.emptyNodeForm || "text";
        if (config.enableToStringFunc === undefined) {
            config.enableToStringFunc = true;
        }
        config.arrayAccessFormPaths = config.arrayAccessFormPaths || [];
        if (config.skipEmptyTextNodesForObj === undefined) {
            config.skipEmptyTextNodesForObj = true;
        }
        if (config.stripWhitespaces === undefined) {
            config.stripWhitespaces = true;
        }
        config.datetimeAccessFormPaths = config.datetimeAccessFormPaths || [];
    }
    var DOMNodeTypes = {
        ELEMENT_NODE: 1,
        TEXT_NODE: 3,
        CDATA_SECTION_NODE: 4,
        COMMENT_NODE: 8,
        DOCUMENT_NODE: 9
    };
    function initRequiredPolyfills() {
        function pad(number) {
            var r = String(number);
            if (r.length === 1) {
                r = "0" + r;
            }
            return r;
        }
        if (typeof String.prototype.trim !== "function") {
            String.prototype.trim = function() {
                return this.replace(/^\s+|^\n+|(\s|\n)+$/g, "");
            };
        }
        if (typeof Date.prototype.toISOString !== "function") {
            Date.prototype.toISOString = function() {
                return this.getUTCFullYear() + "-" + pad(this.getUTCMonth() + 1) + "-" + pad(this.getUTCDate()) + "T" + pad(this.getUTCHours()) + ":" + pad(this.getUTCMinutes()) + ":" + pad(this.getUTCSeconds()) + "." + String((this.getUTCMilliseconds() / 1e3).toFixed(3)).slice(2, 5) + "Z";
            };
        }
    }
    function getNodeLocalName(node) {
        var nodeLocalName = node.localName;
        if (nodeLocalName == null) nodeLocalName = node.baseName;
        if (nodeLocalName == null || nodeLocalName == "") nodeLocalName = node.nodeName;
        return nodeLocalName;
    }
    function getNodePrefix(node) {
        return node.prefix;
    }
    function escapeXmlChars(str) {
        if (typeof str == "string") return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;").replace(/\//g, "&#x2F;"); else return str;
    }
    function unescapeXmlChars(str) {
        return str.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#x2F;/g, "/");
    }
    function toArrayAccessForm(obj, childName, path) {
        switch (config.arrayAccessForm) {
          case "property":
            if (!(obj[childName] instanceof Array)) obj[childName + "_asArray"] = [ obj[childName] ]; else obj[childName + "_asArray"] = obj[childName];
            break;
        }
        if (!(obj[childName] instanceof Array) && config.arrayAccessFormPaths.length > 0) {
            var idx = 0;
            for (;idx < config.arrayAccessFormPaths.length; idx++) {
                var arrayPath = config.arrayAccessFormPaths[idx];
                if (typeof arrayPath === "string") {
                    if (arrayPath == path) break;
                } else if (arrayPath instanceof RegExp) {
                    if (arrayPath.test(path)) break;
                } else if (typeof arrayPath === "function") {
                    if (arrayPath(obj, childName, path)) break;
                }
            }
            if (idx != config.arrayAccessFormPaths.length) {
                obj[childName] = [ obj[childName] ];
            }
        }
    }
    function fromXmlDateTime(prop) {
        var bits = prop.split(/[-T:+Z]/g);
        var d = new Date(bits[0], bits[1] - 1, bits[2]);
        var secondBits = bits[5].split(".");
        d.setHours(bits[3], bits[4], secondBits[0]);
        if (secondBits.length > 1) d.setMilliseconds(secondBits[1]);
        if (bits[6] && bits[7]) {
            var offsetMinutes = bits[6] * 60 + Number(bits[7]);
            var sign = /\d\d-\d\d:\d\d$/.test(prop) ? "-" : "+";
            offsetMinutes = 0 + (sign == "-" ? -1 * offsetMinutes : offsetMinutes);
            d.setMinutes(d.getMinutes() - offsetMinutes - d.getTimezoneOffset());
        } else if (prop.indexOf("Z", prop.length - 1) !== -1) {
            d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()));
        }
        return d;
    }
    function checkFromXmlDateTimePaths(value, childName, fullPath) {
        if (config.datetimeAccessFormPaths.length > 0) {
            var path = fullPath.split(".#")[0];
            var idx = 0;
            for (;idx < config.datetimeAccessFormPaths.length; idx++) {
                var dtPath = config.datetimeAccessFormPaths[idx];
                if (typeof dtPath === "string") {
                    if (dtPath == path) break;
                } else if (dtPath instanceof RegExp) {
                    if (dtPath.test(path)) break;
                } else if (typeof dtPath === "function") {
                    if (dtPath(obj, childName, path)) break;
                }
            }
            if (idx != config.datetimeAccessFormPaths.length) {
                return fromXmlDateTime(value);
            } else return value;
        } else return value;
    }
    function parseDOMChildren(node, path) {
        if (node.nodeType == DOMNodeTypes.DOCUMENT_NODE) {
            var result = new Object();
            var nodeChildren = node.childNodes;
            for (var cidx = 0; cidx < nodeChildren.length; cidx++) {
                var child = nodeChildren.item(cidx);
                if (child.nodeType == DOMNodeTypes.ELEMENT_NODE) {
                    var childName = getNodeLocalName(child);
                    result[childName] = parseDOMChildren(child, childName);
                }
            }
            return result;
        } else if (node.nodeType == DOMNodeTypes.ELEMENT_NODE) {
            var result = new Object();
            result.__cnt = 0;
            var nodeChildren = node.childNodes;
            for (var cidx = 0; cidx < nodeChildren.length; cidx++) {
                var child = nodeChildren.item(cidx);
                var childName = getNodeLocalName(child);
                if (child.nodeType != DOMNodeTypes.COMMENT_NODE) {
                    result.__cnt++;
                    if (result[childName] == null) {
                        result[childName] = parseDOMChildren(child, path + "." + childName);
                        toArrayAccessForm(result, childName, path + "." + childName);
                    } else {
                        if (result[childName] != null) {
                            if (!(result[childName] instanceof Array)) {
                                result[childName] = [ result[childName] ];
                                toArrayAccessForm(result, childName, path + "." + childName);
                            }
                        }
                        result[childName][result[childName].length] = parseDOMChildren(child, path + "." + childName);
                    }
                }
            }
            for (var aidx = 0; aidx < node.attributes.length; aidx++) {
                var attr = node.attributes.item(aidx);
                result.__cnt++;
                result[config.attributePrefix + attr.name] = attr.value;
            }
            var nodePrefix = getNodePrefix(node);
            if (nodePrefix != null && nodePrefix != "") {
                result.__cnt++;
                result.__prefix = nodePrefix;
            }
            if (result["#text"] != null) {
                result.__text = result["#text"];
                if (result.__text instanceof Array) {
                    result.__text = result.__text.join("\n");
                }
                if (config.escapeMode) result.__text = unescapeXmlChars(result.__text);
                if (config.stripWhitespaces) result.__text = result.__text.trim();
                delete result["#text"];
                if (config.arrayAccessForm == "property") delete result["#text_asArray"];
                result.__text = checkFromXmlDateTimePaths(result.__text, childName, path + "." + childName);
            }
            if (result["#cdata-section"] != null) {
                result.__cdata = result["#cdata-section"];
                delete result["#cdata-section"];
                if (config.arrayAccessForm == "property") delete result["#cdata-section_asArray"];
            }
            if (result.__cnt == 1 && result.__text != null) {
                result = result.__text;
            } else if (result.__cnt == 0 && config.emptyNodeForm == "text") {
                result = "";
            } else if (result.__cnt > 1 && result.__text != null && config.skipEmptyTextNodesForObj) {
                if (config.stripWhitespaces && result.__text == "" || result.__text.trim() == "") {
                    delete result.__text;
                }
            }
            delete result.__cnt;
            if (config.enableToStringFunc && (result.__text != null || result.__cdata != null)) {
                result.toString = function() {
                    return (this.__text != null ? this.__text : "") + (this.__cdata != null ? this.__cdata : "");
                };
            }
            return result;
        } else if (node.nodeType == DOMNodeTypes.TEXT_NODE || node.nodeType == DOMNodeTypes.CDATA_SECTION_NODE) {
            return node.nodeValue;
        }
    }
    function startTag(jsonObj, element, attrList, closed) {
        var resultStr = "<" + (jsonObj != null && jsonObj.__prefix != null ? jsonObj.__prefix + ":" : "") + element;
        if (attrList != null) {
            for (var aidx = 0; aidx < attrList.length; aidx++) {
                var attrName = attrList[aidx];
                var attrVal = jsonObj[attrName];
                if (config.escapeMode) attrVal = escapeXmlChars(attrVal);
                resultStr += " " + attrName.substr(config.attributePrefix.length) + "='" + attrVal + "'";
            }
        }
        if (!closed) resultStr += ">"; else resultStr += "/>";
        return resultStr;
    }
    function endTag(jsonObj, elementName) {
        return "</" + (jsonObj.__prefix != null ? jsonObj.__prefix + ":" : "") + elementName + ">";
    }
    function endsWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }
    function jsonXmlSpecialElem(jsonObj, jsonObjField) {
        if (config.arrayAccessForm == "property" && endsWith(jsonObjField.toString(), "_asArray") || jsonObjField.toString().indexOf(config.attributePrefix) == 0 || jsonObjField.toString().indexOf("__") == 0 || jsonObj[jsonObjField] instanceof Function) return true; else return false;
    }
    function jsonXmlElemCount(jsonObj) {
        var elementsCnt = 0;
        if (jsonObj instanceof Object) {
            for (var it in jsonObj) {
                if (jsonXmlSpecialElem(jsonObj, it)) continue;
                elementsCnt++;
            }
        }
        return elementsCnt;
    }
    function parseJSONAttributes(jsonObj) {
        var attrList = [];
        if (jsonObj instanceof Object) {
            for (var ait in jsonObj) {
                if (ait.toString().indexOf("__") == -1 && ait.toString().indexOf(config.attributePrefix) == 0) {
                    attrList.push(ait);
                }
            }
        }
        return attrList;
    }
    function parseJSONTextAttrs(jsonTxtObj) {
        var result = "";
        if (jsonTxtObj.__cdata != null) {
            result += "<![CDATA[" + jsonTxtObj.__cdata + "]]>";
        }
        if (jsonTxtObj.__text != null) {
            if (config.escapeMode) result += escapeXmlChars(jsonTxtObj.__text); else result += jsonTxtObj.__text;
        }
        return result;
    }
    function parseJSONTextObject(jsonTxtObj) {
        var result = "";
        if (jsonTxtObj instanceof Object) {
            result += parseJSONTextAttrs(jsonTxtObj);
        } else if (jsonTxtObj != null) {
            if (config.escapeMode) result += escapeXmlChars(jsonTxtObj); else result += jsonTxtObj;
        }
        return result;
    }
    function parseJSONArray(jsonArrRoot, jsonArrObj, attrList) {
        var result = "";
        if (jsonArrRoot.length == 0) {
            result += startTag(jsonArrRoot, jsonArrObj, attrList, true);
        } else {
            for (var arIdx = 0; arIdx < jsonArrRoot.length; arIdx++) {
                result += startTag(jsonArrRoot[arIdx], jsonArrObj, parseJSONAttributes(jsonArrRoot[arIdx]), false);
                result += parseJSONObject(jsonArrRoot[arIdx]);
                result += endTag(jsonArrRoot[arIdx], jsonArrObj);
            }
        }
        return result;
    }
    function parseJSONObject(jsonObj) {
        var result = "";
        var elementsCnt = jsonXmlElemCount(jsonObj);
        if (elementsCnt > 0) {
            for (var it in jsonObj) {
                if (jsonXmlSpecialElem(jsonObj, it)) continue;
                var subObj = jsonObj[it];
                var attrList = parseJSONAttributes(subObj);
                if (subObj == null || subObj == undefined) {
                    result += startTag(subObj, it, attrList, true);
                } else if (subObj instanceof Object) {
                    if (subObj instanceof Array) {
                        result += parseJSONArray(subObj, it, attrList);
                    } else if (subObj instanceof Date) {
                        result += startTag(subObj, it, attrList, false);
                        result += subObj.toISOString();
                        result += endTag(subObj, it);
                    } else {
                        var subObjElementsCnt = jsonXmlElemCount(subObj);
                        if (subObjElementsCnt > 0 || subObj.__text != null || subObj.__cdata != null) {
                            result += startTag(subObj, it, attrList, false);
                            result += parseJSONObject(subObj);
                            result += endTag(subObj, it);
                        } else {
                            result += startTag(subObj, it, attrList, true);
                        }
                    }
                } else {
                    result += startTag(subObj, it, attrList, false);
                    result += parseJSONTextObject(subObj);
                    result += endTag(subObj, it);
                }
            }
        }
        result += parseJSONTextObject(jsonObj);
        return result;
    }
    this.parseXmlString = function(xmlDocStr) {
        var isIEParser = window.ActiveXObject || "ActiveXObject" in window;
        if (xmlDocStr === undefined) {
            return null;
        }
        var xmlDoc;
        if (window.DOMParser) {
            var parser = new window.DOMParser();
            var parsererrorNS = null;
            if (!isIEParser) {
                try {
                    parsererrorNS = parser.parseFromString("INVALID", "text/xml").childNodes[0].namespaceURI;
                } catch (err) {
                    parsererrorNS = null;
                }
            }
            try {
                xmlDoc = parser.parseFromString(xmlDocStr, "text/xml");
                if (parsererrorNS != null && xmlDoc.getElementsByTagNameNS(parsererrorNS, "parsererror").length > 0) {
                    xmlDoc = null;
                }
            } catch (err) {
                xmlDoc = null;
            }
        } else {
            if (xmlDocStr.indexOf("<?") == 0) {
                xmlDocStr = xmlDocStr.substr(xmlDocStr.indexOf("?>") + 2);
            }
            xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
            xmlDoc.async = "false";
            xmlDoc.loadXML(xmlDocStr);
        }
        return xmlDoc;
    };
    this.asArray = function(prop) {
        if (prop instanceof Array) return prop; else return [ prop ];
    };
    this.toXmlDateTime = function(dt) {
        if (dt instanceof Date) return dt.toISOString(); else if (typeof dt === "number") return new Date(dt).toISOString(); else return null;
    };
    this.asDateTime = function(prop) {
        if (typeof prop == "string") {
            return fromXmlDateTime(prop);
        } else return prop;
    };
    this.xml2json = function(xmlDoc) {
        return parseDOMChildren(xmlDoc);
    };
    this.xml_str2json = function(xmlDocStr) {
        var xmlDoc = this.parseXmlString(xmlDocStr);
        if (xmlDoc != null) return this.xml2json(xmlDoc); else return null;
    };
    this.json2xml_str = function(jsonObj) {
        return parseJSONObject(jsonObj);
    };
    this.json2xml = function(jsonObj) {
        var xmlDocStr = this.json2xml_str(jsonObj);
        return this.parseXmlString(xmlDocStr);
    };
    this.getVersion = function() {
        return VERSION;
    };
}

var socket = {
    config: {
        GOINSTANT_URL: "https://goinstant.net/0fc17c9b2a8f/runner-dev"
    },
    events: {
        ON_USER_READY: "onUserReady",
        ON_CONNECTION_SUCCESS: "onConnectionSuccess",
        ON_CONNECTION_ERROR: "onConnectionError",
        ON_TRACK_CONNECTION_SUCCESS: "onTrackConnectionSuccess",
        ON_TRACK_CONNECTION_ERROR: "onTrackConnectionError"
    }
}, project = {
    name: "ProjectA"
}, user = {
    displayName: "Admin Panel",
    isAdmin: true,
    visible: false,
    ua: navigator.userAgent,
    tracks: {},
    scenarios: {}
}, devices = {};

(function() {
    var _subscriptions = {}, csl = new Logger("serviceConst", "color:#FF0099");
    socket.on = function(eventName, callback) {
        csl.log("on %s", eventName);
        var subscribers = _subscriptions[eventName];
        if (typeof subscribers === "undefined") {
            subscribers = _subscriptions[eventName] = [];
        }
        subscribers.push(callback);
    };
    socket.dispatch = function(eventName, data, context) {
        csl.log("dispatch %s", eventName);
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
})();

(function() {
    var scope = this || {}, connection, user, csl = new Logger("socketService", "color:#FF00FF");
    function init() {
        csl.log("init");
        socket.on(socket.events.ON_USER_READY, onUserReady);
    }
    function connect() {
        csl.log("connect");
        scope.isConnected = false;
        connection = new goinstant.Connection(socket.config.GOINSTANT_URL);
        connection.connect(user, onConnection);
    }
    function onUserReady(userData) {
        csl.log("onUserReady");
        user = userData;
        connect();
    }
    function onConnection(err) {
        csl.log("onConnection");
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
    var project, trackRoom, csl = new Logger("trackRoomService", "color:#9900FF");
    function init() {
        csl.log("init");
        socket.on(socket.events.ON_USER_READY, onUserReady);
        socket.on(socket.events.ON_PROJECT_READY, onProjectReady);
        socket.on(socket.events.ON_CONNECTION_SUCCESS, onConnectionSuccess);
    }
    function onUserReady(projectInfo) {
        csl.log("onUserRead");
        project = projectInfo;
    }
    function onConnectionSuccess(connection) {
        csl.log("onConnectionSuccess");
        trackRoom = connection.room(project.name);
        trackRoom.join().then(function(res) {
            socket.dispatch(socket.events.ON_TRACK_CONNECTION_SUCCESS, res.room);
        }, function(err) {
            csl.log("	ERROR: %o", err);
            socket.dispatch(socket.events.ON_TRACK_CONNECTION_ERROR, err);
        });
    }
    function onProjectReady(projectData) {
        csl.log("onProjectReady %o", projectData);
        project = projectData;
    }
    init();
})();

(function() {
    var csl = new Logger("trackRoomListeners", "color:#6633FF");
    function onTrackConnectionSuccess(trackRoom) {
        csl.log("Track connected");
        function listenToMessages(device) {
            var channelId = device.id.split(":").pop(), channel = trackRoom.channel(channelId);
            csl.log("connected on chanel %s", channelId);
            channel.on("message", function(data, context) {
                csl.log("message received from %s", device.id);
                var args = exports.util.array.toArray(data);
                rootScope.$broadcast.apply(rootScope, args);
            });
        }
        function listenToProgress(device) {
            var str = "/.users/" + device.id + "/progress";
            trackRoom.key(str).on("set", function(value, context) {
                csl.log("	console update %s", value.percent);
            });
        }
        function addDevice(userInfo) {
            if (!userInfo.isAdmin) {
                if (!devices[userInfo.id]) {
                    csl.log("	User Joined %s", userInfo.displayName);
                    devices[userInfo.id] = userInfo;
                    listenToMessages(userInfo);
                    listenToProgress(userInfo);
                }
            }
        }
        function removeDevice(userInfo) {
            if (devices[userInfo.id]) {
                trackRoom.channel(userInfo.id).off("message");
                delete devices[userInfo.id];
                csl.log("	User Left %s", userInfo.displayName);
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
            csl.log("	sendToDevice on channel %s %o", channelId, argsToObject);
            channel.message.apply(channel, [ argsToObject ]);
        }
        function mapEvents(event, method) {
            rootScope.$on(event, method);
        }
        trackRoom.users.get(function(err, usersInfo, context) {
            csl.log("TrackUsers.get() %o", usersInfo);
            exports.each(usersInfo, addDevice);
        });
        trackRoom.on("join", addDevice);
        trackRoom.on("leave", removeDevice);
        trackRoom.channel("public").on("message", function(data, context) {
            csl.log("message received on PUBLIC", data, context);
        });
        function setTrackOnDevices(event, track) {
            exports.each(devices, setTrackOnDevice, track);
        }
        function setTrackOnDevice(device, index, list, track) {
            var str = "/.users/" + device.id + "/track";
            trackRoom.key(str).set(track, function(err) {
                if (err) {
                    csl.log(err);
                }
            });
        }
        function setScenarioToDevices(event, scenario) {
            exports.each(devices, setScenarioToDevice, scenario);
        }
        function setScenarioToDevice(device, index, list, scenario) {
            var str = "/.users/" + device.id + "/scenarios";
            trackRoom.key(str).set(scenario, function(err) {
                if (err) {
                    csl.log(err);
                }
            });
        }
        mapEvents(ex.events.admin.START, sendMessageToDevices);
        mapEvents(ex.events.admin.STOP, sendMessageToDevices);
        mapEvents(ex.events.admin.RESET, sendMessageToDevices);
        mapEvents(ex.events.admin.START_RECORDING, sendMessageToDevices);
        mapEvents(ex.events.admin.STOP_RECORDING, sendMessageToDevices);
        mapEvents(ex.events.admin.LOAD_TEST, setTrackOnDevices);
        mapEvents(ex.events.admin.REGISTER_SCENARIO, setScenarioToDevices);
    }
    socket.on(socket.events.ON_TRACK_CONNECTION_SUCCESS, onTrackConnectionSuccess);
    csl.log("what is ua", navigator.userAgent);
    socket.dispatch(socket.events.ON_USER_READY, user);
    socket.dispatch(socket.events.ON_PROJECT_READY, project);
})();
}(this.go = this.go || {}, function() {return this;}()));
