function uidToPath(uid) {
    var path = uid.split('.'), i = 0, len = path.length - 1;
    path.shift();
    while (i < len) {
        path[i] = parseInt(path[i], 10);
        i += 1;
    }
    return path;
}