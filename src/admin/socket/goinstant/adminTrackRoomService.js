(function () {

    var project,
        trackRoom,
        csl = new Logger("trackRoomService", "color:#9900FF");

    function init() {
        csl.log("init");
        socket.on(socket.events.ON_USER_READY, onUserReady);
        socket.on(socket.events.ON_PROJECT_READY, onProjectReady);
        socket.on(socket.events.ON_CONNECTION_SUCCESS, onConnectionSuccess);
    }

    function onUserReady(projectInfo) {
        csl.log("onUserRead");
        project = projectInfo;
    }

    function onConnectionSuccess(connection) {
        csl.log("onConnectionSuccess");
        trackRoom = connection.room(project.name);
        trackRoom.join().then(function (res) {
            socket.dispatch(socket.events.ON_TRACK_CONNECTION_SUCCESS, res.room);
        }, function (err) {
            csl.log("\tERROR: %o", err);
            socket.dispatch(socket.events.ON_TRACK_CONNECTION_ERROR, err);
        });
    }

    function onProjectReady(projectData) {
        csl.log("onProjectReady %o", projectData);
        project = projectData;
    }

    init();

}());