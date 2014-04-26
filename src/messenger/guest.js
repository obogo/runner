ui = (function () {
    var options = {},
        _injector,
        $rs;

    function injector() {
        if (!_injector) {
            _injector = angular.element(config.doc).injector();
        }
        return _injector;
    }

    function broadcast() {
        $rs = $rs || injector().get('$rootScope');
        $rs.$broadcast.apply($rs, arguments);
    }

    function GuestProxy() {
//        window.onbefore
    }

    GuestProxy.prototype.event = function () {
        proxy.log("event: %o", arguments);
        broadcast.apply(null, arguments);
        return true;
    };

    GuestProxy.prototype.getProxyAPI = function () {
        var api = {};
        for (var i in this) {
            api[i] = typeof this[i];
        }
        return api;
    };
    GuestProxy.prototype.getOptions = function () {
        return options;
    };
    GuestProxy.prototype.getFiles = function () {
        return [
            "//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.0/jquery.min.js",
            'http://webux.lh/ux-runner2/build/ux-runner.js',
            'http://webux.lh/ux-runner2/app/host/scenarios.js'
        ];
    };
    GuestProxy.prototype.ready = function (scenarioNames) {
        this._ready = true;
        this.scenarioNames = scenarioNames;
        proxy.log("\tsenarios [%s]", scenarioNames.join(', '));
    };

    return new GuestProxy();
}());
proxy.$type = 'guest';
proxy.$logStyle = "color:#090";
ex.proxy = proxy;