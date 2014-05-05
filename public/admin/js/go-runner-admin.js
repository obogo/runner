/*
* goRunner v.0.0.1
* (c) 2014, Obogo
* License: Obogo 2014. All Rights Reserved.
*/
(function(exports, global){
var ex = exports.runner = exports.runner || {};

ex.events = {
    START: "runner:start",
    RESET: "runner:reset",
    PROGRESS: "runner:progress",
    STEP_START: "runner:stepStart",
    STEP_UPDATE: "runner:stepUpdate",
    STEP_END: "runner:stepEnd",
    STEP_PAUSE: "runner:stepPause",
    DONE: "runner:done",
    START_RECORDING: "runner:startRecording",
    STOP_RECORDING: "runner:stopRecording"
};

function admin() {}
}(this.go = this.go || {}, function() {return this;}()));
