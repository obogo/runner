ui = (function () {
    var options = {
            async: true,
            interval: 100,
            chainInterval: 10,
            defaultTimeout: 1000,
            frame: {
                top: 0,
                left: 0,
                width: "100%",
                height: "100%"
            },
            timeouts: {
                mini: 100,
                short: 1000,
                medium: 10000,
                long: 30000,
                forever: 60000
            }
        };

    function HostProxy() {
    }

    HostProxy.prototype.getOptions = function () {
        return options;
    };

    HostProxy.prototype.getScenarios = function () {
        return ux.runner.describeScenarios();
    };
    return new HostProxy();
}());
proxy.$type = 'host';
proxy.$logStyle = "color:#F90";
ex.proxy = proxy;
//proxy.getProxyAPI();

function loadCss(url) {
    var link = config.doc.createElement('link');
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = url;
    config.doc.getElementsByTagName('head')[0].appendChild(link);
}

function createFrame(url) {
    var div = config.doc.createElement('div');
    div.className = 'runner-frame';
    // create the handle and attach it.
    var handle = config.doc.createElement('div');
    handle.className = 'runner-handle';
    handle.addEventListener('click', function () {
        if (div.className.indexOf('runner-open') === -1) {
            div.classList.add('runner-open');
        } else {
            div.classList.remove('runner-open');
        }
    });
    div.appendChild(handle);

    // create the frame and attach it.
    var iframe = config.doc.createElement('IFRAME');
    iframe.setAttribute('id', 'runner-iframe');
    iframe.onload = function () {
        proxy.connect(config.app.url, 'runner-iframe');
        proxy.getProxyAPI(function () {
            proxy.getFiles(function (files) {
                var i = 0, iLen = files.length;
                while (i < iLen) {
                    ex.util.loadJSFile(files[i]);
                    i += 1;
                }
                ex.util.onFilesLoaded(function () {
                    ux.runner.on(ux.runner.events.START, function () {
                        div.classList.add('runner-running');
                    });
                    ux.runner.on(ux.runner.events.DONE, function () {
                        div.classList.remove('runner-running');
                    });
                    ux.runner.recorder.on(ux.runner.events.START_RECORDING, function () {
                        div.classList.add('runner-recording');
                    });
                    ux.runner.recorder.on(ux.runner.events.STOP_RECORDING, function () {
                        div.classList.remove('runner-recording');
                    });
                    proxy.getOptions(function (options) {
                        proxy.log("\t\toptions: %o", options);
                        ex.config(options);
                        proxy.log("\t\tux %o", ux);
                    });
                    proxy.ready(ex.getScenarioNames(), function (scenarios) {
                        proxy.log("\t\tscenarios: %o", scenarios);
                    });
                });
            });
        });
    };
    iframe.className = 'runner-frame-iframe';
    iframe.src = url;
    iframe.width = '20px';
    iframe.height = '20px';
    div.appendChild(iframe);

    // attach the container.
    config.doc.body.appendChild(div);
}

window.addEventListener('load', function () {
    // load the css first so when the frame loads it loads in the right place.
    loadCss(config.host.css);
    createFrame(config.app.url);
}, false);
