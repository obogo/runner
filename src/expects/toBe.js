ex.elementMethods.push(function (target) {
    target.toBe = function (value) {
        var s = {
            label: "toBe " + value,
            value: undefined,
            timeout: ex.locals.options.interval,
            method: function () {
            },
            validate: function () {
                var result = $.trim(target.value) === value;
                if (!result) {
                    s.label = "expected \"" + target.value + "\" to be \"" + value + "\"";
                } else {
                    s.label = "toBe \"" + value + "\"";
                }
                return result;
            }
        };
        return ex.createElementStep(s, target);
    };
});