var BJLLogic = require('./BJLLogic');
var BJLProto = require('./BJLProto');
var RoomProto = require('../../API/RoomProto');
var RoomAPI = require('../../API/RoomAPI');
var model = require('./BJLModel');

cc.Class({
	extends: cc.Component,

	properties: {
		gameCommonCtrl: require("GameCommonController"),
		heLabel: cc.Label,
		tongdianpingLabel: cc.Label,
		xianLabel: cc.Label,
		xianDuiLabel: cc.Label,
		xianTWLabel: cc.Label,
		zhuangLabel: cc.Label,
		zhuangDuiLabel: cc.Label,
		zhuangTWLabel: cc.Label,
		myHeLabel: cc.Label,
		myTongdianpingLabel: cc.Label,
		myXianLabel: cc.Label,
		myXianDuiLabel: cc.Label,
		myXianTWLabel: cc.Label,
		myZhuangLabel: cc.Label,
		myZhuangDuiLabel: cc.Label,
		myZhuangTWLabel: cc.Label,
		xianBetRectNode: cc.Node,
		xianDuiBetRectNode: cc.Node,
		xianTWBetRectNode: cc.Node,
		zhuangBetRectNode: cc.Node,
		zhuangDuiBetRectNode: cc.Node,
		zhuangTWBetRectNode: cc.Node,
		heBetRectNode: cc.Node,
		tongdianpingBetRectNode: cc.Node,
		resoutNode: cc.Node,
		roadNode: cc.Node,
		xianResult: cc.Node,
		xianduiResult: cc.Node,
		xiantwResult: cc.Node,
		pingResult: cc.Node,
		zhuangResult: cc.Node,
		zhuangduiResult: cc.Node,
		zhuangtwResult: cc.Node,
		tongdianpingResult: cc.Node,
		xianArea: cc.Node,
		xianduiArea: cc.Node,
		xiantwArea: cc.Node,
		pingArea: cc.Node,
		zhuangArea: cc.Node,
		zhuangduiArea: cc.Node,
		zhuangtwArea: cc.Node,
		tongdianpingArea: cc.Node,
		gameCommonRoot: cc.Node,
		gameDropDownList: cc.Node,

		rateXian: cc.Label,
		rateXiandui: cc.Label,
		rateXiantw: cc.Label,
		rateHe: cc.Label,
		rateZhuang: cc.Label,
		rateZhuangdui: cc.Label,
		rateZhuangtw: cc.Label,
		rateTongdianping: cc.Label,

		xianhongNode: cc.Node,
		zhuangXH: cc.Label,
		xianXH: cc.Label,
		zhuangDuiXH: cc.Label,
		xianDuiXH: cc.Label,
		zhuangTWXH: cc.Label,
		xianTWXH: cc.Label,
		pingXH: cc.Label,
		tongdianpingXH: cc.Label,
	},

	start: function () {
		this.enableBet = false;
		this.gameResultData = null;
		this.gameInited = false;
		this.clearResult();
		this.clearClickArea();

		Global.MessageCallback.addListener('RoomMessagePush', this);
		Global.MessageCallback.addListener('GameMessagePush', this);
		Global.MessageCallback.addListener('ReConnectSuccess', this);
		RoomAPI.roomMessageNotify(RoomProto.getRoomSceneInfoNotify());

		AudioMgr.startPlayBgMusic("BaiJiaLe/Audio/bg");
	},

	clearResult: function () {
		this.xianResult.active = false;
		this.xianduiResult.active = false;
		this.xiantwResult.active = false;
		this.pingResult.active = false;
		this.zhuangResult.active = false;
		this.zhuangduiResult.active = false;
		this.zhuangtwResult.active = false;
		this.tongdianpingResult.active = false;
	},

	clearClickArea: function () {
		this.xianArea.active = false;
		this.xianduiArea.active = false;
		this.xiantwArea.active = false;
		this.pingArea.active = false;
		this.zhuangArea.active = false;
		this.zhuangduiArea.active = false;
		this.zhuangtwArea.active = false;
		this.tongdianpingArea.active = false;
	},

	onDestroy: function () {
		Global.MessageCallback.removeListener('RoomMessagePush', this);
		Global.MessageCallback.removeListener('GameMessagePush', this);
		Global.MessageCallback.removeListener('ReConnectSuccess', this);
	},

	messageCallbackHandler(router, msg) {
		if (router === 'RoomMessagePush') {
			if (msg.type === RoomProto.USER_LEAVE_ROOM_PUSH) {
				if (msg.data.roomUserInfo.userInfo.uid === model.selfUid) {
					ViewMgr.goBackHall(Config.GameType.BJL);
				}
			} else if (msg.type === RoomProto.GET_ROOM_SCENE_INFO_PUSH) {
				GameConfig.initGameRooms([msg.data.gameTypeInfo])
				this.gameInit(msg.data.gameData); // 初始化界面场景
				if (msg.data.gameData.gameStatus === BJLProto.STATUS_NONE) {
					this.gameCommonCtrl.showWait(true);
				}
			} else if (msg.type === RoomProto.ROOM_DISMISS_PUSH) {
				Confirm.show("当前房间已解散！", () => {
					ViewMgr.goBackHall(Config.GameType.BJL)
				})
			}
		} else if (router === "GameMessagePush") {
			if (!this.gameInited) return;
			if (msg.type === BJLProto.POUR_GOLD_PUSH) {
				this.userBet(msg.data, true);
				this.updateBetCount(this.pourGoldObj);
			} else if (msg.type === BJLProto.STATUS_PUSH) {
				if (msg.data.gameStatus === BJLProto.STATUS_POUR) {
					this.onGameStart(true);
				} else if (msg.data.gameStatus === BJLProto.STATUS_RESOUT) {}
			} else if (msg.type === BJLProto.RESOUT_PUSH) {
				this.onGameEnd(msg.data);
			} else if (msg.type === BJLProto.REDLIMIT_ERROR) {
				Tip.makeText("下注失败，超出指定区域限红!");
			}
		} else if (router === "ReConnectSuccess") {
			cc.log("断线重连");
			if (Global.Player.isInRoom()) {
				cc.log("房间id:" + model.roomID);
				Global.API.hall.joinRoomRequest(model.roomID, () => {
					// this.onReconnection();
				}, undefined, Config.GameType.BJL);
			} else {
				cc.log("没有在房间中");
				ViewMgr.goBackHall(Config.GameType.BJL);
			}
		}
	},

	//断线重连
	onReconnection() {
		// 清理数据
		this.enableBet = false;
		this.gameResultData = null;
		this.gameInited = false;
		// 停止动作
		this.node.stopAllActions();
		// 更新下注信息
		this.updateBetCount(null);
		// 游戏公共控制重连
		this.gameCommonCtrl.onReconnection();
		// 请求场景数据
		RoomAPI.roomMessageNotify(RoomProto.getRoomSceneInfoNotify());
	},

	//游戏开始
	onGameStart(requireUserInfo) {
		this.pourGoldObj = {};
		this.updateBetCount(null);
		this.node.stopAllActions();
		if (requireUserInfo) {
			// 执行游戏开始
			this.gameCommonCtrl.onGameStart();
		}
		// 开启动作
		this.node.runAction(cc.sequence(
			cc.delayTime(1),
			cc.callFunc(this.onBetStart.bind(this)),
			cc.delayTime(BJLProto.POUR_TM),
			cc.callFunc(this.onBetStop.bind(this))
		));
		this.resoutNode.zIndex = 1;
		this.roadNode.zIndex = 2;
	},

	//开始下注
	onBetStart() {
		this.enableBet = true;
		this.gameCommonCtrl.onGameBetStart();
	},

	//结束下注
	onBetStop() {
		this.enableBet = false;
		this.gameCommonCtrl.onGameBetEnd();
		this.node.stopAllActions();
	},

	//游戏结束
	onGameEnd(data) {
		this.gameResultData = data.resout;
		if (this.enableBet) this.onBetStop();
		this.node.stopAllActions();
		let cardCount = data.resout.cardsArr[0].length + data.resout.cardsArr[1].length;

		cc.log("游戏结算");
		if (!!data.resout.profitPercentage) {
			cc.log("税收比例:" + data.resout.profitPercentage);
			model.profitPercentage = data.resout.profitPercentage;
			this.gameCommonCtrl.profitPercentage = model.profitPercentage;
			this.gameDropDownList.getComponent('GameDropDownList').setGameInfo(model.kindId, model.profitPercentage);
		}

		let showResultTime = cardCount + 3;
		this.scheduleOnce(function () {
			this.onShowResult();
		}.bind(this), showResultTime);

		let showTwinkleTime = cardCount + 2;
		this.scheduleOnce(function () {
			this.onShowTwinkleEffect();
		}.bind(this), showTwinkleTime);

		this.resoutNode.zIndex = 2;
		this.roadNode.zIndex = 1;
	},

	//中奖区域闪烁
	onShowTwinkleEffect() {
		let resultType = this.gameResultData.type;
		if ((resultType & BJLLogic.WIN_HE) > 0) {
			this.onShowBlinkEffect(this.pingResult);
		}
		if ((resultType & BJLLogic.WIN_ZHUANG) > 0) {
			this.onShowBlinkEffect(this.zhuangResult);
		}
		if ((resultType & BJLLogic.WIN_ZHUANGDUI) > 0) {
			this.onShowBlinkEffect(this.zhuangduiResult);
		}
		if ((resultType & BJLLogic.WIN_ZHUANGTW) > 0) {
			this.onShowBlinkEffect(this.zhuangtwResult);
		}
		if ((resultType & BJLLogic.WIN_TONGDIANPING) > 0) {
			this.onShowBlinkEffect(this.tongdianpingResult);
		}
		if ((resultType & BJLLogic.WIN_XIAN) > 0) {
			this.onShowBlinkEffect(this.xianResult);
		}
		if ((resultType & BJLLogic.WIN_XIANDUI) > 0) {
			this.onShowBlinkEffect(this.xianduiResult);
		}
		if ((resultType & BJLLogic.WIN_XIANTW) > 0) {
			this.onShowBlinkEffect(this.xiantwResult);
		}
	},

	//闪烁效果
	onShowBlinkEffect: function (resultBlock) {
		resultBlock.opacity = 0;
		resultBlock.active = true;
		let fadeEffect = cc.sequence(cc.fadeIn(1.0), cc.fadeOut(1.0));
		resultBlock.runAction(cc.repeat(fadeEffect, 10));
	},

	//显示结果
	onShowResult() {
		let scoreChangeArr = [];
		for (let key in this.gameResultData.userWinObj) {
			if (this.gameResultData.userWinObj.hasOwnProperty(key)) {
				scoreChangeArr.push({
					uid: key,
					score: this.gameResultData.userWinObj[key]
				});
			}
		}
		this.gameCommonCtrl.onNewGameResult(scoreChangeArr, this.gameResultData.type);
	},

	//用户下注
	userBet(data, isTween) {
		let betRect = cc.rect(0, 0, 0, 0);
		if (data.direction == BJLLogic.WIN_XIAN) {
			betRect = this.xianBetRectNode.getBoundingBox();
		} else if (data.direction == BJLLogic.WIN_XIANDUI) {
			betRect = this.xianDuiBetRectNode.getBoundingBox();
		} else if (data.direction == BJLLogic.WIN_XIANTW) {
			betRect = this.xianTWBetRectNode.getBoundingBox();
		} else if (data.direction == BJLLogic.WIN_ZHUANG) {
			betRect = this.zhuangBetRectNode.getBoundingBox();
		} else if (data.direction == BJLLogic.WIN_ZHUANGDUI) {
			betRect = this.zhuangDuiBetRectNode.getBoundingBox();
		} else if (data.direction == BJLLogic.WIN_ZHUANGTW) {
			betRect = this.zhuangTWBetRectNode.getBoundingBox();
		} else if (data.direction == BJLLogic.WIN_TONGDIANPING) {
			betRect = this.tongdianpingBetRectNode.getBoundingBox();
		} else if (data.direction == BJLLogic.WIN_HE) {
			betRect = this.heBetRectNode.getBoundingBox();
		} else {
			return;
		}
		if (!this.pourGoldObj[data.direction]) {
			this.pourGoldObj[data.direction] = {};
		}
		if (this.pourGoldObj[data.direction][data.uid]) {
			this.pourGoldObj[data.direction][data.uid] += data.gold;
		} else {
			this.pourGoldObj[data.direction][data.uid] = data.gold;
		}
		let jettonOffset = 50;
		let newBetRect = cc.rect(betRect.x + jettonOffset, betRect.y + jettonOffset, betRect.width - jettonOffset * 2, betRect.height - jettonOffset * 2);
		this.gameCommonCtrl.newUserBet(data.uid, data.gold, data.direction, newBetRect, isTween);
	},

	//更新下注数目
	updateBetCount(pourGoldObj) {
		this.xianLabel.string = "0";
		this.xianDuiLabel.string = "0";
		this.xianTWLabel.string = "0";
		this.zhuangLabel.string = "0";
		this.zhuangDuiLabel.string = "0";
		this.zhuangTWLabel.string = "0";
		this.heLabel.string = "0";
		this.tongdianpingLabel.string = "0";
		this.myXianLabel.string = "下0";
		this.myXianDuiLabel.string = "下0";
		this.myXianTWLabel.string = "下0";
		this.myZhuangLabel.string = "下0";
		this.myZhuangDuiLabel.string = "下0";
		this.myZhuangTWLabel.string = "下0";
		this.myHeLabel.string = "下0";
		this.myTongdianpingLabel.string = "下0";
		if (!pourGoldObj) {
			this.clearResult();
			return;
		} else {
			let dir, uid, pour, myPour;
			let myUid = Global.Player.getPy('uid');
			this.myBetRecord = {};
			for (dir in pourGoldObj) {
				if (pourGoldObj.hasOwnProperty(dir)) {
					pour = 0;
					myPour = 0;
					for (uid in pourGoldObj[dir]) {
						if (pourGoldObj[dir].hasOwnProperty(uid)) {
							pour += pourGoldObj[dir][uid];
						}
						if (uid === myUid) {
							myPour += pourGoldObj[dir][uid];
						}
					}
					this.myBetRecord[dir] = myPour;
					if (dir == BJLLogic.WIN_XIAN) {
						this.xianLabel.string = pour.toString();
						this.myXianLabel.string = '下' + myPour.toString();
					} else if (dir == BJLLogic.WIN_XIANDUI) {
						this.xianDuiLabel.string = pour.toString();
						this.myXianDuiLabel.string = '下' + myPour.toString();
					} else if (dir == BJLLogic.WIN_XIANTW) {
						this.xianTWLabel.string = pour.toString();
						this.myXianTWLabel.string = '下' + myPour.toString();
					} else if (dir == BJLLogic.WIN_ZHUANG) {
						this.zhuangLabel.string = pour.toString();
						this.myZhuangLabel.string = '下' + myPour.toString();
					} else if (dir == BJLLogic.WIN_ZHUANGDUI) {
						this.zhuangDuiLabel.string = pour.toString();
						this.myZhuangDuiLabel.string = '下' + myPour.toString();
					} else if (dir == BJLLogic.WIN_ZHUANGTW) {
						this.zhuangTWLabel.string = pour.toString();
						this.myZhuangTWLabel.string = '下' + myPour.toString();
					} else if (dir == BJLLogic.WIN_HE) {
						this.heLabel.string = pour.toString();
						this.myHeLabel.string = '下' + myPour.toString();
					} else if (dir == BJLLogic.WIN_TONGDIANPING) {
						this.tongdianpingLabel.string = pour.toString();
						this.myTongdianpingLabel.string = '下' + myPour.toString();
					}
				}
			}
			let BJLResoutItem = this.resoutNode.getComponent("BJLResoutItem");
			if (BJLResoutItem != null) {
				BJLResoutItem.updateBetInfo(this.myBetRecord);
			}
		}
	},

	//初始化游戏
	gameInit(gameData) {
		this.gameInited = true;
		if (gameData.resultData) {
			model.profitPercentage = gameData.resultData.profitPercentage;
		} else {
			model.profitPercentage = gameData.profitPercentage;
		}

		cc.log("百家乐游戏id:" + model.kindId);
		this.gameCommonCtrl.onGameInit(model.profitPercentage, model.kindId);
		this.gameCommonCtrl.setHideOtherPlayer(true);
		this.gameDropDownList.getComponent('GameDropDownList').setGameInfo(model.kindId, model.profitPercentage);
		this.updateParameters(gameData.parameters);
		this.gameCommonCtrl.updateJetton(gameData);
		if (gameData.gameStatus === BJLProto.STATUS_POUR) {
			this.onGameStart(false);
			this.updatePourGoldObj(gameData.pourGoldObj);
		} else if (gameData.gameStatus === BJLProto.STATUS_RESOUT) {
			this.gameCommonCtrl.setCacheFlag(true);
			this.updatePourGoldObj(gameData.pourGoldObj);
			this.resoutNode.zIndex = 2;
			this.roadNode.zIndex = 1;
			this.gameResultData = gameData.resultData;
			if (gameData.tickTm > 2) {
				this.scheduleOnce(function () {
					this.onShowResult();
				}, gameData.tickTm - 2);
			} else {
				this.onShowResult();
			}
			// 显示等待
			this.gameCommonCtrl.showWait(true);
		}

	},

	updatePourGoldObj(pourGoldObj) {
		//上一局筹码
		this.pourGoldObj = {};
		let dir, uid;
		if (!!pourGoldObj) {
			for (dir in pourGoldObj) {
				if (pourGoldObj.hasOwnProperty(dir)) {
					for (uid in pourGoldObj[dir]) {
						if (pourGoldObj[dir].hasOwnProperty(uid)) {
							let betInfo = {};
							betInfo.uid = uid;
							betInfo.direction = dir;
							betInfo.gold = pourGoldObj[dir][uid];
							this.userBet(betInfo, false);
						}
					}
				}
			}
		}
		this.updateBetCount(this.pourGoldObj);
	},

	updateParameters(parameters) {
		if (!!parameters) {
			if (!!parameters.config) {
				this.updateRedLimit(parameters.config.gameConfig);
				this.updateRate(parameters.config.odds);
			}
		}
	},

	//更新限红
	updateRedLimit(redLimitInfo) {
		this.redLimitInfo = {};
		this.updateRedLimitLabel(BJLLogic.WIN_HE, this.pingXH, redLimitInfo[BJLLogic.WIN_HE]);
		this.updateRedLimitLabel(BJLLogic.WIN_ZHUANG, this.zhuangXH, redLimitInfo[BJLLogic.WIN_ZHUANG]);
		this.updateRedLimitLabel(BJLLogic.WIN_XIAN, this.xianXH, redLimitInfo[BJLLogic.WIN_XIAN]);
		this.updateRedLimitLabel(BJLLogic.WIN_ZHUANGTW, this.zhuangTWXH, redLimitInfo[BJLLogic.WIN_ZHUANGTW]);
		this.updateRedLimitLabel(BJLLogic.WIN_XIANTW, this.xianTWXH, redLimitInfo[BJLLogic.WIN_XIANTW]);
		this.updateRedLimitLabel(BJLLogic.WIN_ZHUANGDUI, this.zhuangDuiXH, redLimitInfo[BJLLogic.WIN_ZHUANGDUI]);
		this.updateRedLimitLabel(BJLLogic.WIN_XIANDUI, this.xianDuiXH, redLimitInfo[BJLLogic.WIN_XIANDUI]);
		this.updateRedLimitLabel(BJLLogic.WIN_TONGDIANPING, this.tongdianpingXH, redLimitInfo[BJLLogic.WIN_TONGDIANPING]);
	},

	updateRedLimitLabel(type, xhLabel, redLimitInfo) {
		if (!!redLimitInfo && !!redLimitInfo.redLimit) {
			xhLabel.string = redLimitInfo.redLimit.min + "~" + redLimitInfo.redLimit.max;
			this.redLimitInfo[type] = redLimitInfo.redLimit;
		}
	},

	updateRate(odds) {
		if (odds.hasOwnProperty(BJLLogic.WIN_HE)) {
			this.rateHe.string = "1：" + odds[BJLLogic.WIN_HE];
		}
		if (odds.hasOwnProperty(BJLLogic.WIN_ZHUANG)) {
			this.rateZhuang.string = "1：" + odds[BJLLogic.WIN_ZHUANG];
		}
		if (odds.hasOwnProperty(BJLLogic.WIN_XIAN)) {
			this.rateXian.string = "1：" + odds[BJLLogic.WIN_XIAN];
		}
		if (odds.hasOwnProperty(BJLLogic.WIN_ZHUANGTW)) {
			this.rateZhuangtw.string = "1：" + odds[BJLLogic.WIN_ZHUANGTW];
		}
		if (odds.hasOwnProperty(BJLLogic.WIN_XIANTW)) {
			this.rateXiantw.string = "1：" + odds[BJLLogic.WIN_XIANTW];
		}
		if (odds.hasOwnProperty(BJLLogic.WIN_ZHUANGDUI)) {
			this.rateZhuangdui.string = "1：" + odds[BJLLogic.WIN_ZHUANGDUI];
		}
		if (odds.hasOwnProperty(BJLLogic.WIN_XIANDUI)) {
			this.rateXiandui.string = "1：" + odds[BJLLogic.WIN_XIANDUI];
		}
		if (odds.hasOwnProperty(BJLLogic.WIN_TONGDIANPING)) {
			this.rateTongdianping.string = "1：" + odds[BJLLogic.WIN_TONGDIANPING];
		}
	},

	//下注
	betEvent(event, param) {
		if (!this.enableBet) return;
		let betValue = this.gameCommonCtrl.getCurChipNumber();
		if (param === 'zhuang') {
			this.showClickEffect(this.zhuangArea);
			let betTip = this.checkXianhong(betValue, BJLLogic.WIN_ZHUANG);
			if (!!betTip) {
				Tip.makeText("下注失败，此区域限红" + betTip);
				return;
			}
			Global.CCHelper.playPreSound();
			RoomAPI.gameMessageNotify(BJLProto.getPourGoldNotifyData(BJLLogic.WIN_ZHUANG, betValue));
		} else if (param === 'xian') {
			this.showClickEffect(this.xianArea);
			let betTip = this.checkXianhong(betValue, BJLLogic.WIN_XIAN);
			if (!!betTip) {
				Tip.makeText("下注失败，此区域限红" + betTip);
				return;
			}
			Global.CCHelper.playPreSound();
			RoomAPI.gameMessageNotify(BJLProto.getPourGoldNotifyData(BJLLogic.WIN_XIAN, betValue));
		} else if (param === 'zhuangdui') {
			this.showClickEffect(this.zhuangduiArea);
			let betTip = this.checkXianhong(betValue, BJLLogic.WIN_ZHUANGDUI);
			if (!!betTip) {
				Tip.makeText("下注失败，此区域限红" + betTip);
				return;
			}
			Global.CCHelper.playPreSound();
			RoomAPI.gameMessageNotify(BJLProto.getPourGoldNotifyData(BJLLogic.WIN_ZHUANGDUI, betValue));
		} else if (param === 'zhuangtw') {
			this.showClickEffect(this.zhuangtwArea);
			let betTip = this.checkXianhong(betValue, BJLLogic.WIN_ZHUANGTW);
			if (!!betTip) {
				Tip.makeText("下注失败，此区域限红" + betTip);
				return;
			}
			Global.CCHelper.playPreSound();
			RoomAPI.gameMessageNotify(BJLProto.getPourGoldNotifyData(BJLLogic.WIN_ZHUANGTW, betValue));
		} else if (param === 'xiandui') {
			this.showClickEffect(this.xianduiArea);
			let betTip = this.checkXianhong(betValue, BJLLogic.WIN_XIANDUI);
			if (!!betTip) {
				Tip.makeText("下注失败，此区域限红" + betTip);
				return;
			}
			Global.CCHelper.playPreSound();
			RoomAPI.gameMessageNotify(BJLProto.getPourGoldNotifyData(BJLLogic.WIN_XIANDUI, betValue));
		} else if (param === 'xiantw') {
			this.showClickEffect(this.xiantwArea);
			let betTip = this.checkXianhong(betValue, BJLLogic.WIN_XIANTW);
			if (!!betTip) {
				Tip.makeText("下注失败，此区域限红" + betTip);
				return;
			}
			Global.CCHelper.playPreSound();
			RoomAPI.gameMessageNotify(BJLProto.getPourGoldNotifyData(BJLLogic.WIN_XIANTW, betValue));
		} else if (param === 'hu') {
			this.showClickEffect(this.pingArea);
			let betTip = this.checkXianhong(betValue, BJLLogic.WIN_HE);
			if (!!betTip) {
				Tip.makeText("下注失败，此区域限红" + betTip);
				return;
			}
			Global.CCHelper.playPreSound();
			RoomAPI.gameMessageNotify(BJLProto.getPourGoldNotifyData(BJLLogic.WIN_HE, betValue));
		} else if (param === 'tongdianping') {
			this.showClickEffect(this.tongdianpingArea);
			let betTip = this.checkXianhong(betValue, BJLLogic.WIN_TONGDIANPING);
			if (!!betTip) {
				Tip.makeText("下注失败，此区域限红" + betTip);
				return;
			}
			Global.CCHelper.playPreSound();
			RoomAPI.gameMessageNotify(BJLProto.getPourGoldNotifyData(BJLLogic.WIN_TONGDIANPING, betValue));
		}
	},

	showClickEffect(area) {
		area.active = true;
		this.scheduleOnce(function () {
			area.active = false;
		}, 0.1)
	},

	//检测限红信息[返回null表示可以下注，返回字符串表示限红范围]
	checkXianhong: function (betValue, betType) {
		if (!!this.myBetRecord && !!this.myBetRecord[betType]) {
			betValue += this.myBetRecord[betType];
		}
		let tipContent = null;
		let redLimit = this.redLimitInfo[betType];
		if (betType == BJLLogic.WIN_ZHUANG || betType == BJLLogic.WIN_XIAN) {
			tipContent = this.xianXH.string;
		} else if (betType == BJLLogic.WIN_ZHUANGDUI || betType == BJLLogic.WIN_XIANDUI) {
			tipContent = this.xianDuiXH.string;
		} else if (betType == BJLLogic.WIN_ZHUANGTW || betType == BJLLogic.WIN_XIANTW) {
			tipContent = this.zhuangTWXH.string;
		} else if (betType == BJLLogic.WIN_HE) {
			tipContent = this.pingXH.string;
		} else if (betType == BJLLogic.WIN_TONGDIANPING) {
			tipContent = this.tongdianpingXH.string;
		}
		if (betValue > redLimit.max) {
			return tipContent;
		}
		return null;
	}
});