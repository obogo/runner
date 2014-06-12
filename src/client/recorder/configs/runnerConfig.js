var recorderConfig = function () {
    var self = {},
        mousePath = new MousePath(),
        button,
        getSelector = configUtils.getSelector.bind(self);

    function onMousePathFinish(event, path) {
        csl.log("onMousePathFinish");
        self.dispatch(ex.events.ADD_STEP, {type: 'mousePath', points: path});
    }

    exports.extend(self, {
//        eventTypes: [
//            //            "load",// needs to be separate
//            "mousedown",
//            "mouseup",
//            "click",
//            "mousemove",
//            "mouseout",
//            "mouseover",
//            "mouseenter",
//            "mouseleave",
//            "keydown",
//            "keyup",
//            "touchstart",
//            "touchmove",
//            "touchend",
//            "touchcancel"
//        ],
        eventMap: {
            "click": getSelector,
            "mousedown": [getSelector, mousePath.mouseDown],
            "mouseup": [getSelector, mousePath.mouseUp],
            "mousemove": mousePath.mouseMove,
            "mouseover": getSelector, //[getSelector,mousePath.mouseOver],
            "mouseout": getSelector, //[getSelector,mousePath.mouseOut],
            "mouseenter": getSelector,
            "mouseleave": getSelector
        },
        listeners: {}
    });

    self.listeners[ex.events.ON_RECORDER_INIT] = function (evt, inst) {
        button = doc.createElement('div');
        exports.extend(button.style, {
            position: 'absolute',
            top: '0px',
            right: '0px',
            backgroundColor: '#000000',
            color: '#FFFFFF',
            cornerRadius: '6px',
            padding: '2px',
            zIndex: 99999
        });
        button.addEventListener('click', function () {
            if (inst.isRecording()) {
                inst.stop();
            } else {
                inst.start();
            }
        });
        button.innerText = 'START';
        doc.body.appendChild(button);
    };

    self.listeners[ex.events.runner.ON_START_RECORDING] = function () {
        button.innerText = 'STOP';
    };

    self.listeners[ex.events.runner.ON_STOP_RECORDING] = function () {
        button.innerText = 'START';
    };

    mousePath.on(MousePath.events.PATH_COMPLETE, onMousePathFinish);

    dispatcher(self);
    return self;
}();