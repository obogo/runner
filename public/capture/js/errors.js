function start() {
    level0();
}
function level0() {
//    level1();
    go.runner.recorder.try(level1, ['a', 'b'], this);
}
function level1() {
    // throw random error
//    throw new Error("Oops!");
    doSomeAjax();
}

function doSomeAjax() {
    var a = new RawAjax();
    a.get({
        url: 'files/test.json',
        data: 'test=1',
        success: function () {
            console.log("got success");
            throw new Error("Oops! AFTER AJAX!!!");
        },
        error: function (e) {
            console.log("got error");
        }
    });
}

function RawAjax() {
    this.config = {responseType: 'json', async: true, success: function () {
    }, error: function () {
    }};
}
RawAjax.prototype.get = function (config) {
    config.method = "GET";
    return this.fetch(config);
};
RawAjax.prototype.post = function (config) {
    config.method = "POST";
    return this.fetch(config);
};

RawAjax.prototype.fetch = function (config) {
    var self = this, xhr;
    for (var i in config) {
        if (config.hasOwnProperty(i)) {
            this.config[i] = config[i];
        }
    }
    // if browser suports XMLHttpRequest
    if (window.XMLHttpRequest) {
        // Cretes a instantce of XMLHttpRequest object
        xhr = new XMLHttpRequest();
    } else {
        // for IE 5/6
        xhr = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                config.success(xhr.responseText);
            } else {
                config.error(xhr.statusText, xhr.responseText);
            }
        }
    };
    self.progress = 0;
    xhr.upload.addEventListener("progress", function (evt) {
        if (evt.lengthComputable) {
            self.progress = evt.loaded / evt.total;
            console.log("progress", self.progress);
        }
    }, false);
    xhr.open(this.config.method, this.config.url, this.config.async);
    for (var i in this.config.headers) {
        if (this.config.headers.hasOwnProperty(i)) {
            xhr.setRequestHeader(i, this.config.headers[i]);
        }
    }
    xhr.send(config.data);
    this.xhr = xhr;
};