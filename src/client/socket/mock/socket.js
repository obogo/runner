function onTrackConnectionSuccess() {
    socket.off(socket.events.ON_TRACK_CONNECTION_SUCCESS, onTrackConnectionSuccess);
    // access the dom elements and broadcast to the right one.
    var admin = angular.element(doc.querySelector('.admin')).scope().$root;

    exports.each(ex.events.runner, function (eventName) {
        console.log("eventName %s", eventName);
        go.runner.on(eventName, function (event, data) {
            console.log("SEND EVENT TO ADMIN: %s", event);
            admin.$broadcast.apply(admin, arguments);
        });
    });
}