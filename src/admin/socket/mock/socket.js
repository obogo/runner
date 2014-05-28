function onTrackConnectionSuccess() {
    socket.off(socket.events.ON_TRACK_CONNECTION_SUCCESS, onTrackConnectionSuccess);
    // access the dom elements and broadcast to the right one.
    var admin = angular.element(doc.querySelector('.admin')).scope().$root;
    exports.each(ex.events.admin, function (eventName) {
        console.log("eventName %s", eventName);
        admin.$on(eventName, function (event, data) {
            console.log("SEND EVENT TO RUNNER: %s", event.name);
            switch (event.name) {
                case ex.events.admin.START:
                    go.runner.start(arguments[1]);
                    break;
                case ex.events.admin.STOP:
                    go.runner.stop();
                    break;
                case ex.events.admin.RESET:
                    go.runner.reset();
                    break;
                case ex.events.admin.LOAD_TEST:
                    go.runner.loadTest(arguments[1]);
                    break;
                case ex.events.admin.REGISTER_SCENARIO:
                    go.runner.registerScenario(arguments[1]);
                    break;
                default:
                    console.log("\tunsupported event %s", event.name);
            }
        });
    });
}