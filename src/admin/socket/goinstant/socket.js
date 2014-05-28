//ADMIN
var socket = {},
    project = {
        name: "ProjectA"
    },
    user = {
        displayName: 'Admin Panel',
        isAdmin: true,
        visible: false, // keeps from dispatching enter room and leave room events.
        ua: navigator.userAgent,
        tracks: {}
    },
    devices = {};

function onTrackConnectionSuccess(trackRoom) {
    console.log('Track connected');

    function addDevice(userInfo) {
        var channel, channelId;
        if (!userInfo.isAdmin) {
            if (!devices[userInfo.id]) {
                console.log("\tUser Joined %s", userInfo.displayName);
                devices[userInfo.id] = userInfo;
                // listen to each device for messages.
                channelId = userInfo.id.split(':').pop();
                channel = trackRoom.channel(channelId);
                console.log("connected on chanel %s", channelId);
                channel.on('message', function (data, context) {
                    console.log("message received from %s", userInfo.id);
                    var args = exports.util.array.toArray(data);
                    rootScope.$broadcast.apply(rootScope, args);
                });
            }
        }
    }

    function removeDevice(userInfo) {
        if (devices[userInfo.id]) {
            // turn off listening for device.
            trackRoom.channel(userInfo.id).off('message');
            delete devices[userInfo.id];
            console.log("\tUser Left %s", userInfo.displayName);
        }
    }

    function sendMessageToDevices(event) {
        var args = exports.util.array.toArray(arguments);
        //TODO: Filter to only send to devices that we want.
        exports.each(devices, sendMessageToDevice, args);
    }

    function sendMessageToDevice(device, index, list, args) {
        args[0] = args[0].name;
        var channelId = device.id.split(':').pop(),
            channel = trackRoom.channel(channelId),
            argsToObject = exports.extend.apply({arrayAsObject:true}, [{}, args]);
        console.log("\tsendToDevice on channel %s %o", channelId, argsToObject);
        channel.message.apply(channel, [argsToObject]);
    }

    function mapEvents(events, method) {
        rootScope.$on(events, method);
    }

    // get alist of devices.
    trackRoom.users.get(function (err, usersInfo, context) {
        console.log("TrackUsers.get() %o", usersInfo);
        exports.each(usersInfo, addDevice);
    });

    // listen for users joining and leaving the room.
    trackRoom.on('join', addDevice);
    trackRoom.on('leave', removeDevice);


    // :: Events ::

    // listen
    trackRoom.channel('public').on('message', function (data, context) {
        console.log('message received on PUBLIC', data, context);
    });

    function setTrackOnDevices(event, track) {
//        var args = exports.util.array.toArray(arguments);
        //TODO: Filter to only send to devices that we want.
        exports.each(devices, setTrackOnDevice, track);
    }

    function setTrackOnDevice(device, index, list, track) {
        var str = '/.users/' + device.id + '/track';
        trackRoom.key(str).set(track, function () {
            console.log("set param ", arguments);
        });
    }

    exports.each(ex.events.admin, function (event, payload) {
        if (event === ex.events.admin.LOAD_TEST) {
            //TODO: update device user data.
            mapEvents(event, setTrackOnDevices);
        } else {
            mapEvents(event, sendMessageToDevices);
        }
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
        user;

    function init() {
        console.log("socketService:init");
        socket.on(socket.events.ON_USER_READY, onUserReady);
    }

    function connect() {
        console.log("socketService:connect");
        scope.isConnected = false;

        connection = new goinstant.Connection(socket.config.GOINSTANT_URL);
        connection.connect(user, onConnection);
    }

    function onUserReady(userData) {
        console.log("socketService:onUserReady");
        user = userData;
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
//TRACK ROOM SERVICE
(function () {

    var project,
        trackRoom;

    function init() {
        console.log("trackRoomService:init");
        socket.on(socket.events.ON_USER_READY, onUserReady);
        socket.on(socket.events.ON_PROJECT_READY, onProjectReady);
        socket.on(socket.events.ON_CONNECTION_SUCCESS, onConnectionSuccess);
    }

    function onUserReady(projectInfo) {
        console.log("trackRoomService:onUserRead");
        project = projectInfo;
    }

    function onConnectionSuccess(connection) {
        console.log("trackRoomService:onConnectionSuccess");
        trackRoom = connection.room(project.name);
        trackRoom.join().then(function (res) {
            socket.dispatch(socket.events.ON_TRACK_CONNECTION_SUCCESS, res.room);
        }, function (err) {
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