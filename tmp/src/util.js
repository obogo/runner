ex.util = (function () {

    var self, win = window;
    function RunnerUtil() {
        self = this;
        self.pending = false;
        self.files = [];
    }
    RunnerUtil.prototype.loadJSFile = function loadJSFile(src) {
        if (!self.pending) {
            if (win.document.readyState !== "complete") {
                win.addEventListener('readystate', function () {
                    loadFile(win, src);
                });
            } else {
                loadFile(win, src);
            }
        } else {
            self.files.push([win, src]);
        }
    };
    RunnerUtil.prototype.onFilesLoaded = function (fn) {
        self.callback = fn;
    };

    function loadFile(win, src) {
        ex.proxy.log("loading %s", src);
        self.pending = true;
        var se = win.document.createElement('script');
        se.type = "text/javascript";
        se.onload = function () {
            console.log("\tloaded %s", src);
            self.pending = false;
            if (self.files.length) {
                loadFile.apply(self, self.files.shift());
            } else if (!self.files.length && self.callback) {
                self.callback();
            }
        };
        se.src = src;
        win.document.getElementsByTagName('body')[0].appendChild(se);
    }

    return new RunnerUtil();
}());