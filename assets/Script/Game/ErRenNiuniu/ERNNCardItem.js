var ERNNProto = require('./ERNNProto');
var RoomProto = require('../../API/RoomProto');
var ERNNLogic = require('./ERNNLogic');
var ERNNModel = require('./ERNNModel');

var GameMessageRouter = 'game.gameHandler.gameMessageNotify';

cc.Class({
	extends: cc.Component,

	properties: {
		cardPrefab: cc.Prefab,
		layout: cc.Node,
		typeAni: cc.Node,
	},

	onLoad: function () {
		this.audioManager = this.node.parent.parent.getComponent('ERNNMainDialog').getAudioManager();
		this.cardArray = []; //牌的数组
		this.chairId = null;
		this.shootCount = 0;
		this.ERNNMainDialog = this.node.parent.parent.getComponent("ERNNMainDialog");
		this.endCardPos0 = [cc.v2(-60, 0), cc.v2(-30, 0), cc.v2(0, 0), cc.v2(30, 0), cc.v2(60, 0)];
		this.endCardPos = [cc.v2(-60, 0), cc.v2(-30, 0), cc.v2(0, 0), cc.v2(40, 0), cc.v2(70, 0)];
		this.myCardPos = [cc.v2(-210, 0), cc.v2(-105, 0), cc.v2(0, 0), cc.v2(105, 0), cc.v2(210, 0)];
		//将牌存入 ，自动布局
		for (let i = 0; i < 5; i++) {
			let card = cc.instantiate(this.cardPrefab);
			this.layout.addChild(card);
			card.name = i.toString();
			card.position = this.endCardPos0[i];
			let cardJs = card.getComponent("ERNNCard");
			this.cardArray.push(cardJs);
		}
		this.reset();

		this.typeAni.parent.active = false;
		//只要监听了这个消息的所有 监听回调都会触发，所以主界面会触发，这里也会触发。
		Global.MessageCallback.addListener('RoomMessagePush', this);
		Global.MessageCallback.addListener('GameMessagePush', this);
		Global.MessageCallback.addListener('ONCARDSHOOT', this.onCardShoot.bind(this));

	},
	reset: function () {
		this.typeAni.parent.active = false; //类型设为false
		for (let i = 0; i < this.cardArray.length; i++) {
			this.cardArray[i].reset();
		}
		this.shootCount = 0;
		this.layout.getComponent(cc.Layout).enabled = false;

	},
	//重置
	offLineAndClient: function () {
		var gameStatus = ERNNModel.getGameStatus();
		var chairIndex = ERNNModel.getChairIdIndex(this.chairId);
		var cardArr, i;
		if (chairIndex < 0) {
			return;
		}
		//押注或者抢庄的时候，把cardNode 隐藏
		if (gameStatus === ERNNProto.GAME_STATUS_ROBBANK || gameStatus === ERNNProto.GAME_STATUS_POURSCORE) {
			this.node.active = false;
		}
		//看牌中 cardNode true
		else if (gameStatus === ERNNProto.GAME_STATUS_SORTCARD) {
			this.node.active = true;
			let chairIndex = ERNNModel.getChairIdIndex(this.chairId);
			var showCardArr = ERNNModel.getShowCardArr();

			let cardArr = ERNNModel.getCardsArr()[chairIndex];
			var callFunc = function (self) {
				self.showFace(true);
				self.showBack(false);
			}
			if (showCardArr[this.chairId] === 1) {
				for (i = 0; i < 5; ++i) {
					this.cardArray[i].setValue(cardArr[i], callFunc);
				}
				this.typeAni.parent.active = true;
				let name = this.getTypeAnimationName(tcardArr);
				this.typeAni.active = true
				this.typeAni.getComponent(dragonBones.ArmatureDisplay).playAnimation(name, 1)
				this.setClickEnabled(false);
			} else {
				if (this.chairId === ERNNModel.getMyChairId()) {
					// this.setClickEnabled(true);
					// var callFunc = function (self) {
					// 	self.showFace(true);
					// 	self.showBack(false);
					// }
					// for (i = 0; i < 5; ++i) {
					// 	this.cardArray[i].setValue(cardArr[i], callFunc);
					// }
					this.sendCard(this.chairId, cardArr);
				} else {
					this.setClickEnabled(false);
					for (i = 0; i < 5; ++i) {
						this.cardArray[i].showFace(false);
						this.cardArray[i].showBack(true);
					}
				}
			}
		} else if (gameStatus === ERNNProto.GAME_STATUS_RESOUT) {
			this.node.active = true;
			var cardArr = ERNNModel.cardsArr[chairIndex];
			cc.log("======状态5 结算中", cardArr);
			this.answerShowCardPush(this.chairId, cardArr);

		}
	},

	messageCallbackHandler: function (router, msg) {
		if (!this.pos) {
			return;
		}
		var myChairId = ERNNModel.getMyChairId();
		if (router === 'RoomMessagePush') {
			//玩家准备
			if (msg.type === RoomProto.USER_READY_PUSH) {
				this.answerUserReadyPush(msg.data.chairId);
			}
			//进入房间
			else if (msg.type === RoomProto.OTHER_USER_ENTRY_ROOM_PUSH) {
				this.reset();
			}
			//离开房间
			else if (msg.type === RoomProto.USER_LEAVE_ROOM_PUSH) {
				this.answerUserLeavePush(msg.data.roomUserInfo.chairId);
			}
		} else if (router === 'GameMessagePush') {
			if (ERNNModel.getChairIdIndex(this.chairId) < 0) {
				return;
			}
			//发牌推送
			if (msg.type === ERNNProto.RESOUT_CARD_PUSH) {
				this.answerResoutCardPush(msg.data.chairId, msg.data.cardArr);
			}
			//开牌
			else if (msg.type === ERNNProto.SHOW_CARD_PUSH) {
				this.answerShowCardPush(msg.data.chairId, msg.data.cardArr);
			}
			//游戏结果
			else if (msg.type === ERNNProto.GAME_RESOUT_PUSH) {
				this.answerResoutPush(msg.data.cardsArr);
			}

			//游戏状态
			else if (msg.type === ERNNProto.GAME_STATUS_PUSH) {
				//准备状态
				if (msg.data.gameStatus === ERNNProto.GAME_STATUS_PREPARE) {
					// this.answerUserReadyPush();
				}
			}
		}
	},
	//准备状态
	answerUserReadyPush: function (chairId) {
		if (chairId === this.chairId) {
			this.reset();
		}
	},

	answerUserLeavePush: function (chairId) {
		if (chairId === this.chairId) {
			// this.node.active = false;
		}
	},
	//发牌推送
	answerResoutCardPush: function (chairId, cardArr) {
		this.node.active = true;
		if (chairId === this.chairId && chairId === ERNNModel.getMyChairId()) {
			this.cardArr = cardArr;
		} else {
			this.cardArr = [0, 0, 0, 0, 0];
		}
		this.ERNNMainDialog.cuoPaiToggle.interactable = false;

		this.sendCard(chairId, cardArr);
	},

	//游戏结果
	answerResoutPush: function (cardsArr) {
		var chairIndex = ERNNModel.getChairIdIndex(this.chairId);
		if (chairIndex >= 0 && cardsArr[chairIndex]) {
			this.showAllCardAndType(cardsArr[chairIndex]);
			if (this.chairId === ERNNModel.getMyChairId()) {
				// this.node.getChildByName('CountNode').active = false;
				for (let i = 0; i < 5; ++i) {
					this.cardArray[i].node.targetOff(this.node);
				}
			}
		}
	},
	//开牌
	answerShowCardPush: function (chairId, cardArr) {
		this.showAllCardAndType(chairId, cardArr);
	},
	//发牌
	sendCard(chairId, cardArr) {

		this.node.active = true;
		this.typeAni.parent.active = false;
		for (let i = 0; i < this.cardArray.length; ++i) {
			this.cardArray[i].showFace(false);
			this.cardArray[i].showBack(true);
		}

		if (this.chairId === ERNNModel.getMyChairId()) {
			var starPos = cc.v2(-318, 362);
		} else {
			var starPos = cc.v2(-530, -74);
		}
		for (let i = 0; i < this.cardArray.length; ++i) {
			let node = this.cardArray[i].node;
			node.position = starPos;
			node.setScale(0);
			let moveAction = cc.spawn([cc.scaleTo(0.2, 1), cc.moveTo(0.35, this.endCardPos0[i])]);
			node.runAction(cc.sequence([
				cc.delayTime(0.03 * i + this.chairId * 0.2 + 0.5),
				cc.callFunc(function () {
					AudioMgr.playSound('GameCommon/NN/sound1/sendCard');
				}),
				moveAction
			]));
		}
		if (this.chairId !== ERNNModel.getMyChairId()) return;
		var callFunc = function () {
			this.ERNNMainDialog.doSendCardFinish();
		}
		this.scheduleOnce(function () {
			this.showCard(cardArr, this.myCardPos, callFunc.bind(this));
		}.bind(this), this.chairId * 0.2 + 1);

	},
	//显示牌
	showCard: function (cardArr, cardPosArr, cb) {
		if (this.chairId !== ERNNModel.getMyChairId()) return;
		for (let j = 0; j < this.cardArray.length; j++) {
			var actions = [
				cc.moveTo(0.2, this.endCardPos0[2]),
				cc.callFunc(function () {
					this.cardArray[j].setValue(cardArr[j], (card) => {
						card.showFace(true);
						card.showBack(false)
					})
				}.bind(this)),
				cc.moveTo(0.2, cardPosArr[j]),
			];
			var isCuopai = this.ERNNMainDialog.cuoPaiToggle.isChecked;
			if (isCuopai && j === 4) {
				//搓牌特效
				this.ERNNMainDialog.cuoPaiMask.active = true;
				this.ERNNMainDialog.waitTipPoint.setPosition(0, 140);

				var self = this.ERNNMainDialog;

				var sel = this;
				AssetMgr.loadResSync("PeekCard/PeekCard", cc.Prefab, function (err, prefab) {
					if (err) {
						cc.error("======PeekCard加载错误");
					} else {
						if (!cc.isValid(self.cuoPaiMask) || !cc.isValid(self.cuoPaiMask.parent)) {
							return;
						}
						let newNode = cc.instantiate(prefab);
						newNode.parent = self.cuoPaiMask.parent;
						self.cuoPaiMask.parent.zIndex = 100;
						self.peekCard = newNode.getComponent("PeekCard");
						self.peekCard._moveSpeed = 0.7;
						self.peekCard.setCardSize(cc.size(250 * 2, 179 * 2));
						self.peekCard.setCardBack("GameCommon/cuoPaiCards/cardBack.png");
						self.peekCard.setCardFace(sel.cardArray[j].getCardImgRes(j));
						self.peekCard.setFinishCallBack(function () {
							setTimeout(function () {
								Global.NetworkManager.notify(GameMessageRouter, ERNNProto.getShowCardNotifyData());
							}, 1000)
						});
						self.peekCard.init();
					}
				});
				this.cardArray[j].setValue(cardArr[j], (card) => {
					card.showFace(false);
					card.showBack(false);
				});
				break;
			}
			this.cardArray[j].node.runAction(cc.sequence(actions));
		}
		if (cb)
			this.scheduleOnce(cb, 0.4);
	},

	//显示牌型
	showAllCardAndType: function (chairId, cardArr) {
		if (this.chairId !== chairId) return;
		if (!Array.isArray(cardArr)) return;
		this.layout.getComponent(cc.Layout).enabled = false;
		var tcardArr = ERNNLogic.getSortCard(cardArr);
		if (chairId === ERNNModel.getMyChairId()) {
			this.onOpenMyAction(tcardArr)
		} else {
			// this.showCard(tcardArr,this.endCardPos);
			this.onOpenAction(tcardArr)
		}

		this.typeAni.parent.active = true;
		let name = this.getTypeAnimationName(tcardArr);
		this.typeAni.getComponent(dragonBones.ArmatureDisplay).playAnimation(name, 1)
		var rate = ERNNLogic.getSpecialCardTypeRate(tcardArr);
		let sex = ERNNModel.getSexByChairId(chairId);

		//5花牛
		if (rate === ERNNLogic.RATE_WUHUA) {
			AudioMgr.playSound('GameCommon/NN/sound1/N' + 12 + "_" + sex);
		} //炸弹牛
		else if (rate === ERNNLogic.RATE_ZHADAN) {
			AudioMgr.playSound('GameCommon/NN/sound1/N' + 13 + "_" + sex);
		} //4花牛
		else if (ERNNLogic.isFourColorNiu(tcardArr)) {
			AudioMgr.playSound('GameCommon/NN/sound1/N' + 11 + "_" + sex);
		} //5xiaoniu
		else if (ERNNLogic.isFiveXiaoNiu(tcardArr)) {
			AudioMgr.playSound('GameCommon/NN/sound1/N' + 14 + "_" + sex);
		} else {
			rate = ERNNLogic.getNormalCardType(tcardArr);
			AudioMgr.playSound('GameCommon/NN/sound1/N' + rate + "_" + sex);
		}
		this.ERNNMainDialog.cuoPaiToggle.interactable = true; //可以搓牌的交互打开
	},
	onOpenMyAction(cardArr) {
		var callFunc = function (self) {
			self.showBack(false);
			self.showFace(true);
			self.setShoot(false);
			self.setClickEnabled(false);
		}
		for (var i = 0; i < cardArr.length; ++i) {
			this.cardArray[i].setValue(cardArr[i], callFunc);
			this.cardArray[i].node.setPosition(this.endCardPos0[0]);
		}
		let j = cardArr.length - 1;
		this.scheduleOnce(function () {
			this.schedule(function () {
				this.cardArray[j].node.runAction(cc.moveTo(0.05, this.endCardPos[j]));
				j--;
			}.bind(this), 0, cardArr.length - 1, 0);
		}, 0);

	},
	onOpenAction(cardArr) {
		var callFunc = function (self) {
			self.setShoot(false);
			self.setClickEnabled(false);
			self.runFlopCard();
		};
		for (var i = 0; i < cardArr.length; ++i) {
			// this.cardArray[i].node.setPosition(this.endCardPos[0]);
			this.cardArray[i].setValue(cardArr[i], callFunc);
		}
		let j = cardArr.length - 1;
		this.scheduleOnce(function () {
			this.schedule(function () {
				this.cardArray[j].node.runAction(cc.moveTo(0.05, this.endCardPos[j]));
				j--;
			}.bind(this), 0, cardArr.length - 1, 0);
		}, 0.2);
	},

	updateJiSuan: function (chairId) {
		let mechairId = ERNNModel.getMyChairId();
		if (chairId != mechairId) return true;

		var shootCount = this.shootCount;
		if (shootCount == 3) {
			var oneGroup = [];
			var twoGroup = [];

			for (var i = 0; i < this.cardArray.length; ++i) {
				if (this.cardArray[i].isShoot) {
					oneGroup.push(this.cardArray[i].cardData);
				} else {
					twoGroup.push(this.cardArray[i].cardData);
				}
			}
			var type = ERNNLogic.getCardTypeBy2Group(oneGroup, twoGroup);
			//是否有牛按钮
			this.ERNNMainDialog.setYouNiuBtnEnable(!!type);
		} else {
			this.ERNNMainDialog.setYouNiuBtnEnable(false);

		}
		var isShootArray = [];
		for (var i = 0; i < this.cardArray.length; ++i) {
			if (this.cardArray[i].isShoot) {
				isShootArray.push(ERNNLogic.getCardCount(this.cardArray[i].cardData));
			}
		}
		this.ERNNMainDialog.updateJiSuan(isShootArray);
	},
	/**
	 * 弹起处理
	 * @param isShoot
	 */

	onCardShoot: function (isShoot) {
		this.shootCount += (isShoot ? 1 : -1);
		for (var i = 0; i < this.cardArray.length; ++i) {
			var shoot = this.cardArray[i].isShoot;
			if (shoot || this.shootCount < 3) {
				this.cardArray[i].setClickEnabled(true);
			} else {
				this.cardArray[i].setClickEnabled(false);
			}
			this.updateJiSuan(this.chairId);
		}
	},
	/**
	 * 设置牌数据
	 * @param cardData
	 */
	setCardData: function (cardData) {
		this.cardData = cardData;
		// cc.log("ERNNCardItem ====设置牌数据 cardData:",cardData);
		for (var i = 0; i < 5; ++i) {
			this.cardArray[i].setValue(cardData[i]);
		}
	},
	//获取位置，并转为世界坐标
	getCardPos: function (index) {
		return this.layout.convertToWorldSpaceAR(this.cardArray[index].node.getPosition());

	},
	runFlopCard: function (index, cb) {
		this.cardArray[index] && this.cardArray[index].runFlopCard(cb);
	},
	showBackCard: function (index) {
		this.cardArray[index] && this.cardArray[index].showBack(true);
	},
	/**
	 * 设置是否可以点击
	 * @param enable
	 */
	setClickEnabled: function (enable) {
		for (var i = 0; i < 5; ++i) {
			this.cardArray[i].setClickEnabled(enable);
		}
	},

	//准备阶段 由主界面传入
	setCardPosAndChairId: function (pos, chairId) {
		this.pos = pos;
		this.chairId = chairId;
	},
	// /*
	//  * 获取类型对应图片url
	//  */
	// getTypeSpriteUrl: function (cardArr) {
	// 	var rate = ERNNLogic.getSpecialCardTypeRate(cardArr);
	// 	if (rate === ERNNLogic.RATE_WUHUA) {
	// 		return 'GameCommon/NN/niuji/niu_12';
	// 	} else if (rate === ERNNLogic.RATE_ZHADAN) {
	// 		return 'GameCommon/NN/niuji/niu_13';
	// 	} else if (ERNNLogic.isFiveXiaoNiu(cardArr)) {
	// 		return 'GameCommon/NN/niuji/niu_14';
	// 	} else if (ERNNLogic.isFourColorNiu(cardArr)) {
	// 		return 'GameCommon/NN/niuji/niu_11';
	// 	} else {
	// 		return 'GameCommon/NN/niuji/niu_' + ERNNLogic.getNormalCardType(cardArr);
	// 	}
	// },

	/*
	 * 获取类型对应图片url
	 */
	getTypeAnimationName: function (cardArr) {
		var rate = ERNNLogic.getSpecialCardTypeRate(cardArr);
		if (rate === ERNNLogic.RATE_WUHUA) {
			return 'wuhuaniu'
		} else if (rate === ERNNLogic.RATE_ZHADAN) {
			return 'zhadanniu';
		} else if (ERNNLogic.isFiveXiaoNiu(cardArr)) {
			return 'wuxiaoniu';
		} else if (ERNNLogic.isFourColorNiu(cardArr)) {
			return 'sihuaniu';
		} else {
			if (ERNNLogic.getNormalCardType(cardArr) == 10) {
				return 'niuniu';
			} else if (ERNNLogic.getNormalCardType(cardArr) == 0) {
				return 'wuniu';
			} else {
				return 'niu' + ERNNLogic.getNormalCardType(cardArr);
			}

		}
	},

	//返回牌值图片路径
	getCardImgRes: function (index) {
		if (this.cardArray[index]) {
			return this.cardArray[index].getCardImgRes();
		}
	},

	onDestroy: function () {
		Global.MessageCallback.removeCustomListener('ONCARDSHOOT');
		Global.MessageCallback.removeListener('RoomMessagePush', this);
		Global.MessageCallback.removeListener('GameMessagePush', this);
	},
});