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

var myApp = angular.module("admin", [ "ux" ]), data = {};

myApp.controller("myController", function($scope) {
    $scope.sampleData = {
        events: [],
        root: {}
    };
    go.each(go.runner.events, function(eventName) {
        $scope.$on(eventName, function() {
            var args = go.util.array.toArray(arguments);
            args[0] = args[0].name;
            _.extend(data, arguments[1]);
            $scope.sampleData.root = data;
            $scope.sampleData.events.push(args);
        });
    });
    socket.admin = $scope.$root;
});

exports.getData = function() {
    return data;
};
}(this.go = this.go || {}, function() {return this;}()));
