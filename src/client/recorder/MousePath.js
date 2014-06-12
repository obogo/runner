var mousePathEvents = {PATH_COMPLETE: "mousePath:pathComplete"};
function MousePath() {
    var self = this,
        paths = [],
        path,
        target,
        csl = new Logger("MousePath", "color:#00FF00");

    //Point
    function Point(x, y) {
        this.x = x;
        this.y = y;
        this.start = Date.now();
        this.duration = 0;
    }

    //Path
    function Path() {
        this.points = [];
    }
    Path.prototype.eventToPoint = function (event) {
        if (event.pageX !== undefined) {
            return new Point(event.pageX, event.pageY);
        } else if (!event.start) {
            return new Point(event.x, event.y);
        }
        return event;
    };
    Path.prototype.add = function (pt) {
        pt = this.eventToPoint(pt);
        this.points.push(pt);
    };
    Path.prototype.getLastPoint = function () {
        var len = this.points.length;
        return len && this.points[len - 1] || null;
    };
    Path.prototype.close = function () {
        exports.each(this.points, this.closePoint);
    };
    Path.prototype.closePoint = function (pt, index, list) {
        var next = list[index + 1];
        if (next) {
            pt.duration = next.start - pt.start;
        } else {
            pt.duration = 1;// for the last one. It may need to pause for longer to show a click.
        }
        delete pt.start;
    };

    // MousePath Methods.
    function startPath(event) {
        closePath();
        path = new Path();
        path.add(event);
        paths.push(path);
        target = event.target;
        csl.log("start path %s", paths.length);
    }

    function closePath() {
        if (path) {
            csl.log("close path %s", paths.length);
            path.points = exports.simplify(path.points, 4.95, true);
            path.close();
            // if it only get's one point. We don't want it.
            if (path.length > 1) {
                self.dispatch(mousePathEvents.PATH_COMPLETE, path.points);
            }
        }
        path = null;
        // This is just here for debugging.
//        draw();
    }

    function mouseDown(event) {
        startPath(event);
    }

    function mouseUp(event) {
        closePath();
    }

    function mouseMove(event) {
    //TODO: should this use querySelectorAll and get all of them. or only the first one.
        if (!hover() && !path) {
            startPath(event);
        } else {
            path.add(event);
        }
    }

    function hover() {
        var hvr = doc.body.querySelector(':hover');
        if (hvr && target !== hvr) {
            csl.log("\thover detected");
            closePath();
            startPath({target: hvr});
            return true;
        }
        return false;
    }

    function mouseOver(event) {
        if (event.target !== target) {
            closePath();
            startPath(event);
        }
    }

    function mouseOut(event) {
        if (event.target !== target) {
            closePath();
        }
    }

    function draw() {
        var result = {str:''},
            div = doc.querySelector('.mousePointsDom');
        if (!div) {
            div = doc.createElement('div');
            div.className = 'mousePointsDom';
            div.style.width = "100%";
            div.style.height = "100%";
            div.style.position = "absolute";
            div.style.top = "0px";
            div.style.left = "0px";
            doc.body.appendChild(div);
        }

        exports.each(paths, function (path) {
            exports.each(path.points, pointToDom, result);
        });
        div.innerHTML = result.str;
    }

    function pointToDom(pt, index, list, result) {
        result.str += '<div title="' + index + '" style="position:absolute;top:' + (pt.y - 1) + 'px;left:' + (pt.x - 1) + 'px;width:3px;height:3px;background-color:#FF0000;"></div>';
    }

    self.mouseDown = mouseDown;
    self.mouseUp = mouseUp;
    self.mouseMove = mouseMove;
    self.mouseOver = mouseOver;
    self.mouseOut = mouseOut;
    dispatcher(self);
}
MousePath.events = mousePathEvents;