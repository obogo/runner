var ui,
    proxy = (function () {
        function RunnerProxy() {
            this.$type = 'proxy';
            this.$logStyle = "color:#CCC";
        }

        var rh = new RunnerProxy(), wp, pending = [], isHost, returns = [], intv, used = [], domain;

        function onMessage(e) {
            var data, request;
            if (e.origin == "http://" + domain) {
                data = e.data;
                if (data.hasOwnProperty('$args')) {
                    request = {$m: data.$m, $return: exec(data)};
                    rh.log("%s(%o) :: return: %o", request.$m, data.$args || '', request.$return);
                    // Message received from guest.
//                        console.log("%cexec from %s: %s(%o)", "font-weight:bold", e.origin, data.$m, data.$args.length ? data.$args : undefined);
                    wp.post(request);
                } else {
                    if (data.$m !== returns[0].$m) {
                        console.log("%cERROR:Returns out of sync", "color:#FF0000;font-weight:bold");
                    }
                    rh.log("\treceived from %s: %o", data.$m, data.$return);
                    returns.shift().callback(data.$return);
                }
            } else {
                console.log("%cERROR: Unauthorized message attempt. %o", "color:#FF0000;font-weight:bold", e);
            }
            checkPending();
        }

        function onLoad(connectToUrl, frameId) {
            rh.log("onload");
            // Create a proxy window to send to and receive message from the guest iframe
            wp = new Porthole.WindowProxy(connectToUrl, frameId);
            wp.addEventListener(onMessage);
            checkPending();
        }

        /**
         * Create Proxy for connection
         * @param {String} connectToUrl
         * @param {String=} frameId - required only for host not for guest.
         */
        rh.connect = function (connectToUrl, frameId) {
            rh.log("%s connecting to %s", config.win.location.href, connectToUrl);
            isHost = !!frameId;
            domain = connectToUrl.match(/\/\/([\w\d\-]+\.\w+)\/?/)[1];
            function whenLoad() {
                onLoad(connectToUrl, frameId);
            }
            if (document.readyState === "complete") {
                whenLoad();
            } else {
                config.win.addEventListener('load', whenLoad);
            }
        };
        rh.getProxyAPI = function (callback) {
            rh.$call('getProxyAPI', [], function (api) {
                for (var i in api) {
                    if (api.hasOwnProperty(i)) {
                        rh[i] = createProxyMethod(i, api[i]);
                    }
                }
                callback();
            });
        };
        function createProxyMethod(name, data) {
            return function () {
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
            if (data.$m.indexOf('.') !== -1) {
                parts = data.$m.split('.');
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
                console.log("\t%cERROR: %s%o has no method %s", "color:#FF0000;font-weight:bold", used.join('.'), ref, method);
                return undefined;
            }
            result = ref[method].apply(ref, data.$args);
            if (result && (result.nodeType !== undefined || (result.length && result[0].nodeType !== undefined))) {
                console.log("%cERROR: cannot return dom through proxy: %o", "color:#FF0000;font-weight:bold", result);
            }
            return result;
        }

        /**
         * Talk to the proxy.
         * @param {String} method
         * @param {Array=} args
         * @param {Function=} callback
         */
        rh.$call = function (method, args, callback) {
//            console.log("%s add to pending %s", rh.$type, method);
            pending.push([method, args, callback || function() {}]);
            checkPending();
        };

        rh.log = function (msg) {
            if (config.win.console && config.win.console.log) {
                var args = exports.util.array.toArray(arguments), tabCount = 0, len = msg.length;
                if (rh.$logStyle) {
                    while (tabCount < len && msg.charAt(tabCount) === "\t") {
                        tabCount += 1;
                    }
                    msg = msg.substr(0, tabCount) + '%c%s:' + msg.substr(tabCount);
                    args.splice(1, 0, rh.$logStyle, rh.$type);
                    args[0] = msg;
                }
                console.log.apply(console, args);
            }
        };

        function applyCall(method, args, callback) {
            if (callback) {
                returns.push({$m: method, callback: callback});
            }
            wp.post({$m: method, $args: args || []});
        }

        function checkPending() {
            rh.log("\tcheckPending() wp:%s", wp);
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
    }());