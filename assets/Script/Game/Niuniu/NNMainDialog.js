var NNModel = require('./NNModel');
var NNProto = require('./NNProto');
var RoomProto = require('../../API/RoomProto');
var HallApi = require('../../API/HallAPI');
let roomAPI = require('../../API/RoomAPI');
let Actions = require('../../Actions').Actions;
var RoomMessageRouter = 'game.gameHandler.roomMessageNotify';
var GameMessageRouter = 'game.gameHandler.gameMessageNotify';

cc.Class({
	extends: cc.Component,

	properties: {
		cardNodeArr: [cc.Node],
		headNodeArr: [cc.Node],

		audioItem: cc.Prefab,
		stateItem: cc.Prefab,
		statePoint: cc.Node,
		cuoPaiMask: cc.Node,
		rateBntArr: [cc.Node],
		pourBntArr: [cc.Node],
		exitPoint: cc.Node
	},

	onLoad: function () {
		var audioItem = cc.instantiate(this.audioItem);
		audioItem.parent = this.node;
		this.audioManager = audioItem.getComponent('NNAudioNode');
		// AudioMgr.startPlayBgMusic('Niuniu/sound/bg_music');
		this.dizhuLabel = cc.find("table/dizhuSprite/dizhuLabel", this.node).getComponent(cc.Label);
		this.dizhuLabel.string = "底注：" + NNModel.baseScore;


		this.cuoPaiToggle = this.node.getChildByName('table').getChildByName("cuopai_Toggle").getComponent(cc.Toggle);
		this.openCardNode = this.node.getChildByName('table').getChildByName("showOpenBntNode"); //摊牌按钮

		var self = this;
		//加载exit
		// AssetMgr.loadResSync("GameCommon/GameDropDownList/GameDropDownList", function (err, prefab) {

		this.exitPoint.getComponent('GameDropDownList').setGameInfo(NNModel.kindId, NNModel.profitPercentage);
		// });

		this.cuopaiPoint = this.node.getChildByName('table').getChildByName("cuopaiPoint");
		this.cuoPaiMask = this.cuopaiPoint.getChildByName("mask");

		this.pinNiuNode = this.node.getChildByName('table').getChildByName("pinNiuNode"); //拼牛
		this.label1 = this.pinNiuNode.getChildByName("label1").getComponent(cc.Label);
		this.label2 = this.pinNiuNode.getChildByName("label2").getComponent(cc.Label);
		this.label3 = this.pinNiuNode.getChildByName("label3").getComponent(cc.Label);
		this.labelSum = this.pinNiuNode.getChildByName("label4").getComponent(cc.Label);

		this.rateRobNode = this.node.getChildByName('table').getChildByName("RateRobNode"); // 抢庄按钮
		this.pourScoreNode = this.node.getChildByName('table').getChildByName("PourGoldNode"); //下注按钮

		this.zhuangjiaTongchi = this.node.getChildByName('table').getChildByName("zhuangjiaTongchi").getComponent(dragonBones.ArmatureDisplay);
		// var callFunc = function () {
		// 	this.zhuangjiaTongchi.node.active = false;
		// };
		// this.zhuangjiaTongchi.addEventListener(dragonBones.EventObject.COMPLETE, callFunc.bind(this));
		this.zhuangjiaTongchi.node.active = false;

		this.losewinDragon = this.node.getChildByName('table').getChildByName("jieSuan").getComponent(dragonBones.ArmatureDisplay);
		var callFunc1 = function () {
			this.losewinDragon.node.active = false;
		}
		this.losewinDragon.addEventListener(dragonBones.EventObject.COMPLETE, callFunc1.bind(this));


		this.cardItemArr = [];
		this.headItemArr = [];

		cc.instantiate(this.stateItem).parent = this.statePoint;
		Global.MessageCallback.addListener('RoomMessagePush', this);
		Global.MessageCallback.addListener('GameMessagePush', this);
		Global.MessageCallback.addListener('ReConnectSuccess', this);
		this.offLineAndClient();

		// 获取场景
		this.scheduleOnce(function () {
			roomAPI.roomMessageNotify(RoomProto.getRoomSceneInfoNotify());
		}, 0.2);
	},
	reset: function () {
		this.openCardNode.active = false;
		this.rateRobNode.active = false;
		this.pourScoreNode.active = false;
		this.zhuangjiaTongchi.node.active = false;
		this.losewinDragon.node.active = false;

		this.cuoPaiToggle.interactable = true;
		var isChecked = cc.sys.localStorage.getItem('NN_Toggle');
		if (isChecked === "Y")
			this.cuoPaiToggle.isChecked = true;
		else
			this.cuoPaiToggle.isChecked = false;

		this.pinNiuNode.active = false;
		this.label1.stirng = "";
		this.label2.stirng = "";
		this.label3.stirng = "";
		this.labelSum.stirng = "";
		this.statePoint.setPosition(0, 120);
		for (let i = 0; i < this.pourBntArr.length; i++) {
			this.pourBntArr[i].active = false;
		}
		for (let i = 0; i < this.rateRobNode.length; i++) {
			this.rateRobNode[i].active = false;
		}
	},

	// 恢复场景
	offLineAndClient: function () {
		this.reset();
		var chairCount = NNModel.getChairCount();
		var myChairId = NNModel.getMyChairId();
		var gameRule = NNModel.getGameRule();
		var self = this;
		var chairCount = NNModel.getChairCount();

		AssetMgr.loadResSync("Niuniu/NNHeadItem", cc.Prefab, function (err, prefab) {
			if (err) {
				cc.log("======加载NNHeadItem错误");
			} else {
				if (!cc.isValid(self)) {
					return;
				}
				for (let i = 0; i < chairCount; i++) {
					if (self.headItemArr[i]) continue; //

					let newPrefab = cc.instantiate(prefab);
					newPrefab.parent = self.headNodeArr[i];
					let headItemJs = newPrefab.getComponent("NNHeadItem");
					self.headItemArr[i] = newPrefab;
					newPrefab.active = false;
					if (NNModel.getPlayerByViewId(i)) {
						var chairId = NNModel.getChairIdByViewId(i);
						self.showHead(chairId, i);
						headItemJs.offLineAndClient();
					}
				}
			}
		});
		AssetMgr.loadResSync("Niuniu/NNCardItem0", cc.Prefab, function (err, prefab) {
			if (err) {
				cc.log("======加载NNCardItem0错误");
			} else {
				if (!cc.isValid(self)) {
					return;
				}
				for (let i = 0; i < chairCount; i++) {
					if (self.cardItemArr[i]) continue; //
					let newPrefab = cc.instantiate(prefab);
					newPrefab.parent = self.cardNodeArr[i];
					if (i === 3) {
						let layout = newPrefab.getChildByName("Layout");
						layout.width = 420;
						layout.getComponent(cc.Layout).spacingX = 105;
						let jiesuanNode = newPrefab.getChildByName("jiesuanNode");
						jiesuanNode.setPosition(0, 100);
					}
					let cardItemJs = newPrefab.getComponent("NNCardItem");
					newPrefab.active = false;
					self.cardItemArr[i] = newPrefab;
					if (NNModel.getPlayerByViewId(i)) {
						var chairId = NNModel.getChairIdByViewId(i);
						self.showCard(chairId, i);
						cardItemJs.offLineAndClient();
					}
				}
			}
		});


		var gameStatus = NNModel.getGameStatus();
		//状态的断线重连
		this.statePoint.getChildByName("NNStateItem").getComponent("NNStateItem").answerGameStatusPush(gameStatus, NNModel.Statustime);
		var myChairIndex = NNModel.getChairIdIndex(myChairId);
		//准备状态
		if (gameStatus === NNProto.GAME_STATUS_PREPARE) {
			Global.API.room.roomMessageNotify(RoomProto.userReadyNotify(true));
		}
		//抢庄状态
		else if (gameStatus === NNProto.GAME_STATUS_ROBBANK) {
			var robBankArr = NNModel.getRobBankArr();
			if (myChairIndex >= 0 && robBankArr[myChairId] === -1) {
				if (NNModel.Maxcallbanker)
					this.answerShowRobRateBtn(NNModel.Maxcallbanker);
			} else {
				this.rateRobNode.active = false;
			}
		}
		//押注状态
		else if (gameStatus === NNProto.GAME_STATUS_POURSCORE) {
			if (myChairIndex !== NNModel.getBankChairId()) {
				var pourScoreArr = NNModel.getPourScoreArr();
				if (myChairId >= 0 && pourScoreArr[myChairId] === 0) {
					this.answerCanPourScorePush(gameStatus, NNModel.addscoresArr, true);
				}
			}
		}
		//看牌中
		else if (gameStatus === NNProto.GAME_STATUS_SORTCARD) {
			this.pourScoreNode.active = false;
			var showCardArr = NNModel.getShowCardArr();
			if (myChairIndex >= 0 && showCardArr[myChairId] !== 1) {
				this.openCardNode.active = true; //打开摊牌按钮
				this.pinNiuNode.active = !this.cuoPaiToggle.isChecked;
			}
		}
	},

	messageCallbackHandler: function (router, msg) {
		var myChairId = NNModel.getMyChairId();
		if (router === 'RoomMessagePush') {
			//离开房间
			if (msg.type === RoomProto.USER_LEAVE_ROOM_RESPONSE) {
				if (msg.data.chairId === myChairId) {
					Waiting.hide();
				}
			}
			//其他玩家进入
			else if (msg.type === RoomProto.OTHER_USER_ENTRY_ROOM_PUSH) {
				let viewId = NNModel.getViewId(msg.data.roomUserInfo.chairId);
				var self = this;
				if (this.headItemArr[viewId] && this.cardItemArr[viewId]) {
					this.showHead(msg.data.roomUserInfo.chairId, viewId);
					this.showCard(msg.data.roomUserInfo.chairId, viewId);
				}
				//如果没有头像，重新加载
				else {
					AssetMgr.loadResSync("Niuniu/NNHeadItem", cc.Prefab, function (err, prefab) {
						if (err) {
							cc.log("======加载NNHeadItem错误");
						} else {
							if (!cc.isValid(self)) {
								return;
							}
							if (self.headItemArr[viewId]) return; //
							let newPrefab = cc.instantiate(prefab);
							newPrefab.parent = self.headNodeArr[viewId];
							self.headItemArr[viewId] = newPrefab;
							newPrefab.active = false;
							var chairId = NNModel.getChairIdByViewId(viewId);
							self.showHead(chairId, viewId);
							let headItemJs = newPrefab.getComponent("NNHeadItem");
							headItemJs.offLineAndClient();
						}
					});
					AssetMgr.loadResSync("Niuniu/NNCardItem0", cc.Prefab, function (err, prefab) {
						if (err) {
							cc.log("======加载NNCardItem0错误");
						} else {
							if (self.cardItemArr[viewId]) return; //
							if (!cc.isValid(self)) {
								return;
							}
							let newPrefab = cc.instantiate(prefab);
							newPrefab.parent = self.cardNodeArr[viewId];
							if (viewId === 3) {
								let layout = newPrefab.getChildByName("Layout");
								layout.width = 420;
								layout.getComponent(cc.Layout).spacingX = 105;
								let jiesuanNode = newPrefab.getChildByName("jiesuanNode");
								jiesuanNode.setPosition(0, 100);
							}
							newPrefab.active = false;
							self.cardItemArr[viewId] = newPrefab;
							var chairId = NNModel.getChairIdByViewId(viewId);
							self.showCard(chairId, viewId);
							let cardItemJs = newPrefab.getComponent("NNCardItem");
							cardItemJs.offLineAndClient();
						}
					});
				}

			}
			//离开房间
			else if (msg.type === RoomProto.USER_LEAVE_ROOM_PUSH) {
				if (msg.data.roomUserInfo.chairId === NNModel.getMyChairId()) {
					if (!Matching.isMatching) {
						this.exitGame();
					}
				} else {
					this.hideHeadItemByChairId(msg.data.roomUserInfo.chairId);
				}

			}
			//玩家准备
			else if (msg.type === RoomProto.USER_READY_PUSH) {
				this.answerUserReadyPush(msg.data.chairId);
			} else if (msg.type === RoomProto.GAME_END_PUSH) { } else if (msg.type === RoomProto.ROOM_DISMISS_PUSH) {
				Confirm.show("当前房间已解散！", () => {
					ViewMgr.goBackHall(Config.GameType.NN)
				})
			}
		} else if (router === 'GameMessagePush') {
			//最大抢庄倍数
			if (msg.type === NNProto.MAX_CALL_BANKER_PUSH) {
				this.answerShowRobRateBtn(NNModel.Maxcallbanker);
			}
			//抢庄回复
			else if (msg.type === NNProto.ROB_RATE_BANK_PUSH) {
				this.answerRobRateBank(msg.data.chairId);
			}
			//可以押注
			else if (msg.type === NNProto.CAN_POUR_SCORE_PUSH) {
				this.answerCanPourScorePush(msg.data.gameStatus, msg.data.addscoresArr, false);
			}
			//押注回复
			else if (msg.type === NNProto.POUR_SCORE_PUSH) {
				this.answerPourScorePush(msg.data.chairId);
			}
			//发牌
			else if (msg.type === NNProto.RESOUT_CARD_PUSH) {
				this.answerResoutCardPush();
			}
			//开牌
			else if (msg.type === NNProto.SHOW_CARD_PUSH) {
				this.answerShowCardPush(msg.data.chairId, msg.data.cardArr);
			}
			//游戏结束
			else if (msg.type === NNProto.GAME_RESOUT_PUSH) {
				this.answerGameResoutPush(msg.data.finalScoreArr, msg.data.bankIndex);
			}
			//游戏状态下推
			else if (msg.type === NNProto.GAME_STATUS_PUSH) {
				this.answerGameStatusPush(msg.data.gameStatus);
			} else if (msg.type === NNProto.CALLBANKARR_CHANGE_PUSH) {
				this.randBanker(msg.data)
			}

			// //断线重连 下推
			// else if (msg.type === RoomProto.USER_RECONNECT_PUSH) {
			// 	Global.DialogManager.destroyDialog('Niuniu/NNMainDialog');
			// 	NNModel.setGameData(msg.data.gameData);
			// 	Global.DialogManager.createDialog('Niuniu/NNMainDialog');
			// }
		}
		//断线重连
		else if (router === 'ReConnectSuccess') {
			//Global.NetworkManager.notify(RoomMessageRouter, RoomProto.getUserReconnectNotifyData());
			if (Global.Player.isInRoom()) {
				Global.API.hall.joinRoomRequest(NNModel.getRoomId(), function () {
					// Global.DialogManager.destroyDialog('Niuniu/NNMainDialog');
					// Global.DialogManager.createDialog('Niuniu/NNMainDialog');
					// Global.NetworkManager.notify(RoomMessageRouter, RoomProto.getUserReconnectNotifyData());
				}, undefined, Config.GameType.NN);
			} else {
				Confirm.show("当前房间已解散！", () => {
					this.exitGame();
				})
			}
		}
	},
	//可以押注
	answerCanPourScorePush: function (gameStatus, addscoresArr, isOffLine) {
		cc.log("======可以押注 下推 ");
		if (typeof addscoresArr === "undefined" || addscoresArr === null) return;

		this.pourScoreNode.active = true;
		for (let i = 0; i < addscoresArr.length; i++) {
			this.pourBntArr[i].active = true;
			this.pourBntArr[i].getChildByName("Label").getComponent(cc.Label).string = Math.floor(addscoresArr[i]) + "倍";
		}
	},

	answerPourScorePush: function (chairId) {
		if (chairId === NNModel.getMyChairId()) {
			this.pourScoreNode.active = false;
		}
	},

	answerResoutCardPush: function () {

	},

	answerFourCardPush: function () {
		var myChairIndex = NNModel.getChairIdIndex(NNModel.getMyChairId());
	},

	//游戏结果下推
	answerGameResoutPush: function (finalScoreArr, bankIndex) {
		this.statePoint.setPosition(0, 120);
		var posArr = [];
		for (var m = 0; m < this.headItemArr.length; ++m) {
			var pos = this.headNodeArr[m].getPosition();
			posArr[m] = {
				x: pos.x,
				y: pos.y
			};
		}
		var myChairId = NNModel.getMyChairId();
		var myChairIndex = NNModel.getChairIdIndex(myChairId);
		if (myChairIndex < 0) return;
		var bankChairId = NNModel.getChairIdByIndex(bankIndex);
		var chairCount = NNModel.getChairCount();

		var self = this;
		//然后庄家 飞向其它玩家
		var callFunc = function () {
			for (var i = 0; i < finalScoreArr.length; ++i) {
				if (i !== bankChairId) {
					if (finalScoreArr[i] > 0) {
						var sPos = posArr[NNModel.getViewId(bankChairId)];
						var ePos = posArr[NNModel.getViewId(i)];
						self.playGoldAnimal(self.node, sPos, ePos);
					}
				}
			}
		};
		//首先其它玩家 飞向庄家
		for (var i = 0; i < finalScoreArr.length; ++i) {
			if (i !== bankChairId) {
				if (finalScoreArr[i] < 0) {
					var sPos = posArr[NNModel.getViewId(i)];
					var ePos = posArr[NNModel.getViewId(bankChairId)];
					this.playGoldAnimal(this.node, sPos, ePos);
				}
			}
		}
		this.scheduleOnce(callFunc, 0.65);

		var myScore = finalScoreArr[myChairId];
		let winCount = 0;
		let loseCount = 0;
		var bankerScore = finalScoreArr[bankChairId];
		//庄家通吃 动画
		for (let i = 0; i < finalScoreArr.length; i++) {
			if (i === bankChairId) continue;
			if (bankerScore > finalScoreArr[i] && finalScoreArr[i] <= 0)
				winCount++;
			if (bankerScore < finalScoreArr[i] && finalScoreArr[i] >= 0)
				loseCount++;
		}
		if (winCount === finalScoreArr.length - 1 && NNModel.userArr.length > 2) {
			this.playZJTCAnimation();
			// this.zhuangjiaTongchi.node.active = true;
			// this.zhuangjiaTongchi.playAnimation("zjtc", 1);
			AudioMgr.playSound('GameCommon/NN/sound1/winAll');
		} else if (loseCount === finalScoreArr.length - 1 && NNModel.userArr.length > 2) {
			// this.zhuangjiaTongchi.node.active = true;
			// this.zhuangjiaTongchi.playAnimation("zjtp", 1);
			this.playZJTPAnimation();
			AudioMgr.playSound('GameCommon/NN/sound1/loseAll');
		} else if (myScore >= 0) {
			this.losewinDragon.node.active = true;
			this.losewinDragon.playAnimation("niyingle", 1);
			AudioMgr.playSound('GameCommon/Sound/win_game');
		} else {
			this.losewinDragon.node.active = true;
			this.losewinDragon.playAnimation("nishule", 1);
			AudioMgr.playSound('GameCommon/NN/Audio1/losegame');
		}
	},
	//隐藏动画
	animationPlayComplete() {
		// let animationArr = [];
		// animationArr.push(cc.fadeOut(1));
		// animationArr.push(cc.callFunc(function () {
		this.zhuangjiaTongchi.node.active = false;
		// 	this.zhuangjiaTongchi.node.opacity = 255;
		// }.bind(this)));
		// this.zhuangjiaTongchi.node.runAction(cc.sequence(animationArr));
		this.zhuangjiaTongchi.removeEventListener(dragonBones.EventObject.COMPLETE, this.animationPlayComplete, this);
	},

	//播放庄家通吃动画
	playZJTCAnimation() {
		this.zhuangjiaTongchi.node.active = true;
		this.zhuangjiaTongchi.addEventListener(dragonBones.EventObject.COMPLETE, this.animationPlayComplete, this);
		this.zhuangjiaTongchi.playAnimation("tongchi", 1);
	},

	//播放庄家通赔动画
	playZJTPAnimation() {
		this.zhuangjiaTongchi.node.active = true;
		this.zhuangjiaTongchi.addEventListener(dragonBones.EventObject.COMPLETE, this.animationPlayComplete, this);
		this.zhuangjiaTongchi.playAnimation("tongpei", 1);
	},
	//摊牌
	answerShowCardPush: function (chairId, cardArr) {
		if (chairId === NNModel.getMyChairId()) {
			this.openCardNode.active = false;
			this.pinNiuNode.active = false;
		}
	},

	answerGameStatusPush: function (gameStatus) {
		//准备中
		if (gameStatus === NNProto.GAME_STATUS_PREPARE) {
			this.reset()
		}
		//抢庄中
		else if (gameStatus === NNProto.GAME_STATUS_ROBBANK) {
			// var gameRule = NNModel.getGameRule();
			// this.showRateRobButton();
		}
		//押注中
		else if (gameStatus === NNProto.GAME_STATUS_POURSCORE) { }
		//看牌中
		else if (gameStatus === NNProto.GAME_STATUS_SORTCARD) {
			this.pourScoreNode.active = false;
		}
	},
	//抢庄最大倍数下推
	answerShowRobRateBtn: function (maxRobRate) {
		if (typeof maxRobRate === "undefined") return;
		this.rateRobNode.active = true;
		if (maxRobRate === 0) {
			this.rateBntArr[0].active = true;
		} else {
			for (let i = 0; i < Math.floor(maxRobRate); i++) {
				this.rateBntArr[i].active = true;
			}
		}
	},
	answerRobRateBank: function (chairId) {
		if (chairId === NNModel.getMyChairId()) {
			this.rateRobNode.active = false;
		}
	},

	answerUserReadyPush: function (chairId) {
		// if(chairId === NNModel.getMyChairId()) {
		// 	if(this.autoExitCall) {
		// 		this.unschedule(this.autoExitCall);
		// 	}
		// }
	},

	// showRateRobButton: function () {
	// 	this.rateRobNode.active = true;
	//
	// },

	onButtonClick: function (event, param) {
		if (param === 'ready') {
			Global.NetworkManager.notify(RoomMessageRouter, RoomProto.userReadyNotify(true));
		} else if (param === 'free_rob') {
			Global.NetworkManager.notify(GameMessageRouter, NNProto.getRobFreeBankNotifyData(true));
		} else if (param === 'free_no_rob') {
			Global.NetworkManager.notify(GameMessageRouter, NNProto.getRobFreeBankNotifyData(false));
		} else if (param === 'no_rob') {
			Global.NetworkManager.notify(GameMessageRouter, NNProto.getRobRateBankNotifyData(0));
		} else if (param === 'rob_1') {
			Global.NetworkManager.notify(GameMessageRouter, NNProto.getRobRateBankNotifyData(1));
		} else if (param === 'rob_2') {
			Global.NetworkManager.notify(GameMessageRouter, NNProto.getRobRateBankNotifyData(2));
		} else if (param === 'rob_4') {
			Global.NetworkManager.notify(GameMessageRouter, NNProto.getRobRateBankNotifyData(3));
		} else if (param === 'pour_1') {
			Global.NetworkManager.notify(GameMessageRouter, NNProto.getPourScoreNotifyData(NNModel.addscoresArr[0]));
		} else if (param === 'pour_2') {
			Global.NetworkManager.notify(GameMessageRouter, NNProto.getPourScoreNotifyData(NNModel.addscoresArr[1]));
		} else if (param === 'pour_3') {
			Global.NetworkManager.notify(GameMessageRouter, NNProto.getPourScoreNotifyData(NNModel.addscoresArr[2]));
		} else if (param === 'pour_4') {
			Global.NetworkManager.notify(GameMessageRouter, NNProto.getPourScoreNotifyData(NNModel.addscoresArr[3]));
		} else if (param === 'pour_5') {
			Global.NetworkManager.notify(GameMessageRouter, NNProto.getPourScoreNotifyData(NNModel.addscoresArr[4]));
		} else if (param === 'kaipai' || param === "youniu") {
			Global.NetworkManager.notify(GameMessageRouter, NNProto.getShowCardNotifyData());
		} else if (param === "toggle") {
			var isChecked = this.cuoPaiToggle.isChecked;
			var temp = "N";
			if (isChecked)
				temp = "Y";
			cc.sys.localStorage.setItem('NN_Toggle', temp);
		}
		// AudioMgr.playSound("GameCommon/Sound/button-click");
		Global.CCHelper.playPreSound();
	},
	exitGame: function () {
		ViewMgr.goBackHall(Config.GameType.NN);
	},

	showHead: function (chairId, viewId) {
		var chairId = chairId || NNModel.getChairIdByViewId(viewId);

		var viewId = viewId || NNModel.getViewId(chairId);
		// this.headItemArr[viewId].active = true;
		var headMgr = this.headItemArr[viewId].getComponent('NNHeadItem');
		let pos = ['bottom', 'right', 'right', 'top', 'left', 'left'][viewId];
		headMgr.setHeadPosAndChairId(pos, chairId);
	},
	//显示头像和卡牌信息
	showCard: function (chairId, viewId) {
		var chairId = chairId || NNModel.getChairIdByViewId(viewId);

		var viewId = viewId || NNModel.getViewId(chairId);

		if (this.cardItemArr[viewId])
			this.cardItemArr[viewId].active = true;
		var cardMgr = this.cardItemArr[viewId].getComponent('NNCardItem');
		var pos = ['bottom', 'right', 'right', 'top', 'left', 'left'][viewId];
		cardMgr.setCardPosAndChairId(pos, chairId);
	},

	hideHeadItemByChairId: function (chairId) {
		var myChairId = NNModel.getMyChairId();
		var viewId = NNModel.getViewId(chairId);
		if (this.headItemArr[viewId])
			this.headItemArr[viewId].active = false;
		if (this.cardItemArr[viewId])
			this.cardItemArr[viewId].active = false;
	},


	getBezierPosArr: function (startPos, endPos) {
		var midPos = cc.v2((startPos.x + endPos.x) / 2, (startPos.y + endPos.y) / 2);
		return [startPos, midPos, endPos];
	},

	playGoldAnimal: function (pNode, sPos, ePos, cb) {
		if (!pNode || !sPos || !ePos) return;
		var nodeArr = [];
		var goldCount = 10;
		var offPos = [{
			x: -3,
			y: 3
		}, {
			x: 3,
			y: 3
		}, {
			x: 0,
			y: -3
		}];
		for (var i = 0; i < goldCount; ++i) {
			nodeArr.push(new cc.Node());
			Global.CCHelper.updateSpriteFrame('GameCommon/NN/Common1/nn_gold', nodeArr[i].addComponent(cc.Sprite));
			nodeArr[i].parent = pNode;
			var pos = new cc.Vec2(sPos.x + offPos[i % 3].x, sPos.y + offPos[i % 3].y);
			nodeArr[i].setPosition(pos);
		}
		i = 0;
		//var delay = Math.sqrt((sPos.x-ePos.x)*(sPos.x-ePos.x)+(sPos.y-ePos.y)*(sPos.y-ePos.y))/1500;
		var delay = 0.5;
		var self = this;
		var callFunc = function () {
			if (i < goldCount) {
				nodeArr[i].active = true;
				var pos = new cc.Vec2(ePos.x + offPos[i % 3].x, ePos.y + offPos[i % 3].y);
				nodeArr[i].runAction(cc.moveTo(delay - i * 0.03, pos));
				if (i % 2 === 0)
					AudioMgr.playSound('GameCommon/Sound/win_bet');
				++i;
			} else {
				self.unschedule(callFunc);
			}
		};
		this.schedule(callFunc, 0.03);
		this.scheduleOnce(function () {
			for (i = 0; i < goldCount; ++i) {
				nodeArr[i].removeFromParent();
			}
			if (cb) {
				cb();
			}
		}, delay + 0.15);
	},

	getHeadItemByChairId: function (chairId) {
		var myChairId = NNModel.getMyChairId();
		var chairCount = NNModel.getChairCount();
		var index = (chairId + chairCount - myChairId) % chairCount;
		return this.headItemArr[index];
	},

	doSendCardFinish: function () {

		this.openCardNode.active = !this.cuoPaiToggle.isChecked;
		this.setYouNiuBtnEnable(false);
		if (this.cuoPaiToggle.isChecked) {
			this.pinNiuNode.active = false;
		} else {
			this.pinNiuNode.active = true;
			this.updateJiSuan([]);
			// this.cardItemArr[1].setClickEnabled(true);
		}

	},
	//置灰 有牛
	setYouNiuBtnEnable: function (enable) {
		let youNiuBtn = this.openCardNode.getChildByName("youNiu_Bnt").getComponent(cc.Button);
		youNiuBtn.interactable = enable; //先置灰
	},
	//更新计算信息
	updateJiSuan: function (dataArray) {
		if (dataArray[0] == null)
			this.label1.string = "";
		else
			this.label1.string = Math.floor(dataArray[0]);
		if (dataArray[1] == null)
			this.label2.string = "";
		else
			this.label2.string = Math.floor(dataArray[1]);
		if (dataArray[2] == null)
			this.label3.string = "";
		else
			this.label3.string = Math.floor(dataArray[2]);
		if (dataArray.length == 3)
			this.labelSum.string = Math.floor(dataArray[0] + dataArray[1] + dataArray[2]);
		else
			this.labelSum.string = "";

	},

	onDestroy: function () {
		Global.MessageCallback.removeListener('RoomMessagePush', this);
		Global.MessageCallback.removeListener('GameMessagePush', this);
		Global.MessageCallback.removeListener('ReConnectSuccess', this);
	},

	getAudioManager: function () {
		return this.audioManager;
	},

	randBanker: function (data) {
		let nodearr = []
		if (data.bankerarr.length > 1) {
			for (let i = 0; i < data.bankerarr.length; i++) {
				let viewId = NNModel.getViewId(data.bankerarr[i]);
				nodearr.push(this.headItemArr[viewId].getChildByName('randBankerFrame'))
			}
		}
		Actions.RandBanker(nodearr)
	}
});