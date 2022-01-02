var NNProto = require('./NNProto');
var NNModel = require('./NNModel');

cc.Class({
    extends: cc.Component,

    properties: {
		startGameNode: cc.Node,
		waitGameNode: cc.Node,
		clockNode: cc.Node,
		stateLabel: cc.Label,
		tickLabel: cc.Label,
		stateSprite: cc.Sprite,
	},

	onLoad: function () {
		this.startGameNode.active = false;
		this.waitGameNode.active = false;
		this.clockNode.active = false;
		//每个模块都监听 消息推送，不同模块 分别 做不同的事
		Global.MessageCallback.addListener('GameMessagePush', this);
		this.waitGameNode.active = !this.getIsOnGame();
	},

	onDestroy: function () {
		Global.MessageCallback.removeListener('GameMessagePush', this);
	},
	/*
	 * 播放开始游戏动画
	 */
	playStartGameAnimal: function () {
		var speed = 1500;
		var pos1 = 1000,
			pos2 = 100,
			pos3 = 50;
		this.startGameNode.x = -1000;
		this.startGameNode.active = true;
		var self = this;
		this.startGameNode.runAction(cc.sequence(
			cc.moveTo(0.3, cc.v2(0, 0)).easing(cc.easeIn(3.0)),
			cc.delayTime(0.5),
			cc.moveTo(0.3, cc.v2(1000, 0)).easing(cc.easeIn(3.0)),
			cc.callFunc(function () {
				self.startGameNode.active = false;
				self.clockNode.active = true;
			})
		));
	},

	/*
	 * 判断是否在进行游戏
	 */
	getIsOnGame: function () {
		var gameStatus = NNModel.getGameStatus();
		var myChairId = NNModel.getMyChairId();
		var myIndex = NNModel.getChairIdIndex(myChairId);
		var isOnGame = true;
		if (gameStatus !== NNProto.GAME_STATUS_PREPARE && myIndex < 0) {
			isOnGame = false;
		}
		return isOnGame;
	},

	messageCallbackHandler: function (router, msg) {
		// if (router === 'RoomMessagePush') {
		// 	//断线重连 下推
		// 	if (msg.type === RoomProto.USER_RECONNECT_PUSH) {
		// 		Global.DialogManager.destroyDialog('Niuniu/NNMainDialog');
		// 		NNModel.setGameData(msg.data.gameData);
		// 		Global.DialogManager.createDialog('Niuniu/NNMainDialog');
		// 	}
		// }

		if (router === 'GameMessagePush') {
			if (msg.type === NNProto.GAME_STATUS_PUSH) {
				this.answerGameStatusPush(msg.data.gameStatus, msg.data.Statustime);
			}
		}
	},
	//游戏状态回复
	answerGameStatusPush: function (status, statustime) {
		this.waitGameNode.active = !this.getIsOnGame();
		var tick, str, url;
		if (isNaN(statustime)) return;
		tick = Math.floor(statustime);
		this.clockNode.active = true;
		this.unscheduleAllCallbacks();
		if (status === NNProto.GAME_STATUS_PREPARE) {
			//tick = statustime;
			str = '游戏即将开始';
			url = 'GameCommon/NN/Common1/jijiangkaishi';
			Global.CCHelper.updateSpriteFrame(url, this.stateSprite);
		} else if (status === NNProto.GAME_STATUS_ROBBANK) {
			// tick = statustime;
			str = '请抢庄';
			url = 'GameCommon/NN/Common1/qingqiangzhuang';
			Global.CCHelper.updateSpriteFrame(url, this.stateSprite);
		} else if (status === NNProto.GAME_STATUS_POURSCORE) {
			// tick = statustime;
			str = '等待其他玩家投注';
			url = 'GameCommon/NN/Common1/qitawanjia';
			Global.CCHelper.updateSpriteFrame(url, this.stateSprite);
		} else if (status === NNProto.GAME_STATUS_SORTCARD) {
			// tick = NNProto.AUTO_SHOWCARD_TM;
			str = '请摊牌';
			url = 'GameCommon/NN/Common1/qingtanpai';
			Global.CCHelper.updateSpriteFrame(url, this.stateSprite);
		} else if (status === NNProto.GAME_STATUS_RESOUT) {
			url = 'GameCommon/NN/Common1/jiesuanzhong';
			Global.CCHelper.updateSpriteFrame(url, this.stateSprite);
		}
		var self = this;
		self.tickLabel.string = tick || "";
		var callFunc = function () {
			--tick;
			self.tickLabel.string = tick;
			if (tick === 0) {
				self.clockNode.active = false;
				if (status === NNProto.GAME_STATUS_RESOUT)
					continueBtn.show(NNModel.gameTypeID);
				self.unschedule(callFunc);
			}
		};
		this.schedule(callFunc, 1);
		if (status === NNProto.GAME_STATUS_ROBBANK) {
			this.clockNode.active = false;
			self.playStartGameAnimal();
			AudioMgr.playSound("GameCommon/NN/sound1/startGame");
		}

	},
});
