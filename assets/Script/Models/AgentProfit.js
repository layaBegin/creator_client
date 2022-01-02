let AgentProfit = module.exports = {};

AgentProfit.init = function (data) {
    this.data = data;
    this.data.sort(function (a, b) {
        return a.proportion - b.proportion;
    }); /* 小到大 */
};

AgentProfit.getData = function () {
    return this.data;
};

AgentProfit.getProportionByNum = function (num) {
    let minData = this.data[0];

    for (let i = 0; i < this.data.length; i++) {
        let data = this.data[i];

        if (minData.min > data.min) {
            minData = data;
        }

        //达到最高
        if (data.max === -1) {
            if (num >= data.min) {
                return data;
            }
        }

        if (num >= data.min && num < data.max) {
            return data;
        }
    }

    return minData;
};