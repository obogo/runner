function Path() {
    var selected, root, values = [], prop = 'children', pendingProgressChanges, lastStep;

    function setData(rootStep) {
        selected = root = rootStep;
    }

    function setPath(path) {
        var step = root;
        exports.each(path, function (pathIndex) {
            csl.log(step, "%s.childIndex = %s", step.label, pathIndex);
            pathIndex = parseInt(pathIndex, 10);
            step.childIndex = pathIndex;
            step = step[prop][pathIndex];
            values.push(pathIndex);
            selected = step;
            selected.state = states.ENTERING;
        });
        csl.log(step, "values %s", values.join('.'));
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
            csl.log("\t%cRoot Start: %s", "color:#F90", selected.label);
        }
        if (selectNextChild() || selectNextSibling() || selectParent()) {
            if (selected.status === statuses.SKIP) {
                next();
            }
            return;
        }
        if (selected === root) {
            csl.log(selected, "%cROOT: %s", "color:#F90", selected.label);
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
        selected.state = states.ENTERING;
    }

    function selectNextChild() {
        var len = selected.children.length;
        if (selected.status === statuses.SKIP || selected.childIndex >= len) {
            return false;
        }
        if (len && selected.childIndex + 1 < len) {
            select(selected.children[selected.childIndex + 1]);
            csl.log(selected, "%cgetNextChild: %s", "color:#F90", selected.label);
            return true;
        }
        selected.childrenComplete = true;
        return false;
    }

    function selectParent() {
        var step = getStepFromPath(values, 0, root, -1);
        if (step) {
            select(step);
            csl.log(selected, "%cgetParent: %s", "color:#F90", selected.label);
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
            csl.log(selected, "%cgetNextSibling: %s", "color:#F90", selected.label);
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
        if (pathIndex !== undefined && step.children[pathIndex]) {
            step = step.children[pathIndex];
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
        if (step.status === statuses.SKIP) {
            exports.each(step.children, skipStep);
        }
        exports.each(step.children, _getAllProgress, changed);
        updateProgress(step, changed);
    }
//
    function getRunPercent(step) {
        return step.status === statuses.PASS ? 1 : (step.time > step.maxTime ? 1 : step.time / step.maxTime);
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

    function storeProgressChanges(step) {
        pendingProgressChanges = getProgressChanges(step);
    }

    function updateProgress(step, changed) {
        var len, childProgress, i = 0;
        if (step.status === statuses.SKIP) {
            step.progress = 0;
            return;
        }
        if (step.state === states.COMPLETE) {
            step.progress = 1;
        } else {
            len = step.children.length;
            if (len && step.childIndex !== -1) {
                childProgress = 0;
                step.skipCount = 0;
                while (i <= step.childIndex && i < len) {
                    if (step.children[i].status != statuses.SKIP) {
                        childProgress += step.children[i].progress;
                    } else {
                        step.skipCount += 1;
                    }
                    i += 1;
                }
                childProgress += getRunPercent(step);
                step.progress = childProgress / (len - step.skipCount + (step.type !== types.ROOT ? 1 : 0)); // add one for this item.
            } else {
                step.progress = getRunPercent(step);
            }
        }
        changed.push(step);
    }

    function skipBlock() {
        if (selected.type === types.IF || selected.type === types.ELSEIF || selected.type === types.ELSE) {
            var parent = getStepFromPath(values, 0, root, -1);
            if (selected.type === types.ELSEIF || selected.type === types.ELSE) {
                skipPreDependentChildCondition(parent);
            }
            if (selected.type === types.IF || selected.type === types.ELSEIF) {
                skipPostDependentCondition(parent);
            }
        }
    }

    function skipPreDependentChildCondition(parent) {
        var j = parent.childIndex - 1, jLen = 0;
        while (j >= jLen) {
            var s = parent.children[j];
            if (s.type === types.IF || s.type === types.ELSEIF) {
                skipStep(s);
            } else {
                break;
            }
            j -= 1;
        }
    }

    function skipPostDependentCondition(parent) {
        var i = parent.childIndex + 1, iLen = parent.children.length;
        while (i < iLen) {
            var s = parent.children[i];
            if (s.type === types.ELSEIF || s.type === types.ELSE) {
                skipStep(s);
            } else {
                break;
            }
            i += 1;
        }
    }

    function skipStep(step) {
        if (step.status !== statuses.SKIP) {
            csl.log(step, "%cSKIP %s", "color:#FF6600", step.uid);
            step.status = statuses.SKIP;
            storeProgressChanges(step);
        }
    }

    function isCondition(step) {
        return step.type === types.IF || step.type === types.ELSEIF || step.type === types.ELSE;
    }

    function getTime() {
        var result = getStepTime(root),
            avg = result.complete ? result.time / result.complete : 0,
            estimate = result.total * avg;
        if (result.totalTime > estimate) {
            estimate = result.totalTime;
        }
        return Math.ceil((estimate - result.time) * 0.001);
    }

    function getStepTime(step) {
        var complete = 0, total = 0, time = 0, totalTime = 0, result, i = 0, iLen = step.children.length;
        while (i < iLen) {
            if (step.children.length) {
                result = getStepTime(step.children[i]);
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
    this.skipBlock = skipBlock;
    this.isCondition = isCondition;
    this.getTime = getTime;
}