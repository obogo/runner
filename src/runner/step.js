function step(options, index, list, parentPath) {
    console.log("\tstep %s", options.label);
    parentPath = parentPath || '';
    var uid = (parentPath ? parentPath + '.' : '') + (index !== undefined ? index : 'R');
    var item = {
        uid: uid,
        index: index, // root will always have a negative index.
        label: '',
        type: 'step',// step, condition, find, etc.
        selector: '', // we cannot pass elements, so we pass the selector.
        check: '',
        pass: false,
        childIndex: -1,
        children: [], // children cannot have a parent reference because references cannot be passed.
        startTime: 0,
        time: 0,
        increment: 100,
        maxTime: 2000,
        progress: 0,
        state: states.WAITING
    };
    exports.extend(item, options);
    if (list) list[index] = item;
    if (item.children.length) {
        exports.each(item.children, step, uid);
    }
    if (!list) {
        return item;// so root can be created.
    }
}