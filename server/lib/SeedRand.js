
SeedRand = function (seed, mode) {
    this.seed = seed || 1;
    this.mode = mode;
}

SeedRand.prototype.rand = function () {
    var x = Math.sin(this.seed) * 10000;
    this.seed += 10;
    var y = x - Math.floor(x);
    return this.mode ? Math.floor(y*this.mode) : y;
}

SeedRand.prototype.batch = function (num, unique) {
    unique = unique === undefined ? false: unique;
    if (unique && this.mode && num > this.mode) {
        throw new Error('Exceed mode limit');
    }
    var count = num;
    var map = {};
    var values = [];
    while (count) {
        var value = this.rand();
        if (unique && (value in map)) continue;
        map[value] = true;
        values.push(value);
        count--;
    }
    return values;
}
