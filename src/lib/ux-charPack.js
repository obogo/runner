exports.charPack = function (c, len) {
    var s = '';
    while (s.length < len) { s += c; }
    return s;
};