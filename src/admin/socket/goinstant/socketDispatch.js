(function () {
    var _subscriptions = {},
        csl = new Logger("serviceConst", "color:#FF0099");

    socket.on = function (eventName, callback) {
        csl.log("on %s", eventName);
        var subscribers = _subscriptions[eventName];
        if (typeof subscribers === 'undefined') {
            subscribers = _subscriptions[eventName] = [];
        }
        subscribers.push(callback);
    };

    socket.dispatch = function (eventName, data, context) {
        csl.log("dispatch %s", eventName);
        var subscribers = _subscriptions[eventName],
            i = 0, len;
        if (typeof subscribers === 'undefined') {
            return;
        }
        data = (data instanceof Array) ? data : [data];
        context = context || socket;
        len = subscribers.length;
        while (i < len) {
            subscribers[i].apply(context, data);
            i += 1;
        }
    };
}());