var model = module.exports;
var NNProto = require('./NNProto');
var RoomProto = require('../../API/RoomProto');


model.setEntryRoomData = function (msg) {


	var data = msg.gameData;
	this.Maxcallbanker = data.Maxcallbanker || null;
	this.addscoresArr = data.addscoresArr || null;
	this.canPourScoreArr = data.canPourScoreArr;
	if (data.Statustime)
		this.Statustime = data.Statustime;
	this.kindId = msg.kindId;
	// 游戏数据,随时可恢复场景
	this.userArr = msg.roomUserInfoArr;
	this.gameRule = data.gameRule;
	this.baseScore = this.gameRule.baseScore;
	this.curBureau = data.curBureau;
	this.roomId = data.roomId;
	this.gameStatus = data.gameStatus;
	this.bankChairId = data.bankChairId;
	this.robBankArr = data.robBankArr;

	this.pourScoreArr = data.pourScoreArr;
	this.showCardArr = data.showCardArr;
	if (this.gameStatus === NNProto.GAME_STATUS_RESOUT) {
		this.cardsArr = data.resout.cardsArr;
	} else {
		this.cardsArr = data.cardsArr;
	}
	if (data.resout)
		this.finalScoreArr = data.resout.finalScoreArr;
	this.gameStartChairIdArr = data.gameStartChairIdArr;
	this.profitPercentage = data.profitPercentage;

	var i;
	if (!this.showCardArr || this.showCardArr.length === 0) {
		this.showCardArr = [];
		for (i = 0; i < this.gameRule.memberCount; ++i) {
			this.showCardArr[i] = 0;
		}
	}

	this.myUid = Global.Player.getPy('uid');
	for (i = 0; i < this.userArr.length; ++i) {
		if (this.userArr[i].userInfo.uid === this.myUid) {
			this.myChairId = this.userArr[i].chairId;
			cc.log("=====myChairId:", this.myChairId);
			let myIndex = this.getChairIdIndex(this.myChairId);
			this.userArr[i].userInfo.nickname = this.userArr[i].userInfo.nickname;
			if (data.cardsArr && data.cardsArr.length >= myIndex)
				this.cardArr = data.cardsArr[myIndex] || [];

		} else {
			this.userArr[i].userInfo.nickname = Global.Player.convertNickname(this.userArr[i].userInfo.nickname);
		}

	}
	Global.MessageCallback.addListener('RoomMessagePush', this);
	Global.MessageCallback.addListener('GameMessagePush', this);
};


model.setGameData = function (data) {
	for (var key in data) {
		if (data.hasOwnProperty(key) && this.hasOwnProperty(key)) {
			this[key] = data[key];
		}
	}
};

// 游戏未开始时的数据
model.clearGameData = function () {
	var memberCount = this.gameRule.memberCount;
	this.cardsArr = [];
	this.pourScoreArr = [];
	this.showCardArr = [];
	for (var i = 0; i < memberCount; ++i) {
		this.pourScoreArr[i] = 0;
		this.showCardArr[i] = 0;
		this.cardsArr[i] = [];
	}
};

model.messageCallbackHandler = function (router, msg) {
	if (router === 'RoomMessagePush') {
		if (msg.type === RoomProto.OTHER_USER_ENTRY_ROOM_PUSH) {
			this.addPlayer(msg.data.roomUserInfo);
		} else if (msg.type === RoomProto.USER_LEAVE_ROOM_PUSH) {
			this.delPlayer(msg.data.roomUserInfo);
			if (msg.data.roomUserInfo.chairId === this.myChairId) {
				this.onDestroy();
			}
		} else if (msg.type === RoomProto.USER_READY_PUSH) {
			this.answerUserReadyPush(msg.data.chairId);
		} else if (msg.type === RoomProto.GET_ROOM_SCENE_INFO_PUSH) {
			GameConfig.initGameRooms([msg.data.gameTypeInfo])
			this.answerRoomSceneInfoPush(msg.data);
		} else if (msg.type === RoomProto.ROOM_DISMISS_PUSH) {
			this.answerRoomDismissPush(msg.data.reason);
		}
	} else if (router === 'GameMessagePush') {
		if (msg.type === NNProto.MAX_CALL_BANKER_PUSH) {
			this.Maxcallbanker = msg.data.Maxcallbanker;
		} else if (msg.type === NNProto.CAN_POUR_SCORE_PUSH) {
			this.answerCanPourScorePush(msg.data.gameStatus, msg.data.addscoresArr);
		} else if (msg.type === NNProto.POUR_SCORE_PUSH) {
			this.answerPourScorePush(msg.data.chairId, msg.data.score);
		} else if (msg.type === NNProto.SHOW_CARD_PUSH) {
			this.answerShowCardPush(msg.data.chairId, msg.data.cardArr);
		} else if (msg.type === NNProto.RESOUT_CARD_PUSH) {
			this.answerResoutCardPush(msg.data.chairId, msg.data.cardArr);
		} else if (msg.type === NNProto.GAME_RESOUT_PUSH) {
			this.answerGameResoutPush(msg.data.bankIndex, msg.data.cardsArr, msg.data.finalScoreArr, msg.data.profitPercentage);
		} else if (msg.type === NNProto.GAME_STATUS_PUSH) {
			this.answerGameStatusPush(msg.data.gameStatus);
		} else if (msg.type === NNProto.BANK_CHANGE_PUSH) {
			this.answerBankChangePush(msg.data.bankChairId, msg.data.gameStatus, msg.data.robBankArr);
		} else if (msg.type === NNProto.ROB_RATE_BANK_PUSH) {
			this.answerRobRateBank(msg.data.chairId, msg.data.rate);
		}

	}
};


model.answerCanPourScorePush = function (gameStatus, scoresArr) {
	this.clearGameData();
	this.gameStatus = gameStatus;
	this.addscoresArr = scoresArr;
};

model.answerPourScorePush = function (chairId, score) {
	this.pourScoreArr[chairId] = score;
};

model.answerShowCardPush = function (chairId, cardArr) {
	var chairIndex = this.getChairIdIndex(chairId);
	this.showCardArr[chairId] = 1;
	this.cardsArr[chairIndex] = cardArr;
};

model.answerResoutCardPush = function (chairId, cardArr) {
	if (chairId === this.myChairId) {
		this.setMyCardArr(cardArr);
	}
};

model.answerGameResoutPush = function (bankIndex, cardsArr, finalScoreArr, profitPercentage) {
	this.bankChairId = this.getChairIdByIndex(bankIndex);
	this.cardsArr = cardsArr;
	++this.curBureau;
	this.bankChairId = null;
	this.profitPercentage = profitPercentage; //更新分数
	console.log(this.gameStartChairIdArr, this.userArr);
	for (var i = 0; i < finalScoreArr.length; ++i) {
		var player = this.getPlayerByChairId(this.gameStartChairIdArr[i]);
		if (!(!!player)) return;
		if (finalScoreArr[i] > 0) {
			player.userInfo.gold += finalScoreArr[i] * (1 - this.getProfitPercentage());
		} else {
			player.userInfo.gold += finalScoreArr[i];
		}
		if ((player.userStatus & RoomProto.userStatusEnum.READY) > 0) {
			player.userStatus -= RoomProto.userStatusEnum.READY;
		}
	}
};

model.answerGameStatusPush = function (gameStatus) {
	this.gameStatus = gameStatus;
	var i;
	if (this.gameStatus === NNProto.GAME_STATUS_ROBBANK) {
		this.gameRule.memberCount = this.gameStartChairIdArr.length;
		for (i = 0; i < this.gameRule.memberCount; ++i) {
			this.robBankArr[i] = -1;
		}
		this.recordGameStartChairId();
	} else if (this.gameStatus === NNProto.GAME_STATUS_POURSCORE) {
		this.pourScoreArr = [];
		for (i = 0; i < this.gameRule.memberCount; ++i) {
			this.pourScoreArr[i] = 0;
		}
	} else if (this.gameStatus === NNProto.GAME_STATUS_SORTCARD) {
		this.cardsArr = [];
		for (i = 0; i < this.gameRule.memberCount; ++i) {
			this.cardsArr[i] = [];
		}
	}
};

model.answerBankChangePush = function (bankChairId, gameStatus, robBankArr) {
	this.bankChairId = bankChairId;
	this.robBankArr = robBankArr;
	this.answerGameStatusPush(gameStatus);
};

model.answerRobRateBank = function (chairId, rate) {
	this.robBankArr[chairId] = rate;
};

model.answerUserReadyPush = function (chairId) {
	var player = this.getPlayerByChairId(chairId);
	if (player) {
		player.userStatus |= RoomProto.userStatusEnum.READY;
	}
};

model.answerRoomDismissPush = function (reason) {
	this.onDestroy();
};

model.getProfitPercentage = function () {
	return this.profitPercentage / 100;
};

model.getRobBankArr = function () {
	return this.robBankArr;
};

model.getCardsArr = function () {
	return this.cardsArr;
};

model.getPourScoreArr = function () {
	return this.pourScoreArr;
};

model.getGameRule = function () {
	return this.gameRule;
};

model.getGameStatus = function () {
	return this.gameStatus;
};

model.getShowCardArr = function () {
	return this.showCardArr;
};

model.getCanPourScoreArr = function () {
	return this.canPourScoreArr;
};

model.onDestroy = function () {
	Global.MessageCallback.removeListener('RoomMessagePush', this);
	Global.MessageCallback.removeListener('GameMessagePush', this);
};

model.getRoomId = function () {
	return this.roomId;
};

model.getBankChairId = function () {
	return this.bankChairId;
};

model.getAllChairId = function () {
	var chairIdArr = [];
	for (var i = 0; i < this.userArr.length; ++i) {
		chairIdArr.push(this.userArr[i].chairId);
	}
	return chairIdArr;
};

model.getCurBureau = function () {
	return this.curBureau;
};

model.getMaxBureau = function () {
	return this.gameRule.bureau;
};

model.getChairCount = function () {
	return 5;
};
model.getViewId = function (chairId) {
	let chairCount = this.getChairCount();
	return (chairId + chairCount + 3 - this.myChairId) % chairCount;
};

model.getChairIdByViewId = function (viewId) {
	let chaircount = this.getChairCount();
	return (viewId - 3 + this.myChairId + chaircount) % chaircount;
};

model.getMyChairId = function () {
	return this.myChairId;
};
model.getMyViewId = function () {
	return 3;
};
model.getPlayerByChairId = function (chairId) {
	for (var i = 0; i < this.userArr.length; ++i) {
		if (this.userArr[i].chairId === chairId) {
			return this.userArr[i];
		}
	}
	return null;
};

model.getSexByChairId = function (chairId) {
	let player = this.getPlayerByChairId(chairId);
	return player.userInfo.sex;
};

model.getPlayerByViewId = function (viewId) {
	let chairId = this.getChairIdByViewId(viewId);

	for (var i = 0; i < this.userArr.length; ++i) {
		if (this.userArr[i].chairId === chairId) {
			return this.userArr[i];
		}
	}
	return null;
};
model.answerRoomSceneInfoPush = function (data) {
	this.gameTypeID = data.gameTypeInfo.gameTypeID;
};
model.addPlayer = function (player) {
	player.userInfo.nickname = Global.Player.convertNickname(player.userInfo.nickname);
	for (var i = 0; i < this.userArr.length; ++i) {
		if (this.userArr[i].chairId === player.chairId) {
			this.userArr.splice(i, 1);
		}
	}
	this.userArr.push(player);
};

model.delPlayer = function (player) {
	for (var i = 0; i < this.userArr.length; ++i) {
		if (this.userArr[i].chairId === player.chairId) {
			this.userArr.splice(i, 1);
		}
	}
};

model.getGameEnd = function () {
	return (!!this.isGameEnd);
};

model.setGameEnd = function () {
	this.isGameEnd = true;
};

model.setMyCardArr = function (cardArr) {
	this.cardArr = cardArr;
};

model.getMyCardArr = function () {
	return this.cardArr;
};

model.recordGameStartChairId = function () {
	this.gameStartChairIdArr = [];
	for (var i = 0; i < 6; ++i) {
		if (this.getPlayerByChairId(i)) {
			this.gameStartChairIdArr.push(i);
		}
	}
};

model.getChairIdIndex = function (chairId) {
	return this.gameStartChairIdArr.indexOf(chairId);
};

model.getChairIdByIndex = function (index) {
	if (index < 0 || index >= this.gameStartChairIdArr.length) {
		return null;
	} else {
		return this.gameStartChairIdArr[index];
	}
};