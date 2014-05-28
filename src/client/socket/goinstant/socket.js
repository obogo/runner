//CLIENT
var socket = {},
    project = {
        name: 'ProjectA'
    },
    user = {
        displayName: 'My Device1',
//        id: 'device1',
        status: "init",
        progress: {
            stepUID: '',
            timeRemaining: '',
            percent: 0
        },
        error: {},
        ua: navigator.userAgent
    };

function onTrackConnectionSuccess(trackRoom) {
    console.log('Track connected');

    trackRoom.self().key('status').set('ready');

    var channelId = trackRoom._connection._user.id.split(':').pop(),
        channel = trackRoom.channel(channelId);
    console.log("listening on channel %s", channelId);

    // :: Events ::

    // listen to channel for that user.
    trackRoom.channel('public').on('message', function (data, context) {
        console.log('message received on PUBLIC', data, context);
    });

    channel.on('message', function (data, context) {
        console.log('message received on ' + channelId, data, context);
        var args = exports.util.array.toArray(data),
            event = args.shift(),
            key = event.split(':').pop();
        ex[key].apply(ex, args);
    });

    exports.each(ex.events.runner, function (evt) {
        ex.on(evt, function (evt) {
            // Note. You cannot send arrays. convert to objects.
            //TODO: The object is returning a null because of an Error.
            var args = exports.util.array.toArray(arguments),
                data = exports.extend.apply({arraysAsObject:true}, [{}, args]);
            console.log("\tsend to admin %o", data);
//            var root = ex.getRoot(),
//                data = {
//                    status: root.status,
//                    progress: {
//                        timeRemaining: root.timeLeft,
//                        percent: root.progress
//                    }
//                };
//            exports.extend(user, data);
//            trackRoom.key('steps').set({
//                somethingElse: 'here'
//            }, {
//                expire: 60000
//            });
//            channel.message({0:arguments[0], 1:data});
            channel.message.apply(channel, [{0:arguments[0], 1:data}]);
        });
    });

    // listen for set
    trackRoom.self().key('track').on('set', function (value, context) {
        console.log('Something changed!!!', value, context);
    });

}

//CONST
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
    };

    socket.config = {};
    socket.config.GOINSTANT_URL = 'https://goinstant.net/0fc17c9b2a8f/runner-dev';

    socket.events = {};
    socket.events.ON_USER_READY = 'onUserReady';
    socket.events.ON_PROJECT_READY = 'onProjectReady';
    socket.events.ON_CONNECTION_SUCCESS = 'onConnectionSuccess';
    socket.events.ON_CONNECTION_ERROR = 'onConnectionError';
    socket.events.ON_TRACK_CONNECTION_SUCCESS = 'onTrackConnectionSuccess';
    socket.events.ON_TRACK_CONNECTION_ERROR = 'onTrackConnectionError';

}());

/* global goinstant, runner */
// SOCKET SERVICE
(function () {

    var scope = this || {},
        connection,
        _user;

    function init() {
        console.log("socketService:init");
        socket.on(socket.events.ON_USER_READY, onUserReady);
    }

    function connect() {
        console.log("socketService:connect %o", _user);
        scope.isConnected = false;

        connection = new goinstant.Connection(socket.config.GOINSTANT_URL);
        connection.connect(user, onConnection);
    }

    function onUserReady(userData) {
        console.log("socketService:onUserReady");
        _user = userData;
        connect();
    }

    function onConnection(err) {
        console.log("socketService:onConnection");
        if (err) {
            scope.isConnected = false;
            console.log("socketService:onConnectionError %o", err);
            return socket.dispatch(socket.events.ON_CONNECTION_ERROR, err);
        }
        scope.isConnected = true;
        socket.dispatch(socket.events.ON_CONNECTION_SUCCESS, connection);
    }

    scope.isConnected = false;

    init();

}());

/* global runner */
//TRACK ROOM SERVICE
(function () {

    var _user,
        project,
        trackRoom;

    function init() {
        console.log("trackRoomService:init");
        socket.on(socket.events.ON_USER_READY, onUserReady);
        socket.on(socket.events.ON_PROJECT_READY, onProjectReady);
        socket.on(socket.events.ON_CONNECTION_SUCCESS, onConnectionSuccess);
    }

    function onUserReady(userData) {
        console.log("trackRoomService:onUserRead");
        _user = userData;
    }

    function onConnectionSuccess(connection) {
        console.log("trackRoomService:onConnectionSuccess", project.name);
        trackRoom = connection.room(project.name);
        trackRoom.join().then(function (res) {
            socket.dispatch(socket.events.ON_TRACK_CONNECTION_SUCCESS, res.room);
        }, function (err) {
            console.log("\tTrack Connection Error %o", err);
            socket.dispatch(socket.events.ON_TRACK_CONNECTION_ERROR, err);
        });
    }

    function onProjectReady(projectData) {
        console.log("trackRoomService:onProjectReady %o", projectData);
        project = projectData;
    }

    init();

}());

(function () {
    socket.on(socket.events.ON_TRACK_CONNECTION_SUCCESS, onTrackConnectionSuccess);
    console.log('what is ua', navigator.userAgent);
    socket.dispatch(socket.events.ON_USER_READY, user);
    socket.dispatch(socket.events.ON_PROJECT_READY, project);
}());
