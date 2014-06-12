var ex = exports.runner = exports.runner || {},
    win = window,
    doc = win.document;

ex.events = {
    ON_RECORDER_INIT: 'recorder:onInit',
    ADD_STEP: 'recorder:addStep'
};