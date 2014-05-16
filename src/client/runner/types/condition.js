(function () {
    function handleDependency(step) {
        var prevSibling = ex.getPrevSibling(step);
        if (prevSibling && (prevSibling.type === types.IF || prevSibling.type === types.ELSEIF)) {
            return prevSibling;
        }
        return null;
    }

    register(types.IF = 'if', {
            increment: 10,
            expectedTime: 50,
            maxTime: 500
        },
        function ifHandler(step) {
            return step.override || ex.statuses.PASS;
        }
    );
    register(types.ELSEIF = 'elseif', {
            increment: 10,
            expectedTime: 50,
            maxTime: 500
        },
        function elseIfHandler(step, dependency) {
            return step.override || ex.statuses.PASS;
        },
        handleDependency
    );
    register(types.ELSE = 'else', {
            increment: 10,
            expectedTime: 50,
            maxTime: 500
        },
        function elseHandler(step, dependency) {
            return step.override || ex.statuses.PASS;
        },
        handleDependency
    );
}());