function Path() {
    var selected, root, values = [], pendingProgressChanges, lastStep;

    function setData(rootStep) {
        selected = root = rootStep;
    }

    function setPath(path) {
        var step = root;
        exports.each(path, function (pathIndex) {
//            csl.log(step, "%s.childIndex = %s", step.label, pathIndex);
            pathIndex = parseInt(pathIndex, 10);
            step.childIndex = pathIndex;
            step = step[stepsProp][pathIndex];
            values.push(pathIndex);
            selected = step;
            nextState(selected);
        });
//        csl.log(step, "values %s", values.join('.'));
    }

    function getPath(offShift) {
        if (offShift) {
            return values.slice(0, offShift);
        }
        return values;
    }

    function getSelected() {
        return selected;
    }

    function getDepth() {
        return values.length;
    }

    function next() {
        if (!selected) {
            select(root);
//            csl.log("\t%cRoot Start: %s", "color:#F90", selected.label);
        }
        if (selectNextChild() || selectNextSibling() || selectParent()) {
            return;
        }
        if (selected === root) {
//            csl.log(selected, "%cROOT: %s", "color:#F90", selected.label);
            return;
        } else {
            next();
        }
    }

    function uidToPath(step) {
        var path = step.uid.split('.'), i = 0, len = path.length - 1;
        path.shift();
        while (i < len) {
            path[i] = parseInt(path[i], 10);
            i += 1;
        }
        return path;
    }

    function select(step) {
        var parent, path = uidToPath(step), i = 0, len = path.length;
        parent = getStepFromPath(path, 0, root, -1);
        if (parent) {
            parent.childIndex = path[len - 1] || 0;
        }
        values.length = 0;
        while (i < len) {
            values[i] = path[i];
            i += 1;
        }
        selected = step;
        nextState(selected);
    }

    function selectNextChild() {
        var len = selected[stepsProp].length;
        if (selected.childIndex >= len) {
            return false;
        }
        if (len && selected.childIndex + 1 < len) {
            select(selected[stepsProp][selected.childIndex + 1]);
//            csl.log(selected, "%cgetNextChild: %s", "color:#F90", selected.label);
            return true;
        }
        selected.childrenComplete = true;
        return false;
    }

    function selectParent() {
        var step = getStepFromPath(values, 0, root, -1);
        if (step) {
            select(step);
//            csl.log(selected, "%cgetParent: %s", "color:#F90", selected.label);
            return true;
        }
        return false;
    }

    function selectNextSibling() {
        var step, len = values.length - 1;
        values[len] += 1;
        step = getStepFromPath(values, 0, root, 0);
        if (step) {
            select(step);
//            csl.log(selected, "%cgetNextSibling: %s", "color:#F90", selected.label);
            return true;
        } else {
            return selectParent();
        }
        return false;
    }

    function getStepFromPath(path, index, step, end) {
        step = step || root;
        index = index || 0;
        end = end || 0;
        var pathIndex = path[index];
        if (index >= path.length + end) {
            return step;
        }
        if (pathIndex !== undefined && step[stepsProp][pathIndex]) {
            step = step[stepsProp][pathIndex];
            return getStepFromPath(path, index + 1, step, end);
        }
        return null;
    }

    function getParentFrom(step) {
        var path = uidToPath(step);
        return path.length ? getStepFromPath(path, 0, root, -1) : root;
    }

    function getAllProgress() {
        var changed = [];
        _getAllProgress(root, null, null, changed);
        return changed;
    }

    function _getAllProgress(step, index, list, changed) {
        exports.each(step[stepsProp], _getAllProgress, changed);
        updateProgress(step, changed);
    }
//
    function getRunPercent(step) {
        var data = typeData[step.type], count = 0, limit = 0;
        if (data.preExec) {
            limit += 1;
            count += step.state === states.EXEC_CHILDREN || step.state === states.POST_EXEC || step.state === states.COMPLETE ? 1 : 0;
        }
        if (data.postExec) {
            limit += 1;
            count += step.state === states.COMPLETE ? 1 : 0;
        }
        return count / limit;
    }

    function getProgressChanges(step, changed) {
        changed = changed || (pendingProgressChanges && pendingProgressChanges.slice()) || [];
        step = step || getSelected();
        if (!step) {
            return;// there is no selected step.
        }
        if (pendingProgressChanges) {
            pendingProgressChanges = null;
        }
        updateProgress(step, changed);
        var parent = getParentFrom(step);
        if (parent && parent !== step) {
            getProgressChanges(parent, changed);
        }
        return changed;
    }

    function updateProgress(step, changed) {
        var len, childProgress, i = 0;
        if (step.state === states.COMPLETE) {
            step.progress = 1;
        } else {
            len = step[stepsProp].length;
            if (len && step.childIndex !== -1) {
                childProgress = 0;
                while (i <= step.childIndex && i < len) {
                    childProgress += step[stepsProp][i].progress;
                    i += 1;
                }
                childProgress += getRunPercent(step);
                len += 1;
                step.progress = childProgress / len; // add one for this item.
            } else {
                step.progress = getRunPercent(step);
            }
        }
        changed.push(step);
    }

    function getTime() {
        if (root) {
            var result = getStepTime(root),
                avg = result.complete ? result.time / result.complete : 0,
                estimate = result.total * avg;
            if (result.totalTime > estimate) {
                estimate = result.totalTime;
            }
            return Math.ceil((estimate - result.time) * 0.001);
        }
        return 0;
    }

    function getStepTime(step) {
        var complete = 0, total = 0, time = 0, totalTime = 0, result, i = 0, iLen = step[stepsProp].length;
        while (i < iLen) {
            if (step[stepsProp].length) {
                result = getStepTime(step[stepsProp][i]);
                complete += result.complete;
                total += result.total;
                time += result.time;
                totalTime += result.totalTime;
            }
            complete += step.state === states.COMPLETE ? 1 : 0;
            total += 1;
            time += step.time;
            totalTime += step.time || step.increment * 2;
            i += 1;
        }
        return {complete: complete, total: total, time: time, totalTime: totalTime};
    }

    this.setData = setData;
    this.setPath = setPath;
    this.getDepth = getDepth;
    this.next = function () {
        lastStep = getSelected();
        return next();
    };
    this.getLastStep = function () {
        return lastStep;
    };
    this.getSelected = getSelected;
    this.getPath = getPath;
    this.getProgressChanges = getProgressChanges;
    this.getAllProgress = getAllProgress;
    this.getTime = getTime;
    this.getParent = getParentFrom;
}