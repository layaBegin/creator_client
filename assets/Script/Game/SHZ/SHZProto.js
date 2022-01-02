/**
 * Created by cly on 17/6/28
 */
var proto = module.exports;

proto.ROB_START_NOTIFY = 301;		// 开始摇奖
proto.ROB_START_DICE_NOTIFY = 303;	// 摇色子
proto.ROB_START_MARY_NOTIFY = 304;	// 小玛丽
proto.ROB_RESULTS_PUSH = 401;		// 摇奖回复
proto.ROB_START_DICE_PUSH = 403;	// 摇色子
proto.ROB_START_MARY_PUSH = 404;	// 小玛丽
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
// 摇色子 1大 0和 -1 小
proto.gameStartdiceNotify = function (flag) {
    return {
        type: this.ROB_START_DICE_NOTIFY,
        data: {
            flag: flag
        }
    };
};
// 小玛丽
proto.gameStartMaryNotify = function () {
    return {
        type: this.ROB_START_MARY_NOTIFY,
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
// 摇奖回复比大小
proto.gameResultsdicePush = function (enddata) {
    return {
        type: this.ROB_START_DICE_PUSH,
        data: {
            enddata: enddata
        }
    };
};
// 摇奖回复小玛丽
proto.gameResultsMaryPush = function (enddata) {
    return {
        type: this.ROB_START_MARY_PUSH,
        data: {
            enddata: enddata
        }
    };
};
// 金币不足提示
proto.gameUserScorePush = function () {
    return {
        type: this.ROB_USER_SCORE_PUSH,
    };
};

