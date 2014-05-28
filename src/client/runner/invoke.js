// we expect a $inject to be on the method.
function invoke(fn, scope, locals) {
    if (!fn.$inject) {
        fn.$inject = getInjectionArgs(fn);
    }
    var args = fn.$inject.slice();
    exports.each(args, getInjection, scope, locals);
    return fn.apply(scope, args);
}

function getInjectionArgs(fn) {
    var str = fn.toString();
    return str.match(/\(.*\)/)[0].match(/([\$\w])+/gm);
}

function getInjection(type, index, list, step, locals) {
    var result;
    if (types[type.toUpperCase()]) {
        result = ex.getParentOfType(step, type);
    } else if (locals && locals[type]) {
        result = locals[type];
    }
    list[index] = result;
}
