function Recorder() {
    function start() {
        this.dispatch(ex.events.START_RECORDING);
    }

    function stop() {
        this.dispatch(ex.events.STOP_RECORDING);
    }

    this.start = start;
    this.stop = stop;
}

ex.recorder = new Recorder();
dispatcher(ex.recorder);