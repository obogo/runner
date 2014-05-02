ex.ui = (function () {
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

    function RunnerUI() {}
    RunnerUI.prototype.getOptions = function() {
        return options;
    };
    return new RunnerUI();
}());