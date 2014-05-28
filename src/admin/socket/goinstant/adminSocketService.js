(function () {

    var scope = this || {},
        connection,
        user,
        csl = new Logger("socketService", "color:#FF00FF");

    function init() {
        csl.log("init");
        socket.on(socket.events.ON_USER_READY, onUserReady);
    }

    function connect() {
        csl.log("connect");
        scope.isConnected = false;

        connection = new goinstant.Connection(socket.config.GOINSTANT_URL);
        connection.connect(user, onConnection);
    }

    function onUserReady(userData) {
        csl.log("onUserReady");
        user = userData;
        connect();
    }

    function onConnection(err) {
        csl.log("onConnection");
        if (err) {
            scope.isConnected = false;
            return socket.dispatch(socket.events.ON_CONNECTION_ERROR, err);
        }
        scope.isConnected = true;
        socket.dispatch(socket.events.ON_CONNECTION_SUCCESS, connection);
    }

    scope.isConnected = false;

    init();

}());