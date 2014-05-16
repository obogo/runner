function register(type, options, method, dependencyMethod) {
    if (typeConfigs[type]) {
        throw new Error(type + " is already registered");
    }
    types[type.toUpperCase()] = type;
    typeConfigs[type] = options;
    MethodAPI.prototype[type] = method;
    if (dependencyMethod) {
        MethodAPI.prototype[type + dependencyProp] = dependencyMethod;
    }
}