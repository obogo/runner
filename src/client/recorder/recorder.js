function Recorder() {
    function start() {
        this.dispatch(ex.events.admin.START_RECORDING);
    }

    function stop() {
        this.dispatch(ex.events.admin.STOP_RECORDING);
    }

    this.start = start;
    this.stop = stop;

    // catch all events.
    doc.body.handleEvent(function (event) {
        console.log(event);
    });
}

ex.recorder = new Recorder();
dispatcher(ex.recorder);