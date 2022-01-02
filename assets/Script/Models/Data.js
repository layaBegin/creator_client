var Data = module.exports = {};

Data.init = function (datas) {
    this.setDatas(datas);
};

Data.getData = function (key) {
    return this[key];
};

Data.setDatas = function (properties) {
    for (let key in properties) {
        if (properties.hasOwnProperty(key)) {
            if (key == "regConfig" || key == "withdrawalSupport") {
                if (typeof (JSON.parse(properties[key])) == "object") {
                    for (let item in JSON.parse(properties[key])) {
                        if (key in this) {
                            this[key][item] = JSON.parse(properties[key])[item]
                        } else {
                            this[key] = {}
                            this[key][item] = JSON.parse(properties[key])[item]
                        }
                    }
                }
            } else {
                this[key] = properties[key];
            }
        }
    }
};