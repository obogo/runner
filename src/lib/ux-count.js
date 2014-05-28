function count(item) {
    var i, c = 0;
    for (i in item) {
        if (item.hasOwnProperty(i)) {
            c += 1;
        }
    }
    return c;
}
ex.count = count;

function countAsArray(item) {
    var i = 0;
    while (item[i] !== undefined) {
        i += 1;
    }
    return i;
}
ex.countAsArray = countAsArray;