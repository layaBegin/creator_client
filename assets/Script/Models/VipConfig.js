let VipConfig = module.exports = {};

VipConfig.init = function (data) {
    this.vipConfig = data.sort(VipConfig.sort('vipID'));
};


VipConfig.getVipInfo = function (vip) {
    for (let index = 0; index < this.vipConfig.length; index++) {
        if (this.vipConfig[index].vipID == vip) {
            return this.vipConfig[index]
        }
    }
};

//按数组某个字段排序
VipConfig.sort = function (property) {
    return function (a, b) {
        var value1 = a[property];
        var value2 = b[property];
        return value1 - value2;
    }
}