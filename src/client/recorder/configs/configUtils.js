var configUtils = (function () {
    var csl = new Logger("util", "color:#666666;");
    return {
        unselectableNodeTypes: ["HTML", "BODY"],
        getSelector: function (event) {
            var selector;
            if (configUtils.unselectableNodeTypes.indexOf(event.target.nodeName) !== -1) {
                csl.log("cannot get selector of " + event.target.nodeName);
            } else {
                selector = go.selector.get(event.target);
                csl.log("\tselector \"%s\"", selector);
                this.dispatch(ex.events.ADD_STEP, {type: event.type, selector: selector});
            }
        },
        hashchange: function (event) {
            csl.log("hash change not implemented yet");
        },
        locationchange: function (event) {
            csl.log("location change");
        }
    };
}());