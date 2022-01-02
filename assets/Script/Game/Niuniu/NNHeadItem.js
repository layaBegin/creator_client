var NNModel = require('./NNModel');
var NNProto = require('./NNProto');
var RoomProto = require('../../API/RoomProto');

cc.Class({
	extends: cc.Component,

	properties: {
		nameLabel: cc.Label,
		headSprite: cc.Sprite,
		bankerNode: cc.Node,
		goldLabel: cc.Label,
		vipLevelLabel: cc.Label,

		qiangLabel: cc.Label,
		pourScoreLabel: cc.Label,
	},


	onLoad: function () {
		this.zhuangAni = this.node.getChildByName("zhuangAni").getComponent(dragonBones.ArmatureDisplay);
		var callFunc = function () {
			this.zhuangAni.node.active = false;
			this.bankerNode.active = true;
		};
		this.zhuangAni.addEventListener(dragonBones.EventObject.COMPLETE, callFunc.bind(this));
		this.zhuangAni.node.active = false;
		Global.MessageCallback.addListener('RoomMessagePush', this);
		Global.MessageCallback.addListener('GameMessagePush', this);
	},
	reset: function () {
		this.zhuangAni.node.active = false;
		this.qiangLabel.string = "";
		this.pourScoreLabel.string = "";
		this.bankerNode.active = false;
	},
	//重置
	offLineAndClient: function () {
		this.reset();
		var gameStatus = NNModel.getGameStatus();
		this.bankerNode.active = false;
		this.goldLabel.string = NNModel.getPlayerByChairId(this.chairId).userInfo.gold.toFixed(2);
		this.pourScoreLabel.string = '';

		this.bankerNode.active = false;
		this.qiangLabel.string = "";

		var chairIndex = NNModel.getChairIdIndex(this.chairId);

		if (gameStatus === NNProto.GAME_STATUS_ROBBANK) {
			var robBankArr = NNModel.getRobBankArr();
			if (robBankArr[this.chairId] !== -1) {
				this.answerRobRateBank(this.chairId, robBankArr[this.chairId]);
			}
		}
		//押注中这里写的有问题
		else if (gameStatus === NNProto.GAME_STATUS_POURSCORE) {
			if (chairIndex >= 0) {
				var pourScore = NNModel.getPourScoreArr()[this.chairId];
				if (pourScore !== 0) {
					this.pourScoreLabel.string = "下" + pourScore + '倍';
					this.pourScoreLabel.node.active = true;
				}
				this.showRateSprite(NNModel.getRobBankArr());
			}
		}
		//看牌中
		else if (gameStatus === NNProto.GAME_STATUS_SORTCARD) {
			if (chairIndex >= 0) {
				var pourScore = NNModel.getPourScoreArr()[this.chairId];
				if (pourScore !== 0) {
					this.pourScoreLabel.string = "下" + pourScore + '倍';
					this.pourScoreLabel.node.active = true;
				}
				this.showRateSprite(NNModel.getRobBankArr());
			}
		}
		//这里写的有问题 后面改
		else if (gameStatus === NNProto.GAME_STATUS_RESOUT) {
			if (chairIndex >= 0) {
				this.showRateSprite(NNModel.getRobBankArr());
			}
		}
		if (NNModel.getBankChairId() === this.chairId) {
			this.bankerNode.active = true;
		}
	},
	//服务器下推消息
	messageCallbackHandler: function (router, msg) {
		if (!this.pos) {
			return;
		}
		if (router === 'GameMessagePush') {
			//抢庄按钮 回复
			if (msg.type === NNProto.ROB_RATE_BANK_PUSH) {
				this.answerRobRateBank(msg.data.chairId, msg.data.rate);
			}
			//402 抢庄结果下推
			else if (msg.type === NNProto.BANK_CHANGE_PUSH) {
				this.answerBankChangePush(msg.data.bankChairId, msg.data.robBankArr);
			}
			//可以下注
			else if (msg.type === NNProto.CAN_POUR_SCORE_PUSH) {} //押注
			else if (msg.type === NNProto.POUR_SCORE_PUSH) {
				this.answerPourScorePush(msg.data.chairId, msg.data.score);
			}

			//游戏结果下推
			else if (msg.type === NNProto.GAME_RESOUT_PUSH) {
				if (NNModel.getChairIdIndex(this.chairId) >= 0) {
					this.answerGameResoutPush(msg.data.finalScoreArr, msg.data.bankIndex);
				}
			}
			//游戏状态下推
			else if (msg.type === NNProto.GAME_STATUS_PUSH) {
				if (msg.data.gameStatus === NNProto.GAME_STATUS_PREPARE) {
					this.scheduleOnce(function () {
						this.answerUserReadyPush(this.chairId);
					}.bind(this), NNProto.AUTO_READY_TM - 4);
				}
			}
		} else if (router === 'RoomMessagePush') {
			if (msg.type === RoomProto.USER_READY_PUSH) {
				this.answerUserReadyPush(msg.data.chairId);
			} else if (msg.type === RoomProto.USER_LEAVE_ROOM_PUSH) {
				this.answerUserLeavePush(msg.data.roomUserInfo.chairId);
			}
		}
	},

	answerPourScorePush: function (chairId, score) {
		if (chairId === this.chairId) {
			this.pourScoreLabel.string = "下" + Math.floor(score) + '倍';
			this.pourScoreLabel.node.active = true;
		}
	},

	answerGameResoutPush: function (scoreArr, bankIndex) {
		var font = 'Font/fnt_game2';
		var profitPercentage = NNModel.getProfitPercentage();

		var self = this;
		var bankChairId = NNModel.getChairIdByIndex(bankIndex);
		if (bankChairId === this.chairId) {
			this.bankerNode.active = true;
		} else {
			this.bankerNode.active = false;
		}
		this.scheduleOnce(function () {
			self.goldLabel.string = NNModel.getPlayerByChairId(self.chairId).userInfo.gold.toFixed(2);
		}, 1);
	},

	answerRobRateBank: function (chairId, rate) {
		if (isNaN(rate)) return;
		if (chairId === this.chairId) {
			if (rate === 0) {
				this.qiangLabel.string = "不抢";
			} else {
				this.qiangLabel.string = "抢" + rate + "倍";
			}
		}
	},
	//抢庄结果下推
	answerBankChangePush: function (bankChairId, robBankArr) {
		if (this.chairId === bankChairId) {
			this.zhuangAni.node.active = true;
			this.zhuangAni.playAnimation("newAnimation", 1);

		} else {
			this.bankerNode.active = false;
		}
		this.showRateSprite(robBankArr);
	},

	answerUserReadyPush: function (chairId) {
		if (chairId === this.chairId) {
			this.pourScoreLabel.string = '';
			this.qiangLabel.string = "";
			this.bankerNode.active = false;
		}
	},

	answerUserLeavePush: function (chairId) {
		if (chairId === this.chairId) {
			this.pourScoreLabel.string = '';
			this.bankerNode.active = false;
			this.qiangLabel.string = "";
		}
	},
	//显示庄家抢几倍
	showRateSprite: function (robBankArr) {
		if (this.chairId !== NNModel.getBankChairId()) {
			this.qiangLabel.string = "";
			return;
		}
		var rate = robBankArr[this.chairId];
		if (rate < 0) return;

		// var index = NNModel.getChairIdIndex(this.chairId);
		if (rate === 0 || rate === null) {
			this.qiangLabel.string = "不抢"
		} else if (typeof rate !== "undefined")
			this.qiangLabel.string = "抢" + rate + "倍";
		AudioMgr.playSound('GameCommon/NN/sound1/select_banker');
	},


	setHeadPosAndChairId: function (pos, chairId) {
		this.pos = pos;
		this.chairId = chairId;
		var player = NNModel.getPlayerByChairId(chairId);
		if (player) {
			this.nameLabel.string = player.userInfo.nickname;
			this.goldLabel.string = player.userInfo.gold.toFixed(2);
			//设置vip等级
			this.vipLevelLabel.string = "v" + Math.floor(player.userInfo.vipLevel);
			var callFunc = function () {
				this.node.active = true;
			}
			Global.CCHelper.updateSpriteFrame(player.userInfo.avatar, this.headSprite, callFunc.bind(this));
		}
		this.qiangLabel.string = "";
		this.pourScoreLabel.string = "";
		if (this.chairId === NNModel.getBankChairId()) {
			this.bankerNode.active = true;
		} else {
			this.zhuangAni.node.active = false;
			this.bankerNode.active = false;

		}
	},

	onDestroy: function () {
		// this.zhuangAni.removeEventListener(dragonBones.EventObject.COMPLETE);
		Global.MessageCallback.removeListener('RoomMessagePush', this);
		Global.MessageCallback.removeListener('GameMessagePush', this);
	}
});