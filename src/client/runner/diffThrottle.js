function diffThrottle(runner, rootStep, activePath, throttle) {

    var api = {}, diffRoot, lastEvent, lastTime = 0, intv;

    throttle = throttle || 0;

    function fire(evt) {
        var now = Date.now(), then = lastTime + throttle;
        clearTimeout(intv);
        if (evt) {
            console.log("%c%s", "color:#009900;", evt);
            lastEvent = evt;
        }
        if (now > then) {
            lastTime = now;
            run();
        } else {
            intv = setTimeout(fire, then - now);
        }
    }

    function run() {
        var path = activePath.getPath().join('.'), exportData, myDiff;
        rootStep.activePath = 'R' + (path && '.' + path || '');
        activePath.getProgressChanges();
        exportData = exportStep(rootStep);
        myDiff = exports.data.diff(diffRoot, exportData);
    //        console.log("DIFF: %o", myDiff);
        diffRoot = exportData;
        runner.dispatch(lastEvent, myDiff);
    }

    api.throttle = throttle;
    api.fire = fire;
    return api;
}