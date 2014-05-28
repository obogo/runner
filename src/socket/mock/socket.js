var socket = {};
dispatcher(socket);
socket.config = {};
socket.config.GOINSTANT_URL = 'https://goinstant.net/0fc17c9b2a8f/runner-dev';
socket.events = {};
socket.events.ON_USER_READY = 'onUserReady';
socket.events.ON_CONNECTION_SUCCESS = 'onConnectionSuccess';
socket.events.ON_CONNECTION_ERROR = 'onConnectionError';
socket.events.ON_TRACK_CONNECTION_SUCCESS = 'onTrackConnectionSuccess';
socket.events.ON_TRACK_CONNECTION_ERROR = 'onTrackConnectionError';

/* global goinstant, runner */
(function () {

    var scope = this || {},
        connection,
        user;

    function init() {
        socket.on(socket.events.ON_USER_READY, onUserReady)
    }

    function connect() {
        scope.isConnected = false;
        setTimeout(onConnection);
    }

    function onUserReady(userInfo) {
        user = userInfo;
        connect();
    }

    function onConnection(err) {
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

    var user;

    function init() {
        console.log('init count');
        socket.on(socket.events.ON_USER_READY, onUserReady);
        socket.on(socket.events.ON_CONNECTION_SUCCESS, onConnectionSuccess);
    }

    function onUserReady(userInfo) {
        user = userInfo;
    }

    function onConnectionSuccess() {
        socket.dispatch(socket.events.ON_TRACK_CONNECTION_SUCCESS, {});
    }

    init();

}());


(function () {
    socket.on(socket.events.ON_TRACK_CONNECTION_SUCCESS, onTrackConnectionSuccess);
    console.log('what is ua', navigator.userAgent);
    socket.dispatch(socket.events.ON_USER_READY, {
        displayName: 'My Device1',
        ua: navigator.userAgent,
        getTrack: function () {
            return 'track1';
        }
    })
}());