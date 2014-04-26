angular.module('ux').controller('runnerUICtrl', function ($scope) {

    var stepDictionary;
    $scope.items = [];
    $scope.recording = false;
    $scope.playing = false;

    $scope.toggle = function (key) {
        $scope[key] = !$scope[key];
        $scope.$emit(key + ($scope[key] ? '-on' : '-off'));
    };

    $scope.$on('playing-on', function () {
        console.log('play');
        ux.runner.proxy.$call($scope.items.length ? 'ux.runner.resume' : 'ux.runner.run');
    });

    $scope.$on('playing-off', function () {
        console.log('stop');
        ux.runner.proxy.$call('ux.runner.pause');
    });

    $scope.$on('recording-on', function () {
        console.log('recording-on');
        ux.runner.proxy.$call('ux.runner.recorder.start');
    });

    $scope.$on('recording-off', function () {
        console.log('recording-off');
        ux.runner.proxy.$call('ux.runner.recorder.stop');
    });

    function getStep(step) {
        var s = stepDictionary[step.id] || step, i;// combine start with close events.
        if (s !== step) {
            for (i in step) {
                s[i] = step[i];
            }
        }
        return s;
    }

    function onStep(event, step) {
        step = getStep(step);
        if (!stepDictionary[step.id]) {
            $scope.items.push(step);
            stepDictionary[step.id] = step;
        }
        $scope.$apply();
    }

    $scope.$on(ux.runner.events.START, function (event, step) {
        $scope.items = [];
        stepDictionary = {};
        $scope.playing = true;
        onStep(event, {label:"START"});
    });

    $scope.$on(ux.runner.events.STEP_START, onStep);

    $scope.$on(ux.runner.events.STEP_UPDATE, onStep);

    $scope.$on(ux.runner.events.STEP_END, onStep);

    $scope.$on(ux.runner.events.STEP_PAUSE, onStep);

    $scope.$on(ux.runner.events.DONE, function (event) {
        $scope.playing = false;
        onStep(event, {label: "DONE"});
    });

//    function addBinds() {
//        ex.on(ex.events.START, start);
//        ex.on(ex.events.STEP_START, stepStart);
//        ex.on(ex.events.STEP_UPDATE, stepUpdate);
//        ex.on(ex.events.STEP_END, stepEnd);
//        ex.on(ex.events.STEP_PAUSE, stepPause);
//        ex.on(ex.events.DONE, done);
//        $('.runner-close').click(ex.stop);
//        $('.runner-restart').click(restart);
//        $('.runner-pause').click(ex.pause);
//        $('.runner-next').click(ex.next);
//        $('.runner-resume').click(ex.resume);
//        $('.runner-details').click(toggleDetails);
//        $('.runner-minimize').click(toggleMinimize);
//        $('.runner-plus').click(plus);
//        $('.runner-minus').click(minus);
//    }
//
//    function removeBinds() {
//        ex.off(ex.events.START, start);
//        ex.off(ex.events.STEP_START, stepStart);
//        ex.off(ex.events.STEP_UPDATE, stepUpdate);
//        ex.off(ex.events.STEP_END, stepEnd);
//        ex.off(ex.events.STEP_PAUSE, stepPause);
//        ex.off(ex.events.DONE, done);
//        $('.runner-close').unbind('click', ex.stop);
//        $('.runner-restart').unbind('click', restart);
//        $('.runner-pause').unbind('click', ex.pause);
//        $('.runner-next').unbind('click', ex.next);
//        $('.runner-resume').unbind('click', ex.resume);
//        $('.runner-details').unbind('click', toggleDetails);
//        $('.runner-minimize').unbind('click', toggleMinimize);
//        $('.runner-plus').unbind('click', plus);
//        $('.runner-minus').unbind('click', minus);
//    }
//
//    exports.start = start;
//    exports.stepStart = stepStart;
//    exports.stepEnd = stepEnd;
//    exports.done = done;
//    ex.stop = close;
//    ex.onStart = start;

//    return exports;
});