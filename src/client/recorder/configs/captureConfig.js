var recorderConfig = function () {
    var self = {},
        csl = new Logger("capture", "color:#336699;");

    function handleError(message, url, lineNumber, charNumber, error) {
        var data = {msg: message, url: url, ln: lineNumber, cn: charNumber, stack: error.stack};
        csl.log(data);
        //TODO: remove all error listeners. After the first error is thrown, we are done.
        return true;// true == handled. false will still throw the error.
    }

    exports.extend(self, {
        startImmediately: true,
        eventMap: {
            "click": configUtils.getSelector.bind(self),
            "hashchange": configUtils.hashchange.bind(self)
        },
        public: {
            try: function (fn, args, scope) {
                try {
                    fn.apply(scope, args);
                } catch (e) {
                    self.public.catch.apply(self.public, [e]);
                }
            },
            catch: function (e) {
                add({type:'error', stack: e.stack});
                csl.log("caught %s", e.stack);
            }
        }
    });

    function add(step) {
        self.dispatch(ex.events.ADD_STEP, step);
    }

    function overrideXMLHttpRequest() {
        var send, xhr;
        // if browser suports XMLHttpRequest
        if (window.XMLHttpRequest) {
            // Cretes a instantce of XMLHttpRequest object
            xhr = XMLHttpRequest;
            send = xhr.prototype.send;
            xhr.prototype.send = function () {
                //TODO: need to gather headers and cookies that were sent.
                var result = {
                        type: 'xhr',
                        request: arguments[0],
                        response: null
                    },
                    onreadystatechange = this.onreadystatechange;
                //TODO: maybe a set timeout here before the override to escape the running thread incase they set this value after they call send.
                this.onreadystatechange = function () {
                    console.log("readyState %s", this.readyState);
                    if (this.readyState == 4) {
                        //TODO: need to gather headers
                        result.response = {
                            status: this.status,
                            value: this.responseText
                        };
                        add(result);
                    }
                    onreadystatechange.apply(this, arguments);
                };
                return send.apply(this, arguments);
            };
        }
    }

    function overrideConsole() {
        var original = {}, props = ['log', 'debug', 'info', 'warn', 'error'];

        if (window.console) {
            exports.each(props, function (prop) {
                original[prop] = console[prop];
                console[prop] = function () {
                    var args = exports.util.array.toArray(arguments);
                    exports.each(args, itemToString);
                    add({type:'console', prop: prop, args: args});
                    original[prop].apply(console, arguments);
                };
            });
        }
    }

    function itemToString(item, index, list) {
        if (typeof item === "object") {
            list[i] = JSON.stringify(item);
        }
    }

    //TODO: need to have socket error handling. webSockets, html5Sockets...

    window.onerror = handleError;
    overrideXMLHttpRequest();
    overrideConsole();
    dispatcher(self);
    return self;
}();