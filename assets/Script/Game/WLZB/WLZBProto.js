/**
 * Created by cly on 17/6/28
 */
var proto = module.exports;

proto.ROB_START_NOTIFY = 301;		// 开始摇奖
proto.ROB_RESULTS_PUSH = 401;		// 摇奖回复
proto.ROB_START_WULONG_NOTIFY = 303;	// 五龙争霸请求
proto.ROB_START_WULONG_PUSH = 403;	// 五龙争霸回复
proto.ROB_USER_SCORE_PUSH = 402;	// 金币不足提示



// 开始摇奖
proto.gameStartNotify = function (baseMoneyCount) {
    return {
        type: this.ROB_START_NOTIFY,
        data: {
            baseMoneyCount: baseMoneyCount
        }
    };
};
// 摇奖回复九线
proto.gameResultsPush = function (enddata) {
    return {
        type: this.ROB_RESULTS_PUSH,
        data: {
            enddata: enddata
        }
    };
};
// 五龙争霸请求
proto.gameStartWuLongNotify = function (longindex) {
    return {
        type: this.ROB_START_WULONG_NOTIFY,
        data: {
            longindex: longindex
        }
    };
};
// 五龙争霸回复
proto.gameResultsWuLongPush = function (freetime) {
    return {
        type: this.ROB_START_WULONG_PUSH,
        data: {
            freetime: freetime
        }
    };
};
// 金币不足提示
proto.gameUserScorePush = function () {
    return {
        type: this.ROB_USER_SCORE_PUSH,
    };
};

