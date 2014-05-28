registerType(types.ROOT = 'root', function () {
    return {
        options: {},
        preExec: function () {
            return statuses.PASS;
        }
    };
});