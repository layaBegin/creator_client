var MPNNModel = require('./MPNNModel');
var MPNNProto = require('./MPNNProto');
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
		// headEdgSprite: cc.Sprite,
		zhuangAni: cc.Node,
	},


	onLoad: function () {
		// this.nameLabel = this.node.getChildByName("name").getComponent(cc.Label);
		// this.headSprite = cc.find("face", this.node).getComponent(cc.Sprite);
		// this.bankerNode = cc.find("zhuangFrame", this.node);
		// this.goldLabel = cc.find("gold", this.node).getComponent(cc.Label);
		// this.vipLevelLabel = cc.find("vipIcon/vipLevel", this.node).getComponent(cc.Label);
		// this.qiangLabel = cc.find("robRateNode/qiangLabel", this.node).getComponent(cc.Label);
		// this.pourScoreLabel = cc.find("robRateNode/xiazhuLabel", this.node).getComponent(cc.Label);

		// this.zhuangAni = this.node.getChildByName("zhuangAni").getComponent(dragonBones.ArmatureDisplay);
		var callFunc = function () {
			this.zhuangAni.active = false;
			this.bankerNode.active = true;
		};
		this.zhuangAni.getComponent(dragonBones.ArmatureDisplay).addEventListener(dragonBones.EventObject.COMPLETE, callFunc.bind(this));
		this.zhuangAni.active = false;

		Global.MessageCallback.addListener('RoomMessagePush', this);
		Global.MessageCallback.addListener('GameMessagePush', this);
	},
	reset: function () {
		this.qiangLabel.string = "";
		this.pourScoreLabel.string = "";
		this.bankerNode.active = false;
	},
	//重置
	offLineAndClient: function () {
		this.reset();
		var gameStatus = MPNNModel.getGameStatus();
		this.bankerNode.active = false;
		this.goldLabel.string = MPNNModel.getPlayerByChairId(this.chairId).userInfo.gold.toFixed(2);

		this.pourScoreLabel.string = '';

		this.bankerNode.active = false;
		this.qiangLabel.string = "";

		var chairIndex = MPNNModel.getChairIdIndex(this.chairId);
		if (!chairIndex) return; // 如果找不到对应的 index 说明玩家在观战
		if (gameStatus === MPNNProto.GAME_STATUS_ROBBANK) {
			var robBankArr = MPNNModel.getRobBankArr();
			if (robBankArr[this.chairId] !== -1) {
				this.answerRobRateBank(this.chairId, robBankArr[this.chairId]);
			}
		} else if (gameStatus === MPNNProto.GAME_STATUS_POURSCORE || gameStatus === MPNNProto.GAME_STATUS_SORTCARD) {
			if (this.chairId >= 0) {
				var pourScore = MPNNModel.getPourScoreArr()[this.chairId];
				if (pourScore !== 0) {
					this.pourScoreLabel.string = "下" + pourScore + '倍';
					this.pourScoreLabel.node.active = true;
				}
				this.showRateSprite(MPNNModel.getRobBankArr());
			}
		} else if (gameStatus === MPNNProto.GAME_STATUS_RESOUT) {
			if (this.chairId >= 0) {
				this.showRateSprite(MPNNModel.getRobBankArr());
			}
		}
		if (MPNNModel.getBankChairId() === this.chairId) {
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
			if (msg.type === MPNNProto.ROB_RATE_BANK_PUSH) {
				this.answerRobRateBank(msg.data.chairId, msg.data.rate);
			}
			//402 抢庄结果下推
			else if (msg.type === MPNNProto.BANK_CHANGE_PUSH) {
				this.answerBankChangePush(msg.data.bankChairId, msg.data.robBankArr);
			}
			//可以下注
			else if (msg.type === MPNNProto.CAN_POUR_SCORE_PUSH) {} //押注
			else if (msg.type === MPNNProto.POUR_SCORE_PUSH) {
				this.answerPourScorePush(msg.data.chairId, msg.data.score);
			}

			//游戏结果下推
			else if (msg.type === MPNNProto.GAME_RESOUT_PUSH) {
				if (MPNNModel.getChairIdIndex(this.chairId) >= 0) {
					this.answerGameResoutPush(msg.data.finalScoreArr, msg.data.bankIndex);
				}
			}
			//游戏状态下推
			else if (msg.type === MPNNProto.GAME_STATUS_PUSH) {
				if (msg.data.gameStatus === MPNNProto.GAME_STATUS_PREPARE) {
					this.scheduleOnce(function () {
						this.answerUserReadyPush(this.chairId);
					}.bind(this), MPNNProto.AUTO_READY_TM - 4);
				}
			}
		} else if (router === 'RoomMessagePush') {
			if (msg.type === RoomProto.USER_READY_PUSH) {
				this.answerUserReadyPush(msg.data.chairId);
			} else if (msg.type === RoomProto.USER_LEAVE_ROOM_PUSH) {
				this.answerUserLeavePush(msg.data.roomUserInfo.chairId);
			} else if (msg.type === RoomProto.ROOM_USER_INFO_CHANGE_PUSH) {
				this.answerRoomUserInfoChangePush(msg.data);
			}
		}
	},

	answerRoomUserInfoChangePush: function (data) {
		var uid = data.changeInfo.uid;
		if (MPNNModel.getPlayerByUid(uid).chairId === this.chairId) {
			this.goldLabel.string = data.changeInfo.gold.toFixed(2);
		}
	},

	answerPourScorePush: function (chairId, score) {
		if (chairId === this.chairId) {
			this.pourScoreLabel.string = "下" + score + '倍';
			this.pourScoreLabel.node.active = true;
		}
	},

	answerGameResoutPush: function (scoreArr, bankIndex) {
		var font = 'Font/fnt_game2';
		var profitPercentage = MPNNModel.getProfitPercentage();

		var self = this;
		var bankChairId = MPNNModel.getChairIdByIndex(bankIndex);
		if (bankChairId === this.chairId) {
			this.bankerNode.active = true;
		} else {
			this.bankerNode.active = false;
		}
		// this.scheduleOnce(function() {
		// 	self.goldLabel.string = MPNNModel.getPlayerByChairId(self.chairId).userInfo.gold.toFixed(2);
		// }, 1);
	},

	answerRobRateBank: function (chairId, rate) {
		if (chairId === this.chairId) {
			if (isNaN(rate)) return;
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
			this.zhuangAni.active = true;
			this.zhuangAni.getComponent(dragonBones.ArmatureDisplay).playAnimation("newAnimation", 1);
		} else {
			this.bankerNode.active = false;
			this.zhuangAni.active = false;
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

	showRateSprite: function (robBankArr) {
		if (this.chairId !== MPNNModel.getBankChairId()) {
			this.qiangLabel.string = "";
			return;
		}
		var index = MPNNModel.getChairIdIndex(this.chairId);
		var rate = robBankArr[this.chairId];
		if (isNaN(rate)) return;
		if (rate <= 0) {
			this.qiangLabel.string = "不抢"
		} else
			this.qiangLabel.string = "抢" + rate + "倍";
		AudioMgr.playSound('GameCommon/NN/sound1/select_banker');

	},

	setHeadPosAndChairId: function (pos, chairId) {
		this.pos = pos;
		this.chairId = chairId;
		var player = MPNNModel.getPlayerByChairId(chairId);
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
		if (this.chairId === MPNNModel.getBankChairId()) {
			this.bankerNode.active = true;
		} else
			this.bankerNode.active = false;
	},

	onDestroy: function () {
		// this.zhuangAni.getComponent(dragonBones.ArmatureDisplay).removeEventListener(dragonBones.EventObject.COMPLETE);
		Global.MessageCallback.removeListener('RoomMessagePush', this);
		Global.MessageCallback.removeListener('GameMessagePush', this);
	}
});