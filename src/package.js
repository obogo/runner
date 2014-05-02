var ex = exports.runner = exports.runner || {};
ex.events = {
    START: "runner:start",
    RESET: "runner:reset",
    PROGRESS: "runner:progress",
    STEP_START: "runner:stepStart",
    STEP_UPDATE: "runner:stepUpdate",
    STEP_END: "runner:stepEnd",
    STEP_PAUSE: "runner:stepPause",
    DONE: 'runner:done',
    START_RECORDING: "runner:startRecording",
    STOP_RECORDING: "runner:stopRecording"
};