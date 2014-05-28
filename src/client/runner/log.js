var csl = (function () {
    var api = {};
    function log(step) {
        var depth = step.uid.split('.').length, args = exports.util.array.toArray(arguments),
            str = charPack("\t", depth) + step.uid + ':' + step.type + ':' + step.status + ':' + step.state + ':[' + step.progress + ']::';
        args.shift();
        args[0] = str + args[0];
        console.log.apply(console, args);
    }

    function charPack(c, len) {
        var s = '';
        while (s.length < len) {
            s += c;
        }
        return s;
    }

    api.log = log;
    return api;
}());