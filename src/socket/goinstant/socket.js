var socket = {};

(function () {
    var _subscriptions = {};

    socket.on = function (eventName, callback) {
        console.log("const:on %s", eventName);
        var subscribers = _subscriptions[eventName];

        if (typeof subscribers === 'undefined') {
            subscribers = _subscriptions[eventName] = [];
        }

        subscribers.push(callback);
    };

    socket.dispatch = function (eventName, data, context) {
        console.log("dispatch:dispatch %s", eventName);
        var subscribers = _subscriptions[eventName],
            i = 0, len;

        if (typeof subscribers === 'undefined') {
            return;
        }

        data = (data instanceof Array) ? data : [data];

        context = context || socket;

        len = subscribers.length;
        while (i < len) {
            subscribers[i].apply(context, data);
            i += 1;
        }
    }

    socket.config = {};
    socket.config.GOINSTANT_URL = 'https://goinstant.net/0fc17c9b2a8f/runner-dev';

    socket.events = {}
    socket.events.ON_USER_READY = 'onUserReady';
    socket.events.ON_CONNECTION_SUCCESS = 'onConnectionSuccess';
    socket.events.ON_CONNECTION_ERROR = 'onConnectionError';
    socket.events.ON_TRACK_CONNECTION_SUCCESS = 'onTrackConnectionSuccess';
    socket.events.ON_TRACK_CONNECTION_ERROR = 'onTrackConnectionError';

}());

/* global goinstant, runner */
(function () {

    var scope = this || {},
        connection,
        user;

    function init() {
        console.log("socketService:init");
        socket.on(socket.events.ON_USER_READY, onUserReady)
    }

    function connect() {
        console.log("socketService:connect");
        scope.isConnected = false;

        connection = new goinstant.Connection(socket.config.GOINSTANT_URL);
        connection.connect(user, onConnection)
    }

    function onUserReady(userInfo) {
        console.log("socketService:onUserReady");
        user = userInfo;
        connect();
    }

    function onConnection(err) {
        console.log("socketService:onConnection");
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

/* global runner */
(function () {

    var user,
        trackRoom;

    function init() {
        console.log("trackRoomService:init");
        socket.on(socket.events.ON_USER_READY, onUserReady);
        socket.on(socket.events.ON_CONNECTION_SUCCESS, onConnectionSuccess);
    }

    function onUserReady(userInfo) {
        console.log("trackRoomService:onUserRead");
        user = userInfo;
    }

    function onConnectionSuccess(connection) {
        console.log("trackRoomService:onConnectionSuccess");
        trackRoom = connection.room(user.getTrack());
        trackRoom.join().then(function (res) {
            socket.dispatch(socket.events.ON_TRACK_CONNECTION_SUCCESS, res.room);
        }, function (err) {
            socket.dispatch(socket.events.ON_TRACK_CONNECTION_ERROR, err);
        });
    }

    init();

}());

(function () {
    socket.on(socket.events.ON_TRACK_CONNECTION_SUCCESS, onTrackConnectionSuccess);
    console.log('what is ua', navigator.userAgent);
    socket.dispatch(socket.events.ON_USER_READY, {roomName: 'projA', user:device});
}());