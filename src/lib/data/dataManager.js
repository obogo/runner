/* global angular */
exports.data = exports.data || {};
exports.data.inspector = function(){

    function Inspector(data) {
        this.data = data || {};
    }

    Inspector.prototype.get = function(path, delimiter) {
        var arr = path.split(delimiter || '.'),
            space = '',
            i = 0,
            len = arr.length;

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
        var arr = path.split(delimiter || '.'),
            space = '',
            i = 0,
            len = arr.length - 1;

        var data = this.data;

        while (i < len) {
            space = arr[i];
            if(space) {
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
            if(data[prop] && merge) {
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