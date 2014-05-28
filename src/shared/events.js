ex.events = {
    admin: {
        START: "runner:start",
        STOP: "runner:stop",
        UPDATE: "runner:update",// not being used yet.
        RESET: "runner:reset",
        DONE: "runner:done",
        START_RECORDING: "runner:startRecording",
        STOP_RECORDING: "runner:stopRecording",
        LOAD_TEST: "runner:loadTest",
        REGISTER_SCENARIO: "runner:registerScenario"
    },
    runner: {
        ON_START: "runner:onStart",
        ON_STOP: "runner:onStop",
        ON_UPDATE: "runner:onUpdate",
        ON_RESET: "runner:onReset",
        ON_DONE: "runner:onDone",
        ON_START_RECORDING: "runner:onStartRecording",
        ON_STOP_RECORDING: "runner:onStopRecording",
        ON_LOAD_TEST: "runner:onLoadTest",
        ON_REGISTER_SCENARIO: "runner:onRegisterScenario"
    }
};