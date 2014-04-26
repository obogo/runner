function Path() {
    var selected, root, values = [], prop = 'children';

    function setData(rootStep) {
        selected = root = rootStep;
    }

    function setPath(path) {
        var step = root;
        exports.each(path, function (pathIndex) {
            console.log("%s.childIndex = %s", step.label, pathIndex);
            pathIndex = parseInt(pathIndex, 10);
            step.childIndex = pathIndex;
            step = step[prop][pathIndex];
            values.push(pathIndex);
            selected = step;
            selected.state = states.ENTERING;
        });
        console.log("values %s", values.join('.'));
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
            selected = root;
            selected.state = states.ENTERING;
            console.log("\t%cRoot Start: %s", "color:#F90", selected.label);
        }
        if (getNextChild() || getNextSibling() || getParent()) {
            return;
        }
        if (selected === root) {
            console.log("\t%cROOT: %s", "color:#F90", selected.label);
            return;
        } else {
            next();
        }
    }

    function getNextChild() {
        var len = selected.children.length;
        if (selected.childIndex >= len) {
            return false;
        }
        if (len && selected.childIndex + 1 < len) {
            selected.childIndex += 1;
            values.push(selected.childIndex);
            selected = selected.children[selected.childIndex];
            selected.state = states.ENTERING;
            console.log("\t%cgetNextChild: %s", "color:#F90", selected.label);
            return true;
        }
        selected.childrenComplete = true;
        return false;
    }

    function getParent() {
        var step = getStepFromPath(values, 0, root, -1);
        if (step) {
            values.pop();
            selected = step;
            selected.state = states.ENTERING;
            console.log("\t%cgetParent: %s", "color:#F90", selected.label);
            return true;
        }
        return false;
    }

    function getNextSibling() {
        var step, parent, len = values.length - 1;
        values[len] += 1;
        step = getStepFromPath(values);
        if (step) {
            parent = getStepFromPath(values, 0, root, -1);
            parent.childIndex = values[len];
            selected = step;
            selected.state = states.ENTERING;
            console.log("\t%cgetNextSibling: %s", "color:#F90", selected.label);
            return true;
        } else {
            return getParent();
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
        var path = step.uid.split('.');
        path.shift();
        path.pop();
        return path.length ? getStepFromPath(path) : root;
    }
//
    function getRunPercent(step) {
        return step.time > step.maxTime ? 1 : step.time / step.maxTime;
    }

    function getProgressChanges(step, changed) {
        changed = changed || [];
        step = step || getSelected();
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
            len = step.children.length;
            if (len && step.childIndex !== -1) {
                childProgress = 0;
                while (i <= step.childIndex && i < len) {
                    childProgress += step.children[i].progress;
                    i += 1;
                }
                childProgress += getRunPercent(step);
                step.progress = childProgress / (len + 1); // add one for this item.
            } else {
                step.progress = getRunPercent(step);
            }
        }
        changed.push(step);
    }

    this.setData = setData;
    this.setPath = setPath;
    this.getDepth = getDepth;
    this.next = next;
    this.getSelected = getSelected;
    this.getPath = getPath;
    this.getProgressChanges = getProgressChanges;
}