var _;
(function () {

    /** Used to pool arrays and objects used internally */
    var arrayPool = [],
        objectPool = [];
    /** Used as the max size of the `arrayPool` and `objectPool` */
    var maxPoolSize = 40;

    /**
     * Gets an array from the array pool or creates a new one if the pool is empty.
     *
     * @private
     * @returns {Array} The array from the pool.
     */
    function getArray() {
        return arrayPool.pop() || [];
    }

    /**
     * Releases the given array back to the array pool.
     *
     * @private
     * @param {Array} [array] The array to release.
     */
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

        _.extend = function (target, source) {
            target = target || {};
            for (var prop in source) {
                if (source.hasOwnProperty(prop)) {
                    if (typeof source[prop] === 'object') {
                        target[prop] = _.extend(target[prop], source[prop]);
                    } else {
                        target[prop] = source[prop];
                    }
                }
            }
            return target;
        };

        _.isString = function (val) {
            return typeof val === 'string';
        };

        _.isBoolean = function (val) {
            return typeof val === 'boolean';
        };

        _.isNumber = function (val) {
            return typeof val === 'number';
        };

        _.isArray = function (val) {
            return val ? !!val.isArray : false;
        };

        _.isEmpty = function (val) {
            if (_.isString(val)) {
                return val === '';
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

        _.isUndefined = function (val) {
            return typeof val === 'undefined';
        };

        _.isFunction = function (val) {
            return typeof val === 'function';
        };

        _.isObject = function (val) {
            return typeof val === 'object';
        };

        _.isDate = function (val) {
            return val instanceof Date;
        };

        /** Used to determine if values are of the language type Object */
        var objectTypes = {
            'boolean': false,
            'function': true,
            'object': true,
            'number': false,
            'string': false,
            'undefined': false
        };
        /** `Object#toString` result shortcuts */
        var argsClass = '[object Arguments]',
            arrayClass = '[object Array]',
            boolClass = '[object Boolean]',
            dateClass = '[object Date]',
            funcClass = '[object Function]',
            numberClass = '[object Number]',
            objectClass = '[object Object]',
            regexpClass = '[object RegExp]',
            stringClass = '[object String]';

        /**
         * The base implementation of `_.isEqual`, without support for `thisArg` binding,
         * that allows partial "_.where" style comparisons.
         *
         * @private
         * @param {*} a The value to compare.
         * @param {*} b The other value to compare.
         * @param {Function} [callback] The function to customize comparing values.
         * @param {Function} [isWhere=false] A flag to indicate performing partial comparisons.
         * @param {Array} [stackA=[]] Tracks traversed `a` objects.
         * @param {Array} [stackB=[]] Tracks traversed `b` objects.
         * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
         */
        _.isEqual = function baseIsEqual(a, b, callback, isWhere, stackA, stackB) {
            /* jshint ignore:start */
            // used to indicate that when comparing objects, `a` has at least the properties of `b`
            if (callback) {
                var result = callback(a, b);
                if (typeof result != 'undefined') {
                    return !!result;
                }
            }
            // exit early for identical values
            if (a === b) {
                // treat `+0` vs. `-0` as not equal
                return a !== 0 || (1 / a == 1 / b);
            }
            var type = typeof a,
                otherType = typeof b;

            // exit early for unlike primitive values
            if (a === a && !(a && objectTypes[type]) && !(b && objectTypes[otherType])) {
                return false;
            }
            // exit early for `null` and `undefined` avoiding ES3's Function#call behavior
            // http://es5.github.io/#x15.3.4.4
            if (a == null || b == null) {
                return a === b;
            }
            // compare [[Class]] names
            var className = toString.call(a),
                otherClass = toString.call(b);

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
                    // coerce dates and booleans to numbers, dates to milliseconds and booleans
                    // to `1` or `0` treating invalid dates coerced to `NaN` as not equal
                    return +a == +b;

                case numberClass:
                    // treat `NaN` vs. `NaN` as equal
                    return (a != +a)
                        ? b != +b
                        // but treat `+0` vs. `-0` as not equal
                        : (a == 0 ? (1 / a == 1 / b) : a == +b);

                case regexpClass:
                case stringClass:
                    // coerce regexes to strings (http://es5.github.io/#x15.10.6.4)
                    // treat string primitives and their corresponding object instances as equal
                    return a == String(b);
            }
            var isArr = className == arrayClass;
            if (!isArr) {
                // unwrap any `lodash` wrapped values
                var aWrapped = hasOwnProperty.call(a, '__wrapped__'),
                    bWrapped = hasOwnProperty.call(b, '__wrapped__');

                if (aWrapped || bWrapped) {
                    return baseIsEqual(aWrapped ? a.__wrapped__ : a, bWrapped ? b.__wrapped__ : b, callback, isWhere, stackA, stackB);
                }
                // exit for functions and DOM nodes
                if (className != objectClass) {
                    return false;
                }
                // in older versions of Opera, `arguments` objects have `Array` constructors
                var ctorA = a.constructor,
                    ctorB = b.constructor;

                // non `Object` object instances with different constructors are not equal
                if (ctorA != ctorB && !(isFunction(ctorA) && ctorA instanceof ctorA && isFunction(ctorB) && ctorB instanceof ctorB) &&
                    ('constructor' in a && 'constructor' in b)
                    ) {
                    return false;
                }
            }
            // assume cyclic structures are equal
            // the algorithm for detecting cyclic structures is adapted from ES 5.1
            // section 15.12.3, abstract operation `JO` (http://es5.github.io/#x15.12.3)
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

            // add `a` and `b` to the stack of traversed objects
            stackA.push(a);
            stackB.push(b);

            // recursively compare objects and arrays (susceptible to call stack limits)
            if (isArr) {
                // compare lengths to determine if a deep comparison is necessary
                length = a.length;
                size = b.length;
                result = size == length;

                if (result || isWhere) {
                    // deep compare the contents, ignoring non-numeric properties
                    while (size--) {
                        var index = length,
                            value = b[size];

                        if (isWhere) {
                            while (index--) {
                                if ((result = baseIsEqual(a[index], value, callback, isWhere, stackA, stackB))) {
                                    break;
                                }
                            }
                        } else if (!(result = baseIsEqual(a[size], value, callback, isWhere, stackA, stackB))) {
                            break;
                        }
                    }
                }
            }
            else {
                // deep compare objects using `forIn`, instead of `forOwn`, to avoid `Object.keys`
                // which, in this case, is more costly
                forIn(b, function (value, key, b) {
                    if (hasOwnProperty.call(b, key)) {
                        // count the number of properties.
                        size++;
                        // deep compare each property value.
                        return (result = hasOwnProperty.call(a, key) && baseIsEqual(a[key], value, callback, isWhere, stackA, stackB));
                    }
                });

                if (result && !isWhere) {
                    // ensure both objects have the same number of properties
                    forIn(a, function (value, key, a) {
                        if (hasOwnProperty.call(a, key)) {
                            // `size` will be `-1` if `a` has more properties than `b`
                            return (result = --size > -1);
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
            /* jshint ignore:end */
        };
    }
}());