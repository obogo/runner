(function () {
    var csl = new Logger("trackRoomListeners", "color:#6633FF");
    function onTrackConnectionSuccess(trackRoom) {
        csl.log('Track connected');

        function listenToMessages(device) {
            // listen to each device for messages.
            var channelId = device.id.split(':').pop(),
                channel = trackRoom.channel(channelId);
            csl.log("connected on chanel %s", channelId);
            channel.on('message', function (data, context) {
                csl.log("message received from %s", device.id);
                var args = exports.util.array.toArray(data);
                rootScope.$broadcast.apply(rootScope, args);
            });
        }

        function listenToProgress(device) {
            var str = '/.users/' + device.id + '/progress';
            trackRoom.key(str).on('set', function (value, context) {
                csl.log("\tconsole update %s", value.percent);
            });
        }

        function addDevice(userInfo) {
            if (!userInfo.isAdmin) {
                if (!devices[userInfo.id]) {
                    csl.log("\tUser Joined %s", userInfo.displayName);
                    devices[userInfo.id] = userInfo;
                    listenToMessages(userInfo);
                    listenToProgress(userInfo);
                }
            }
        }

        function removeDevice(userInfo) {
            if (devices[userInfo.id]) {
                // turn off listening for device.
                trackRoom.channel(userInfo.id).off('message');
                delete devices[userInfo.id];
                csl.log("\tUser Left %s", userInfo.displayName);
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
                argsToObject = exports.extend.apply({arrayAsObject: true}, [
                    {},
                    args
                ]);
            csl.log("\tsendToDevice on channel %s %o", channelId, argsToObject);
            channel.message.apply(channel, [argsToObject]);
        }

        function mapEvents(event, method) {
            rootScope.$on(event, method);
        }

        // get alist of devices.
        trackRoom.users.get(function (err, usersInfo, context) {
            csl.log("TrackUsers.get() %o", usersInfo);
            exports.each(usersInfo, addDevice);
        });

        // listen for users joining and leaving the room.
        trackRoom.on('join', addDevice);
        trackRoom.on('leave', removeDevice);


        // :: Events ::

        // listen
        trackRoom.channel('public').on('message', function (data, context) {
            csl.log('message received on PUBLIC', data, context);
        });

        function setTrackOnDevices(event, track) {
            //TODO: Filter to only send to devices that we want.
            exports.each(devices, setTrackOnDevice, track);
        }

        function setTrackOnDevice(device, index, list, track) {
            var str = '/.users/' + device.id + '/track';
            trackRoom.key(str).set(track, function (err) {
                if (err) {
                    csl.log(err);
                }
            });
        }

        function setScenarioToDevices(event, scenario) {
            exports.each(devices, setScenarioToDevice, scenario);
        }

        function setScenarioToDevice(device, index, list, scenario) {
            var str = '/.users/' + device.id + '/scenarios';
            trackRoom.key(str).set(scenario, function (err) {
                if (err) {
                    csl.log(err);
                }
            });
        }

        mapEvents(ex.events.admin.START, sendMessageToDevices);
        mapEvents(ex.events.admin.STOP, sendMessageToDevices);
        mapEvents(ex.events.admin.RESET, sendMessageToDevices);
        mapEvents(ex.events.admin.START_RECORDING, sendMessageToDevices);
        mapEvents(ex.events.admin.STOP_RECORDING, sendMessageToDevices);

        mapEvents(ex.events.admin.LOAD_TEST, setTrackOnDevices);
        mapEvents(ex.events.admin.REGISTER_SCENARIO, setScenarioToDevices);

    }

    socket.on(socket.events.ON_TRACK_CONNECTION_SUCCESS, onTrackConnectionSuccess);
    csl.log('what is ua', navigator.userAgent);
    socket.dispatch(socket.events.ON_USER_READY, user);
    socket.dispatch(socket.events.ON_PROJECT_READY, project);
}());