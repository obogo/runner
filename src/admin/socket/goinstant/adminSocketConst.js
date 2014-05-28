var socket = {
        config: {
            GOINSTANT_URL: 'https://goinstant.net/0fc17c9b2a8f/runner-dev'
        },
        events: {
            ON_USER_READY: 'onUserReady',
            ON_CONNECTION_SUCCESS: 'onConnectionSuccess',
            ON_CONNECTION_ERROR: 'onConnectionError',
            ON_TRACK_CONNECTION_SUCCESS: 'onTrackConnectionSuccess',
            ON_TRACK_CONNECTION_ERROR: 'onTrackConnectionError'
        }
    },
    project = {
        name: "ProjectA"
    },
    user = {
        displayName: 'Admin Panel',
        isAdmin: true,
        visible: false, // keeps from dispatching enter room and leave room events.
        ua: navigator.userAgent,
        tracks: {},
        scenarios: {}
    },
    devices = {};