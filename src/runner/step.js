function step(options, index, list, parentPath) {
    console.log("\tstep %s", options.label);
    parentPath = parentPath || '';
    var uid = (parentPath ? parentPath + '.' : '') + (index !== undefined ? index : 'R');
    var item = {
        uid: uid,
        index: index, // root will always have a negative index.
        label: '',
        type: 'step',// step, condition, find, etc.
        status: statuses.UNRESOLVED,
        state: states.WAITING,
        childIndex: -1,
        children: [], // children cannot have a parent reference because references cannot be passed.
        skipCount: 0,
        startTime: 0,
        endTime: 0,
        time: 0,
        increment: 50,
        expectedTime: 100, // for type:ajax calls do an expectation of 600ms by default.
        maxTime: 2000,
        progress: 0
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


//TODO: page transitions, ajax calls, socket calls, etc all should have different default expectedTimes.
//TODO: write to local storage and read for page transitions. That way we always have the data immediately.