var proto = module.exports;

// 奔驰宝马
//-----------------------------玩家操作----------------------------------------
proto.GAME_POURGOLD_NOTIFY = 301;		// 下注通知
proto.GAME_POURGOLD_PUSH = 401;		// 下注推送

//-----------------------------游戏状态----------------------------------------
proto.GAME_START_PUSH = 402;		// 游戏开始通知(下注)
proto.GAME_RESULT_PUSH = 403;		// 游戏结果推送

//-----------------------------游戏状态----------------------------------------
proto.gameStatus = {
  NONE: 0,
  GAME_STARTED: 1,
  GAME_END: 2
};
proto.startTotaltime = 15;

//-----------------------------下注方位----------------------------------------
proto.DZ = 0;		// 大众
proto.BC = 1;		// 奔驰
proto.BM = 2;		// 宝马
proto.BSJ = 3;	// 保时捷
proto.DDZ = 4;		// 大大众
proto.DBC = 5;		// 大奔驰
proto.DBM = 6;		// 大宝马
proto.DBSJ = 7;	// 大保时捷

proto.REDLIMIT_ERROR = 404; //限红错误 超出最大值或者最低最小值

//压注超过限红提示
proto.getRedLimitErrorData = function () {
  return {
    type: this.REDLIMIT_ERROR
  };
};

// 下注推送
proto.gameStartPush = function (time) {
  return {
    type: this.GAME_START_PUSH,
    data: {
      statusTime: time
    }
  };
};

// 游戏结果推送
proto.gameResultPush = function (scoreChangeArr, Resultindex, time, profitPercentage, baseScoreArr) {
  return {
    type: this.GAME_RESULT_PUSH,
    data: {
      Resultindex: Resultindex,
      scoreChangeArr: scoreChangeArr,
      Statustime: time,
      profitPercentage: profitPercentage,
      baseScoreArr: baseScoreArr
    }
  };
};

// 下注通知
proto.gameUserBetNotify = function (betType, count) {
  return {
    type: this.GAME_POURGOLD_NOTIFY,
    data: {
      betType: betType,
      count: count
    }
  };
};

// 下注通知
proto.gameUserBetPush = function (uid, betType, count) {
  return {
    type: this.GAME_POURGOLD_PUSH,
    data: {
      uid: uid,
      betType: betType,
      count: count
    }
  };
};