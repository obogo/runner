var registerAPI = {
    onStateChange: true,
    preExec: true,
    postExec: true,
    onError: true
};

function registerType(type, fn) {
    var data;
    if (typeConfigs[type]) {
        throw new Error(type + " is already registered");
    }
    types[type.toUpperCase()] = type;
    data = fn();
    typeConfigs[type] = data.options;
    typeData[type] = data;
    exports.each(data, function (value, key, list) {
        if (_.isArray(value)) {
            var method = value.pop();
            method.$inject = value;
            list[key] = method;
        } else {
            value.$inject = [];// otherwise we expect it to be a method.
        }
    });
}

function registerScenario(scenario) {
    var scn, parent, dict = scenarios;
    if (scenario.uid) {
        parent = ex.getParentOfType(scenario, types.SCENARIO);
        if (parent) {
            dict = parent.scenarios;
        }
    }
    scn = exportStep(scenario, true);
    if (dict[scn.name]) {
        throw new Error("Scenario " + scn.name + " is already registered");
    }
    dict[scn.name] = scn;
}

function unregisterScenario(step, name) {
    // move up the parent chain and see if it local before checking global.
    var parent = ex.getParentOfType(step, types.SCENARIO);
    while (parent) {
        if (parent.scenarios[name]) {
            delete scenarios[name];
            return;
        }
        parent = ex.getParentOfType(parent, types.SCENARIO);
    }
    delete scenarios[name];
}

function hasScenario(step, name) {
    return !!getScenario(step, name);
}

function getScenario(step, name) {
    // move up the parent chain and see if it local before checking global.
    var parent = ex.getParentOfType(step, types.SCENARIO);
    while (parent) {
        if (parent.scenarios[name]) {
            return parent.scenarios[name];
        }
        parent = ex.getParentOfType(parent, types.SCENARIO);
    }
    return scenarios[name];
}

ex.registerType = registerType;
ex.registerScenario = registerScenario;
ex.unregisterScenario = unregisterScenario;
ex.hasScenario = hasScenario;
ex.getScenario = getScenario;