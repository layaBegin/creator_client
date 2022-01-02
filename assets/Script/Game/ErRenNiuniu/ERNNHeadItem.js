var ERNNModel = require('./ERNNModel');
var ERNNProto = require('./ERNNProto');
var RoomProto = require('../../API/RoomProto');

cc.Class({
	extends: cc.Component,

	properties: {
		nameLabel: cc.Label,
		headSprite: cc.Sprite,
		bankerNode: cc.Node,
		goldLabel: cc.Label,
		robRateNode: cc.Node,
		vipLevelLabel: cc.Label,

	},


	onLoad: function () {
		// this.chairId = null;
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
		this.bankerNode.active = false;
		this.robRateNode.active = false;

	},
	//重置或断线重连
	offLineAndClient: function () {
		var gameStatus = ERNNModel.getGameStatus();
		this.bankerNode.active = false;
		this.goldLabel.string = ERNNModel.getPlayerByChairId(this.chairId).userInfo.gold.toFixed(2);

		// this.robRateNode.active = false;

		var chairIndex = ERNNModel.getChairIdIndex(this.chairId);
		//抢庄回复
		if (gameStatus === ERNNProto.GAME_STATUS_ROBBANK) {
			var robBankArr = ERNNModel.getRobBankArr();
			if (robBankArr[this.chairId] !== -1) {
				this.answerRobRateBank(this.chairId, robBankArr[this.chairId]);
			}
		} else if (gameStatus === ERNNProto.GAME_STATUS_POURSCORE || gameStatus === ERNNProto.GAME_STATUS_SORTCARD) {
			let bankerId = ERNNModel.getBankChairId();
			this.robRateNode.active = !!(this.chairId === bankerId);
			this.bankerNode.active = !!(this.chairId === bankerId);
		} else if (gameStatus === ERNNProto.GAME_STATUS_RESOUT) {

		}

	},
	//服务器下推消息
	messageCallbackHandler: function (router, msg) {
		// if(! this.pos) { return; }
		if (router === 'GameMessagePush') {
			//抢庄回复
			if (msg.type === ERNNProto.ROB_RATE_BANK_PUSH) {
				this.answerRobRateBank(msg.data.chairId, msg.data.rate);
			}
			//庄结果下推，
			else if (msg.type === ERNNProto.BANK_CHANGE_PUSH) {
				this.answerBankChangePush(msg.data.bankChairId, msg.data.robBankArr);
			}
			//403 可押注分数下推
			else if (msg.type === ERNNProto.CAN_POUR_SCORE_PUSH) {}
			//404 押注回复
			else if (msg.type === ERNNProto.POUR_SCORE_PUSH) {
				this.answerPourScorePush(msg.data.chairId, msg.data.score);
			}

			//游戏结果下推
			else if (msg.type === ERNNProto.GAME_RESOUT_PUSH) {
				if (ERNNModel.getChairIdIndex(this.chairId) >= 0) {
					this.answerGameResoutPush(msg.data.finalScoreArr, msg.data.bankIndex);
				}
			}
			//状态改变
			else if (msg.type === ERNNProto.GAME_STATUS_PUSH) {
				//准备状态
				if (msg.data.gameStatus === ERNNProto.GAME_STATUS_PREPARE) {
					this.answerUserReadyPush(this.chairId);
				}
			}
			// //弃用  自由抢庄回复，
			// else if(msg.type === ERNNProto.ROB_FREE_BANK_PUSH) {
			// }


		} else if (router === 'RoomMessagePush') {
			//401 准备状态下推
			if (msg.type === RoomProto.USER_READY_PUSH) {
				this.answerUserReadyPush(msg.data.chairId);
			} else if (msg.type === RoomProto.USER_LEAVE_ROOM_PUSH) {
				this.answerUserLeavePush(msg.data.roomUserInfo.chairId);
			}
		}
	},
	//抢庄下推 如果时间到了 有一个抢庄结果的下推；
	answerRobRateBank: function (chairId, rate) {
		if (chairId === this.chairId) {
			this.robRateNode.active = true;
			let qiangLabel = this.robRateNode.getChildByName('qiangLabel').getComponent(cc.Label);
			if (rate === 0 || rate === null) {
				qiangLabel.string = "不叫";
			} else if (rate !== undefined) //如果抢庄
			{
				qiangLabel.string = "叫庄";
			}
		}
	},
	//抢庄结果 下推
	answerBankChangePush: function (bankChairId, robBankArr) {
		if (this.chairId === bankChairId) {
			this.robRateNode.active = false;

			this.zhuangAni.node.active = true;
			this.zhuangAni.playAnimation("newAnimation", 1);
			// if (bankChairId == ERNNModel.getMyChairId())
			AudioMgr.playSound("GameCommon/NN/sound1/select_banker");
		} else {
			this.robRateNode.active = false;
			this.bankerNode.active = false;
			this.zhuangAni.node.active = false;
		}

	},
	//押注回复
	answerPourScorePush: function (chairId, score) {

	},
	//游戏结果下推
	answerGameResoutPush: function (scoreArr, bankIndex) {
		//更新金币
		var self = this;
		this.scheduleOnce(function () {
			self.goldLabel.string = ERNNModel.getPlayerByChairId(self.chairId).userInfo.gold.toFixed(2);
		}, 3);
	},

	//准备状态下推
	answerUserReadyPush: function (chairId) {
		this.bankerNode.active = false; //庄关闭
		this.robRateNode.active = false;
	},
	//用户离开
	answerUserLeavePush: function (chairId) {
		if (chairId === this.chairId) {
			this.reset();
		}
	},

	//更新头像信息
	setHeadPosAndChairId: function (pos, chairId) {
		this.pos = pos;
		this.chairId = chairId;
		let player = ERNNModel.getPlayerByChairId(chairId);
		if (player) {
			this.nameLabel.string = player.userInfo.nickname;
			this.goldLabel.string = player.userInfo.gold.toFixed(2);
			this.vipLevelLabel.string = "v" + player.userInfo.vipLevel;
			var callFunc = function () {
				this.node.active = true;
			};
			Global.CCHelper.updateSpriteFrame(player.userInfo.avatar, this.headSprite, callFunc.bind(this));
		}

		if (this.chairId === ERNNModel.getBankChairId()) {
			this.bankerNode.active = true;
		} else {
			this.bankerNode.active = false;
		}
	},


	onDestroy: function () {
		// this.zhuangAni.removeEventListener(dragonBones.EventObject.COMPLETE);
		Global.MessageCallback.removeListener('RoomMessagePush', this);
		Global.MessageCallback.removeListener('GameMessagePush', this);
	}
});