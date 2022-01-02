var MPNNModel = require('./MPNNModel');
var MPNNProto = require('./MPNNProto');
var RoomProto = require('../../API/RoomProto');
var HallApi = require('../../API/HallAPI');
let Actions = require('../../Actions').Actions;
var RoomMessageRouter = 'game.gameHandler.roomMessageNotify';
var GameMessageRouter = 'game.gameHandler.gameMessageNotify';
let roomAPI = require('../../API/RoomAPI');

cc.Class({
	extends: cc.Component,

	properties: {
		cardNodeArr: [cc.Node],
		headNodeArr: [cc.Node],
		pourScoreNode: cc.Node, //下注按钮
		openCardNode: cc.Node, //摊牌按钮
		rateRobNode: cc.Node,
		dizhuLabel: cc.Label,
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
		this.dizhuLabel.string = "底注：" + MPNNModel.baseScore;

		this.exitPoint.getComponent('GameDropDownList').setGameInfo(MPNNModel.kindId, MPNNModel.profitPercentage);

		this.cuopaiPoint = this.node.getChildByName("cuopaiPoint");
		this.cuoPaiMask = this.cuopaiPoint.getChildByName("mask");

		this.zhuangjiaTongchi = this.node.getChildByName("zhuangjiaTongchi").getComponent(dragonBones.ArmatureDisplay);
		var callFunc = function () {
			this.zhuangjiaTongchi.node.active = false;
		};
		this.zhuangjiaTongchi.addEventListener(dragonBones.EventObject.COMPLETE, callFunc.bind(this));
		this.zhuangjiaTongchi.node.active = false;
		this.losewinDragon = this.node.getChildByName("jieSuan").getComponent(dragonBones.ArmatureDisplay);
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
		this.losewinDragon.node.active = false;

		// this.pinNiuNode.active = false;
		// this.label1.stirng = "";
		// this.label2.stirng = "";
		// this.label3.stirng = "";
		// this.labelSum.stirng = "";
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
		var chairCount = MPNNModel.getChairCount();
		var myChairId = MPNNModel.getMyChairId();
		var gameRule = MPNNModel.getGameRule();
		var self = this;
		var chairCount = MPNNModel.getChairCount();

		AssetMgr.loadResSync("MingPaiNiuniu/MPNNHeadItem", cc.Prefab, function (err, prefab) {
			if (err) {
				cc.log("======加载NNHeadItem错误");
			} else {
				if (!cc.isValid(self)) {
					return;
				}

				for (let i = 0; i < chairCount; i++) {
					console.log("debug::初始化玩家");
					if (self.headItemArr[i]) continue;
					let newPrefab = cc.instantiate(prefab);
					newPrefab.parent = self.headNodeArr[i];
					let headItemJs = newPrefab.getComponent("MPNNHeadItem");
					self.headItemArr[i] = newPrefab;
					newPrefab.active = false;
					if (MPNNModel.getPlayerByViewId(i)) {
						var chairId = MPNNModel.getChairIdByViewId(i);
						self.showHead(chairId, i);
						headItemJs.offLineAndClient();
					}
				}
			}
		});
		AssetMgr.loadResSync("MingPaiNiuniu/MPNNCardItem0", cc.Prefab, function (err, prefab) {
			if (err) {
				cc.log("======加载NNCardItem0错误");
			} else {
				if (!cc.isValid(self)) {
					return;
				}
				for (let i = 0; i < chairCount; i++) {
					if (self.cardItemArr[i]) continue;
					let newPrefab = cc.instantiate(prefab);
					newPrefab.parent = self.cardNodeArr[i];
					if (i === 3) {
						let layout = newPrefab.getChildByName("Layout");
						layout.width = 420;
						layout.getComponent(cc.Layout).spacingX = 105;
						let jiesuanNode = newPrefab.getChildByName("jiesuanNode");
						jiesuanNode.setPosition(0, 100);
					}
					let cardItemJs = newPrefab.getComponent("MPNNCardItem");
					newPrefab.active = false;
					self.cardItemArr[i] = newPrefab;
					if (MPNNModel.getPlayerByViewId(i)) {
						var chairId = MPNNModel.getChairIdByViewId(i);
						self.showCard(chairId, i);

						cardItemJs.offLineAndClient();
					}
				}


				console.warn("debug::创建手牌完成", JSON.stringify(self.cardItemArr[0].getPosition()));
			}
		});

		var gameStatus = MPNNModel.getGameStatus();
		//状态的断线重连
		this.statePoint.getChildByName("MPNNStateItem").getComponent("MPNNStateItem").answerGameStatusPush(gameStatus, MPNNModel.Statustime);
		var myChairIndex = MPNNModel.getChairIdIndex(myChairId);
		// if (myChairIndex < 0) return; //如果 我没有在 游戏中， 不做断线重连
		//准备状态
		if (gameStatus === MPNNProto.GAME_STATUS_PREPARE) {
			// this.reset();
			Global.API.room.roomMessageNotify(RoomProto.userReadyNotify(true));

		}
		//抢庄状态
		else if (gameStatus === MPNNProto.GAME_STATUS_ROBBANK) {
			var robBankArr = MPNNModel.getRobBankArr();
			//如果
			if (!this.rateRobNode.active) {
				if (myChairIndex >= 0 && robBankArr[myChairId] === -1) {
					if (MPNNModel.Maxcallbanker)
						this.answerShowRobRateBtn(MPNNModel.Maxcallbanker);
				} else {
					this.rateRobNode.active = false;
				}
			}
		}
		//押注状态
		else if (gameStatus === MPNNProto.GAME_STATUS_POURSCORE) {
			if (myChairId !== MPNNModel.getBankChairId()) {
				var pourScoreArr = MPNNModel.getPourScoreArr();
				if (myChairIndex >= 0 && pourScoreArr[myChairId] === 0) {
					this.answerCanPourScorePush(gameStatus, MPNNModel.addscoresArr, true);

					// this.answerCanPourScorePush(gameStatus, MPNNModel.getCanPourScoreArr(), true);
				}
			}
		}
		//看牌中
		else if (gameStatus === MPNNProto.GAME_STATUS_SORTCARD) {
			this.pourScoreNode.active = false;
			var showCardArr = MPNNModel.getShowCardArr();
			if (myChairIndex >= 0 && showCardArr[myChairId] !== 1) {
				this.openCardNode.active = true; //打开摊牌按钮
			}
		}
	},

	messageCallbackHandler: function (router, msg) {
		var myChairId = MPNNModel.getMyChairId();
		if (router === 'RoomMessagePush') {
			//离开房间
			if (msg.type === RoomProto.USER_LEAVE_ROOM_RESPONSE) {
				if (msg.data.chairId === myChairId) {
					Waiting.hide();
				}
			}
			//其他玩家进入
			else if (msg.type === RoomProto.OTHER_USER_ENTRY_ROOM_PUSH) {
				console.log("debug::有玩家进入", msg);
				let viewId = MPNNModel.getViewId(msg.data.roomUserInfo.chairId);
				if (this.headItemArr[viewId] && this.cardItemArr[viewId]) {
					this.showHead(msg.data.roomUserInfo.chairId, viewId);
					this.showCard(msg.data.roomUserInfo.chairId, viewId);
				}
				//如果没有头像，重新加载
				else {
					var self = this;
					AssetMgr.loadResSync("MingPaiNiuniu/MPNNHeadItem", cc.Prefab, function (err, prefab) {
						if (err) {
							cc.log("======加载MingPaiNiuniu错误");
						} else {
							if (!cc.isValid(self)) {
								return;
							}
							if (self.headItemArr[viewId]) return; //
							let newPrefab = cc.instantiate(prefab);
							newPrefab.parent = self.headNodeArr[viewId];
							self.headItemArr[viewId] = newPrefab;
							newPrefab.active = false;
							var chairId = MPNNModel.getChairIdByViewId(viewId);
							self.showHead(chairId, viewId);
							let headItemJs = newPrefab.getComponent("MPNNHeadItem");
							headItemJs.offLineAndClient();
						}
					});
					AssetMgr.loadResSync("MingPaiNiuniu/MPNNCardItem0", cc.Prefab, function (err, prefab) {
						if (err) {
							cc.log("======加载MPNNCardItem0错误");
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
							var chairId = MPNNModel.getChairIdByViewId(viewId);
							self.showCard(chairId, viewId);
							let cardItemJs = newPrefab.getComponent("MPNNCardItem");
							cardItemJs.offLineAndClient();
						}
					});
				}
			}
			//离开房间
			else if (msg.type === RoomProto.USER_LEAVE_ROOM_PUSH) {
				if (msg.data.roomUserInfo.chairId === MPNNModel.getMyChairId()) {
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
			} else if (msg.type === RoomProto.GAME_END_PUSH) { }
			else if (msg.type === RoomProto.ROOM_DISMISS_PUSH) {
				Confirm.show("当前房间已解散！", () => {
					ViewMgr.goBackHall(Config.GameType.MPNN)
				})
			}
		} else if (router === 'GameMessagePush') {
			//最大抢庄倍数
			if (msg.type === MPNNProto.MAX_CALL_BANKER_PUSH) { }
			//抢庄回复
			else if (msg.type === MPNNProto.ROB_RATE_BANK_PUSH) {
				this.answerRobRateBank(msg.data.chairId);
			}
			// 庄家变化下推
			else if (msg.type === MPNNProto.BANK_CHANGE_PUSH) {

				this.rateRobNode.active = false;
			}
			//可以押注
			else if (msg.type === MPNNProto.CAN_POUR_SCORE_PUSH) {
				this.answerCanPourScorePush(msg.data.gameStatus, msg.data.addscoresArr, false);

				// this.answerCanPourScorePush(msg.data.gameStatus, msg.data.scoresArr, false);
			}
			//押注回复
			else if (msg.type === MPNNProto.POUR_SCORE_PUSH) {
				this.answerPourScorePush(msg.data.chairId);
			}
			//发牌
			else if (msg.type === MPNNProto.RESOUT_CARD_PUSH) {
				this.answerResoutCardPush();
			}
			//开牌
			else if (msg.type === MPNNProto.SHOW_CARD_PUSH) {
				this.answerShowCardPush(msg.data.chairId, msg.data.cardArr);
			}
			//游戏结束
			else if (msg.type === MPNNProto.GAME_RESOUT_PUSH) {
				this.answerGameResoutPush(msg.data.finalScoreArr, msg.data.bankIndex);
			}
			//游戏状态下推
			else if (msg.type === MPNNProto.GAME_STATUS_PUSH) {
				this.answerGameStatusPush(msg.data.gameStatus);
			} else if (msg.type === MPNNProto.CALLBANKARR_CHANGE_PUSH) {
				this.randBanker(msg.data)
			}
			// //断线重连 下推
			// else if (msg.type === RoomProto.USER_RECONNECT_PUSH) {
			// 	Global.DialogManager.destroyDialog('MingPaiNiuniu/MPNNMainDialog');
			// 	MPNNModel.setGameData(msg.data.gameData);
			// 	Global.DialogManager.createDialog('MingPaiNiuniu/MPNNMainDialog');
			// }
		}
		//断线重连
		else if (router === 'ReConnectSuccess') {
			//Global.NetworkManager.notify(RoomMessageRouter, RoomProto.getUserReconnectNotifyData());
			if (Global.Player.isInRoom()) {
				Global.API.hall.joinRoomRequest(MPNNModel.getRoomId(), function () {
					// Global.NetworkManager.notify(RoomMessageRouter, RoomProto.getUserReconnectNotifyData());
				}, undefined, Config.GameType.MPNN);
			} else {
				Confirm.show("当前房间已解散！", () => {
					this.exitGame()
				})
			}
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
	//可以押注
	answerCanPourScorePush: function (gameStatus, addscoresArr, isOffLine) {
		if (typeof addscoresArr === "undefined" || addscoresArr === null) return;

		this.pourScoreNode.active = true;
		for (let i = 0; i < addscoresArr.length; i++) {
			this.pourBntArr[i].active = true;
			this.pourBntArr[i].getChildByName("Label").getComponent(cc.Label).string = Math.floor(addscoresArr[i]) + "倍";
		}
	},

	answerPourScorePush: function (chairId) {
		if (chairId === MPNNModel.getMyChairId()) {
			this.pourScoreNode.active = false;
		}
	},

	answerResoutCardPush: function () {
		// this.scheduleOnce(function() {
		// 	this.openCardNode.active = true;
		// }.bind(this), 0.2);
	},

	answerFourCardPush: function () {
		var myChairIndex = MPNNModel.getChairIdIndex(MPNNModel.getMyChairId());
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
		var myChairId = MPNNModel.getMyChairId();
		var myChairIndex = MPNNModel.getChairIdIndex(myChairId);
		var bankChairId = MPNNModel.getChairIdByIndex(bankIndex);
		var chairCount = MPNNModel.getChairCount();

		var self = this;
		var callFunc = function () {
			for (var i = 0; i < finalScoreArr.length; ++i) {
				if (i !== bankChairId) {
					if (finalScoreArr[i] > 0) {

						var sPos = posArr[MPNNModel.getViewId(bankChairId)];
						var ePos = posArr[MPNNModel.getViewId(i)];
						self.playGoldAnimal(self.node, sPos, ePos);
					}
				}
			}
		};
		for (var i = 0; i < finalScoreArr.length; ++i) {
			if (i !== bankChairId) {
				if (finalScoreArr[i] < 0) {

					var sPos = posArr[MPNNModel.getViewId(i)];
					var ePos = posArr[MPNNModel.getViewId(bankChairId)];
					this.playGoldAnimal(this.node, sPos, ePos);
					if (!sPos) {
						cc.error("====sPos:%s,viewId:%s,", sPos, MPNNModel.getViewId(i));
						for (let j = 0; j < finalScoreArr.length; j++) {
							cc.error("====finalScoreArr[%s]:%s", j, finalScoreArr[j]);
						}
						for (let j = 0; j < this.headItemArr.length; j++) {
							cc.error("==== this.headItemArr[%s]:%s", j, this.headItemArr[j]);
							cc.error("==== posArr[%s]:%s", j, posArr[j]);
						}
					}
				}
			}
		}
		this.scheduleOnce(callFunc, 0.65);

		let winCount = 0;
		let loseCount = 0;
		var bankerScore = finalScoreArr[bankChairId];
		var myScore = finalScoreArr[myChairId];
		for (let i = 0; i < finalScoreArr.length; i++) {
			if (i === bankChairId) continue;
			if (bankerScore > finalScoreArr[i] && finalScoreArr[i] <= 0)
				winCount++;
			if (bankerScore < finalScoreArr[i] && finalScoreArr[i] >= 0)
				loseCount++;
		}
		if (winCount === finalScoreArr.length - 1 && MPNNModel.userArr.length > 2) {
			this.zhuangjiaTongchi.node.active = true;
			this.zhuangjiaTongchi.playAnimation("tongchi", 1);
			AudioMgr.playSound('GameCommon/NN/sound1/winAll');
		} else if (loseCount === finalScoreArr.length - 1 && MPNNModel.userArr.length > 2) {
			this.zhuangjiaTongchi.node.active = true;
			this.zhuangjiaTongchi.playAnimation("tongpei", 1);
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
	//摊牌
	answerShowCardPush: function (chairId, cardArr) {
		if (chairId === MPNNModel.getMyChairId()) {
			this.openCardNode.active = false;
			// this.pinNiuNode.active = false;
		}
	},

	answerGameStatusPush: function (gameStatus) {
		//准备中
		if (gameStatus === MPNNProto.GAME_STATUS_PREPARE) {
			this.reset()
		}
		//抢庄中
		else if (gameStatus === MPNNProto.GAME_STATUS_ROBBANK) {


		}
		//押注中
		else if (gameStatus === MPNNProto.GAME_STATUS_POURSCORE) { }
		//看牌中
		else if (gameStatus === MPNNProto.GAME_STATUS_SORTCARD) {
			this.pourScoreNode.active = false;
		}
	},

	answerRobRateBank: function (chairId) {
		if (chairId === MPNNModel.getMyChairId()) {
			this.rateRobNode.active = false;
		}
	},

	answerUserReadyPush: function (chairId) {
		// if(chairId === MPNNModel.getMyChairId()) {
		// 	if(this.autoExitCall) {
		// 		this.unschedule(this.autoExitCall);
		// 	}
		// }
	},



	onButtonClick: function (event, param) {
		if (param === 'ready') {
			Global.NetworkManager.notify(RoomMessageRouter, RoomProto.userReadyNotify(true));
		} else if (param === 'free_rob') {
			Global.NetworkManager.notify(GameMessageRouter, MPNNProto.getRobFreeBankNotifyData(true));
		} else if (param === 'free_no_rob') {
			Global.NetworkManager.notify(GameMessageRouter, MPNNProto.getRobFreeBankNotifyData(false));
		} else if (param === 'no_rob') {
			Global.NetworkManager.notify(GameMessageRouter, MPNNProto.getRobRateBankNotifyData(0));
		} else if (param === 'rob_1') {
			Global.NetworkManager.notify(GameMessageRouter, MPNNProto.getRobRateBankNotifyData(1));
		} else if (param === 'rob_2') {
			Global.NetworkManager.notify(GameMessageRouter, MPNNProto.getRobRateBankNotifyData(2));
		} else if (param === 'rob_4') {
			Global.NetworkManager.notify(GameMessageRouter, MPNNProto.getRobRateBankNotifyData(3));
		} else if (param === 'pour_1') {
			Global.NetworkManager.notify(GameMessageRouter, MPNNProto.getPourScoreNotifyData(MPNNModel.addscoresArr[0]));
		} else if (param === 'pour_2') {
			Global.NetworkManager.notify(GameMessageRouter, MPNNProto.getPourScoreNotifyData(MPNNModel.addscoresArr[1]));
		} else if (param === 'pour_3') {
			Global.NetworkManager.notify(GameMessageRouter, MPNNProto.getPourScoreNotifyData(MPNNModel.addscoresArr[2]));
		} else if (param === 'pour_4') {
			Global.NetworkManager.notify(GameMessageRouter, MPNNProto.getPourScoreNotifyData(MPNNModel.addscoresArr[3]));
		} else if (param === 'pour_5') {
			Global.NetworkManager.notify(GameMessageRouter, MPNNProto.getPourScoreNotifyData(MPNNModel.addscoresArr[4]));
		} else if (param === 'kaipai' || param === "youniu") {
			Global.NetworkManager.notify(GameMessageRouter, MPNNProto.getShowCardNotifyData());
		}
		Global.CCHelper.playPreSound();
		// AudioMgr.playSound("GameCommon/Sound/button-click");

	},
	exitGame: function () {
		ViewMgr.goBackHall(Config.GameType.MPNN);
	},
	showHead: function (chairId, viewId) {
		var chairId = chairId || MPNNModel.getChairIdByViewId(viewId);

		var viewId = viewId || MPNNModel.getViewId(chairId);
		// this.headItemArr[viewId].active = true;
		var headMgr = this.headItemArr[viewId].getComponent('MPNNHeadItem');
		let pos = ['bottom', 'right', 'right', 'top', 'left', 'left'][viewId];
		headMgr.setHeadPosAndChairId(pos, chairId);

	},
	//显示头像和卡牌信息
	showCard: function (chairId, viewId) {
		var chairId = chairId || MPNNModel.getChairIdByViewId(viewId);

		var viewId = viewId || MPNNModel.getViewId(chairId);

		this.cardItemArr[viewId].active = true;
		var cardMgr = this.cardItemArr[viewId].getComponent('MPNNCardItem');
		var pos = ['bottom', 'right', 'right', 'top', 'left', 'left'][viewId];
		cardMgr.setCardPosAndChairId(pos, chairId);
	},

	hideHeadItemByChairId: function (chairId) {
		var myChairId = MPNNModel.getMyChairId();
		var viewId = MPNNModel.getViewId(chairId);
		this.headItemArr[viewId].active = false;
		this.cardItemArr[viewId].active = false;
	},


	getBezierPosArr: function (startPos, endPos) {
		var midPos = cc.v2((startPos.x + endPos.x) / 2, (startPos.y + endPos.y) / 2);
		return [startPos, midPos, endPos];
	},

	playGoldAnimal: function (pNode, sPos, ePos, cb) {
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
		var myChairId = MPNNModel.getMyChairId();
		var chairCount = MPNNModel.getChairCount();
		var index = (chairId + chairCount - myChairId) % chairCount;
		return this.headItemArr[index];
	},
	doSendFirstCardFinish: function () {
		setTimeout(function () {
			if (!cc.isValid(this)) {
				return;
			}
			this.answerShowRobRateBtn(MPNNModel.Maxcallbanker);
		}.bind(this), 500)

	},
	doSendCardFinish: function () {
		this.openCardNode.active = true;
		// this.setYouNiuBtnEnable(false);
	},
	//置灰 有牛
	setYouNiuBtnEnable: function (enable) {
		// let youNiuBtn = this.openCardNode.getChildByName("youNiu_Bnt").getComponent(cc.Button);
		// youNiuBtn.interactable = enable; //先置灰
	},
	//更新计算信息
	// updateJiSuan: function (dataArray) {
	// 	if (dataArray[0] == null)
	// 		this.label1.string = "";
	// 	else
	// 		this.label1.string = Math.floor(dataArray[0]);
	// 	if (dataArray[1] == null)
	// 		this.label2.string = "";
	// 	else
	// 		this.label2.string = Math.floor(dataArray[1]);
	// 	if (dataArray[2] == null)
	// 		this.label3.string = "";
	// 	else
	// 		this.label3.string = Math.floor(dataArray[2]);
	// 	if (dataArray.length == 3)
	// 		this.labelSum.string = Math.floor(dataArray[0] + dataArray[1] + dataArray[2]);
	// 	else
	// 		this.labelSum.string = "";
	//
	// },

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
				let viewId = MPNNModel.getViewId(data.bankerarr[i]);
				nodearr.push(this.headItemArr[viewId].getChildByName('randBankerFrame'))
			}
		}
		Actions.RandBanker(nodearr)
	}
});