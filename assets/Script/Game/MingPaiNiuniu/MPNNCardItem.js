var MPNNProto = require('./MPNNProto');
var RoomProto = require('../../API/RoomProto');
var MPNNLogic = require('./MPNNLogic');
var MPNNModel = require('./MPNNModel');
var GameMessageRouter = 'game.gameHandler.gameMessageNotify';

cc.Class({
	extends: cc.Component,

	properties: {
		winLabel: cc.Label,
		loseLabel: cc.Label,
		typeAni: cc.Node,
		layoutNode: cc.Node,

	},

	onLoad: function () {
		// this.winLabel = cc.find("jiesuanNode/winLabel", this.node).getComponent(cc.Label);
		// this.loseLabel = cc.find("jiesuanNode/loseLabel", this.node).getComponent(cc.Label);
		// this.typeSprite = cc.find("TypeBackSprite/TypeSprite", this.node).getComponent(cc.Sprite);
		// this.layoutNode = cc.find("Layout", this.node);
		this.NNMainDialog = this.node.parent.parent.parent.getComponent("MPNNMainDialog");
		this.audioManager = this.NNMainDialog.getAudioManager();
		this.cardArray = [];
		this.shootCount = 0;
		this.bShowCard = false;
		this.cardsPosArr = [];
		this.endCardPos0 = [cc.v2(-60, 0), cc.v2(-30, 0), cc.v2(0, 0), cc.v2(30, 0), cc.v2(60, 0)];
		this.endCardPos = [cc.v2(-60, 0), cc.v2(-30, 0), cc.v2(0, 0), cc.v2(40, 0), cc.v2(70, 0)];
		this.myCardPos = [cc.v2(-210, 0), cc.v2(-105, 0), cc.v2(0, 0), cc.v2(105, 0), cc.v2(210, 0)];
		this.reset();
		//只要监听了这个消息的所有 监听回调都会触发，所以主界面会触发，这里也会触发。

		Global.MessageCallback.addListener('RoomMessagePush', this);
		Global.MessageCallback.addListener('GameMessagePush', this);
		Global.MessageCallback.addListener('MPNNONCARDSHOOT', this.onCardShoot.bind(this));

	},
	reset: function () {
		this.typeAni.parent.active = false; //type隐藏
		this.winLabel.string = "";
		this.loseLabel.string = "";
		this.shootCount = 0;
		this.bShowCard = false;

		this.layoutNode.getComponent(cc.Layout).enabled = true;
		// if (this.cardArray.length <= 0) return;
		for (let i = 0; i < this.cardArray.length; i++) {
			this.cardArray[i].reset();
		}
	},
	//重置
	offLineAndClient: function () {
		this.reset();

		let chairCount = MPNNModel.getChairCount();

		var self = this;
		AssetMgr.loadResSync("MingPaiNiuniu/MPNNCardPrefab", cc.Prefab, function (err, prefab) {
			if (err) {
				cc.log("=======加载CardPrefab 报错");
			} else {
				if (!cc.isValid(self.layoutNode)) {
					return;
				}

				self.cardArray = [];
				for (let i = 0; i < 5; i++) {
					let cardPrefab = cc.instantiate(prefab);
					cardPrefab.parent = self.layoutNode;
					let cardJs = cardPrefab.getComponent("MPNNCard");
					self.cardArray.push(cardJs);
					// cardJs.reset();
				}

				// for (let i = 0; i< 5;i++) {
				// 	self.cardsPosArr.push(self.cardArray[i].node.getPosition())
				// }
				self.layoutNode.getComponent(cc.Layout).updateLayout();
				console.warn("debug::生成所有手牌", JSON.stringify(self.cardArray[0].node.getPosition()))
				self.showState();
			}
		});
	},
	showState: function () {
		var gameStatus = MPNNModel.getGameStatus();
		var chairIndex = MPNNModel.getChairIdIndex(this.chairId);
		var cardArr, i;
		if (chairIndex < 0) return; //chairIndex 取不到 说明玩家 没游戏

		if (gameStatus === MPNNProto.GAME_STATUS_ROBBANK || gameStatus === MPNNProto.GAME_STATUS_POURSCORE) {
			//这个时候是显示3张牌的时候
			let cardArr = MPNNModel.getMyCardArr();
			if (Array.isArray(cardArr)) {
				if (this.chairId === MPNNModel.getMyChairId()) {
					var callFunc = function (self) {
						self.showBack(false);
						self.showFace(true);
					};
					for (i = 0; i < cardArr.length; ++i) {
						this.cardArray[i].setValue(cardArr[i], callFunc);
					}
				} else {
					for (i = 0; i < cardArr.length; ++i) {
						this.cardArray[i].showFace(false);
						this.cardArray[i].showBack(true);
					}
				}
			}
		}
		//看牌中 cardNode true
		else if (gameStatus === MPNNProto.GAME_STATUS_SORTCARD) {
			var showCardArr = MPNNModel.getShowCardArr();
			this.node.active = true;
			let myChairId = MPNNModel.getMyChairId();
			if (showCardArr[this.chairId] === 1) {
				this.answerShowCardPush(this.chairId, MPNNModel.getCardsArr()[chairIndex]);
			} else {
				if (this.chairId === MPNNModel.getMyChairId()) {
					let cardArr = MPNNModel.getMyCardArr();
					if (Array.isArray(cardArr)) {
						var callFunc = function (self) {
							self.showBack(false);
							self.showFace(true);
						}
						for (i = 0; i < cardArr.length; ++i) {
							this.cardArray[i].setValue(cardArr[i], callFunc);

						}
					}
				} else {
					for (i = 0; i < 5; ++i) {
						this.cardArray[i].showFace(false);
						this.cardArray[i].showBack(true);
					}
				}
			}
		} else if (gameStatus === MPNNProto.GAME_STATUS_RESOUT) {
			var cardArr = MPNNModel.getCardsArr()[chairIndex];
			this.answerResoutPush(MPNNModel.finalScoreArr, cardArr);
			// this.answerResoutPush(null,cardArr);

		}
	},

	messageCallbackHandler: function (router, msg) {
		if (!this.pos) {
			return;
		}
		var myChairId = MPNNModel.getMyChairId();
		if (router === 'RoomMessagePush') {
			if (msg.type === RoomProto.USER_READY_PUSH) {
				this.answerUserReadyPush(msg.data.chairId);
			}
			//其他玩家进入
			else if (msg.type === RoomProto.OTHER_USER_ENTRY_ROOM_PUSH) {
				cc.log("=====其它玩家进入 402 RoomMessage this.chairId:%s", this.chairId);
				if (msg.data.roomUserInfo.chairId === this.chairId) {
					this.reset();
					//如果没有加载过 卡牌
					if (this.cardArray.length <= 0) {
						cc.log("=====其它玩家进入 402 RoomMessage 其它玩家没有加载过牌 this.chairId:%s", this.chairId);
						this.offLineAndClient();
					}
				}
			} else if (msg.type === RoomProto.USER_LEAVE_ROOM_PUSH) {
				this.answerUserLeavePush(msg.data.roomUserInfo.chairId);
			}
		} else if (router === 'GameMessagePush') {
			if (MPNNModel.getChairIdIndex(this.chairId) < 0) {
				return;
			}
			//第一次发牌推送
			if (msg.type === MPNNProto.FOUR_CARD_PUSH) {
				this.anserFirstCardPush(msg.data.chairId, msg.data.cardArr);
			}
			//第二次发牌推送
			if (msg.type === MPNNProto.RESOUT_CARD_PUSH) {
				this.answerResoutCardPush(msg.data.chairId, msg.data.cardArr);
			}
			//亮牌回复
			else if (msg.type === MPNNProto.SHOW_CARD_PUSH) {
				if (msg.data.chairId === this.chairId)
					this.answerShowCardPush(msg.data.chairId, msg.data.cardArr);
			}
			//游戏结果
			else if (msg.type === MPNNProto.GAME_RESOUT_PUSH) {
				this.answerResoutPush(msg.data.finalScoreArr, msg.data.cardsArr);
			}

			//游戏状态
			else if (msg.type === MPNNProto.GAME_STATUS_PUSH) {
				if (msg.data.gameStatus === MPNNProto.GAME_STATUS_PREPARE) {
					this.scheduleOnce(function () {
						this.answerUserReadyPush(this.chairId);
					}.bind(this), MPNNProto.AUTO_READY_TM - 4);
				}
			}
		}
	},
	//准备状态
	answerUserReadyPush: function (chairId) {
		if (chairId === this.chairId) {
			this.reset();
			// this.node.active = false;
			for (var i = 0; i < this.cardArray.length; ++i) {
				this.cardArray[i].reset();
				//准备好 应该 打开Layout
			}
			if (chairId === MPNNModel.getMyChairId()) {
				this.layoutNode.getComponent(cc.Layout).spacingX = 105;
				this.layoutNode.width = 420;
			}
		}
	},

	answerUserLeavePush: function (chairId) {
		if (chairId === this.chairId) {
			this.typeAni.parent.active = false;
		}
	},
	anserFirstCardPush: function (chairId, cardArr) {
		this.firstSendCard(chairId, cardArr);
	},
	//发牌推送
	answerResoutCardPush: function (chairId, cardArr) {

		this.sendCard(chairId, cardArr);
	},
	getPercentFinalScore: function (finalScoreArr) {
		var fsArr = [];
		for (let i = 0; i < finalScoreArr.length; i++) {
			let percent = MPNNModel.getProfitPercentage();
			if (finalScoreArr[i] > 0)
				fsArr[i] = (finalScoreArr[i] * (1 - percent)).toFixed(2);
			else
				fsArr[i] = finalScoreArr[i].toFixed(2);
		}
		return fsArr;
	},
	//游戏结果
	answerResoutPush: function (scoreArr, cardsArr) {
		if (!Array.isArray(scoreArr) || scoreArr.length <= 0) return;
		if (!Array.isArray(cardsArr) || cardsArr.length <= 0) return;
		var chairIndex = MPNNModel.getChairIdIndex(this.chairId);
		if (chairIndex < 0) return;
		var scoreArr = this.getPercentFinalScore(scoreArr);

		var score = scoreArr[this.chairId];
		if (score < 0) {
			this.winLabel.string = "";
			this.loseLabel.string = score;
		} else {
			this.winLabel.string = "+" + score;
			this.loseLabel.string = "";
		}
		var chairIndex = MPNNModel.getChairIdIndex(this.chairId);
		if (chairIndex >= 0 && cardsArr) {
			this.showAllCardAndType(this.chairId, cardsArr);
			if (this.chairId === MPNNModel.getMyChairId()) {

				this.NNMainDialog.cuoPaiMask.active = false;
				if (this.peekCard) {
					this.peekCard.node.destroy();
					this.peekCard = null;
				}
			}
		}
	},
	//亮牌回复
	answerShowCardPush: function (chairId, cardArr) {
		if (this.chairId === chairId) {
			// if (chairId === MPNNModel.getMyChairId()){
			// 	this.kaiPaiMyOwn(chairId, cardArr);
			// }
			// else {
			this.showAllCardAndType(chairId, cardArr);
			this.bShowCard = true;
			// }
		}
	},

	showAllCardAndType: function (chairId, cardArr) {

		if (this.bShowCard) return;
		if (chairId !== this.chairId) return;
		if (this.cardArray.length <= 0) return;
		this.layoutNode.getComponent(cc.Layout).enabled = false;
		var cardArr = MPNNLogic.getSortCard(cardArr);
		this.node.active = true;
		var myChairId = MPNNModel.getMyChairId();

		if (chairId === myChairId) {

			this.onOpenMyAction(cardArr);
		} else {
			this.onOpenAction(cardArr);
		}

		// var cardCallFunc = function (self) {
		// 	self.showFace(true);
		// 	self.showBack(false);
		// 	self.setShoot(false);
		// 	self.setClickEnabled(false);
		// };
		// for(var i = 0; i < cardArr.length; ++i) {
		// 	this.cardArray[i].setValue(cardArr[i],cardCallFunc);
		//
		// }
		// var typeCallFunc = function () {
		// 	this.typeAni.parent.active = true;
		// };
		// var rateUrl = this.getTypeSpriteUrl(cardArr);
		// Global.CCHelper.updateSpriteFrame(rateUrl, this.typeSprite, typeCallFunc.bind(this));
		this.typeAni.parent.active = true;
		let name = this.getTypeAnimationName(cardArr);
		this.typeAni.active = true
		this.typeAni.getComponent(dragonBones.ArmatureDisplay).playAnimation(name, 1)
		var rate = MPNNLogic.getSpecialCardTypeRate(cardArr);
		let sex = MPNNModel.getSexByChairId(chairId);

		//5xiaoniu
		if (MPNNLogic.isFiveXiaoNiu(cardArr)) {
			AudioMgr.playSound('GameCommon/NN/sound1/N' + 14 + "_" + Math.round(sex));
		} 
		//5花牛
		else if (rate === MPNNLogic.RATE_WUHUA) {
			AudioMgr.playSound('GameCommon/NN/sound1/N' + 12 + "_" + Math.round(sex));
		} //炸弹牛
		else if (rate === MPNNLogic.RATE_ZHADAN) {
			AudioMgr.playSound('GameCommon/NN/sound1/N' + 13 + "_" + Math.round(sex));
		} //4花牛
		else if (MPNNLogic.isFourColorNiu(cardArr)) {
			AudioMgr.playSound('GameCommon/NN/sound1/N' + 11 + "_" + Math.round(sex));
		} 
		else {
			rate = MPNNLogic.getNormalCardType(cardArr);
			AudioMgr.playSound('GameCommon/NN/sound1/N' + Math.round(rate) + "_" + Math.round(sex));

		}
		// this.NNMainDialog.cuoPaiToggle.interactable = true;//可以搓牌的交互打开

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

		// let k = cardArr.length - 1;
		// this.scheduleOnce(function () {
		// 	this.schedule(function () {
		// 		this.cardArray[k].node.runAction(cc.moveTo(0.05,this.endCardPos[k]));
		// 		k--;
		// 	}.bind(this),0,cardArr.length - 1,0);
		// },0.3);
	},
	onOpenAction(cardArr) {
		var callFunc = function (self) {
			self.setShoot(false);
			self.setClickEnabled(false);
			self.flipCard();
		}
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
		let k = cardArr.length - 1;

		// this.scheduleOnce(function () {
		// 	this.schedule(function () {
		// 		this.cardArray[k].node.runAction(cc.moveTo(0.05,this.endCardPos[k]));
		// 		k--;
		// 	}.bind(this),0,cardArr.length - 1,0);
		// },0.5);

	},

	/*
	 * 第1轮发牌
	 */
	firstSendCard: function (chairId, cardArr) {
		if (this.cardArray.length <= 0) return;

		this.node.active = true;
		var cardItemPos = this.node.parent.getPosition();
		// this.cardsPosArr = [];
		var startPos = cc.v2(-cardItemPos.x, -cardItemPos.y); //自己的负方向，就是父物体的 0 的位置
		this.cardsPosArr = [];
		for (let i = 0; i < this.cardArray.length; ++i) {
			let card = this.cardArray[i];
			this.cardsPosArr.push(card.node.getPosition());
			card.node.setPosition(startPos);
			if (i >= cardArr.length) continue;
			card.showBack(true); //先只让前3张可见
		}
		this.layoutNode.getComponent(cc.Layout).enabled = false;

		let index = 0;
		var self = this;
		let endPos = this.cardsPosArr[0];
		console.warn("debug::发牌", JSON.stringify(endPos))
		var callFunc = function () {
			let card = self.cardArray[index % cardArr.length];
			//先发到一个点
			if (index < cardArr.length) {
				card.node.runAction(cc.moveTo(0.3, endPos));
				AudioMgr.playSound('GameCommon/NN/sound1/sendCard');

			}
			//铺开
			if (index >= cardArr.length) {
				card.node.runAction(cc.moveTo(0.1, this.cardsPosArr[index % cardArr.length]));
			}
			++index;
			//结束
			if (index >= cardArr.length * 2) {
				// for(var i = 0; i < 5; ++i) {
				// 				// 	self.cardArray[i].node.zIndex = i;
				// 				// }
				self.unschedule(callFunc);
				self.showFirstCard(cardArr);
			}
		};
		this.schedule(callFunc, 0.11);

	},
	/*
	 * 第二轮发牌
	 */
	sendCard: function (chairId, cardArr) {
		if (this.cardArray.length <= 0) return;
		// this.NNMainDialog.cuoPaiToggle.interactable = false;
		this.layoutNode.getComponent(cc.Layout).enabled = false;

		this.node.active = true;
		let startIndex = MPNNModel.getFirstCardCount();

		var cardItemPos = this.node.parent.getPosition();
		var startPos = cc.v2(-cardItemPos.x, -cardItemPos.y); //自己的负方向，就是父物体的 0 的位置
		// this.cardsPosArr = [];
		// for (let i = 0; i < this.cardArray.length; ++i) {
		// 	let card = this.cardArray[i];
		// 	this.cardsPosArr.push(card.node.getPosition());
		// 	card.node.setPosition(startPos);
		// 	if (i >= cardArr.length) continue;
		// 	card.showBack(true); //先只让前3张可见
		// }

		for (let i = startIndex; i < this.cardArray.length; ++i) {
			let card = this.cardArray[i];
			if (this.chairId === MPNNModel.getMyChairId())
				this.cardsPosArr[i] = this.myCardPos[i];
			else
				this.cardsPosArr[i] = this.endCardPos0[i];
			card.node.setPosition(startPos);
			card.showBack(true);
		}
		let index = startIndex;
		var self = this;
		var callFunc = function () {
			let card = self.cardArray[index];
			AudioMgr.playSound('GameCommon/NN/sound1/sendCard');

			if (index < cardArr.length) {
				card.node.runAction(cc.moveTo(0.15, this.cardsPosArr[index]));
			}
			++index;
			//结束
			if (index >= cardArr.length) {

				self.unschedule(callFunc);
				this.scheduleOnce(function () {
					self.showMyCard(startIndex, cardArr);
					self.NNMainDialog.doSendCardFinish();
				}, 0.4);
			}
		};
		this.schedule(callFunc, 0.2);


	},
	showCuoPai: function (cardIndex) {
		//搓牌特效
		this.NNMainDialog.cuoPaiMask.active = true;
		this.NNMainDialog.statePoint.setPosition(0, 180);
		var self = this;
		AssetMgr.loadResSync("PeekCard/PeekCard", cc.Prefab, function (err, prefab) {
			if (err) {
				cc.log("======PeekCard加载错误");
			} else {
				if (!cc.isValid(self.NNMainDialog) || !cc.isValid(self.NNMainDialog.cuopaiPoint)) {
					return;
				}
				let newNode = cc.instantiate(prefab);
				newNode.parent = self.NNMainDialog.cuopaiPoint;
				self.peekCard = newNode.getComponent("PeekCard");
				self.peekCard._moveSpeed = 0.7;
				self.peekCard.setCardSize(cc.size(250 * 1.5, 179 * 1.5));
				self.peekCard.setCardBack("GameCommon/cuoPaiCards/cardBack.png");
				self.peekCard.setCardFace(self.getCardImgRes(cardIndex));
				self.peekCard.setFinishCallBack(function () {
					setTimeout(function () {
						Global.NetworkManager.notify(GameMessageRouter, MPNNProto.getShowCardNotifyData());
					}, 1000)
				});
				self.peekCard.init();
			}
		});
	},
	/*
	 * 显示牌
	 */
	showFirstCard: function (cardArr) {
		var callFunc = function (self) {
			self.flipCard();
		}
		if (this.chairId === MPNNModel.getMyChairId()) {
			for (var i = 0; i < cardArr.length; ++i) {
				this.cardArray[i].setValue(cardArr[i], callFunc);
				// this.cardArray[i].flipCard();
			}
		} else {
			for (var i = 0; i < cardArr.length; ++i) {
				this.cardArray[i].showBack(true);
			}
		}
		this.NNMainDialog.doSendFirstCardFinish();
	},
	/*
	 * 显示牌
	 */
	showMyCard: function (startIndex, cardArr) {
		if (this.chairId === MPNNModel.getMyChairId()) {
			var callFunc = function (self) {
				self.setClickEnabled(true);
				self.flipCard();
			};
			var callFunc1 = function (self) {
				self.showBack(true);
				self.flipCard();
			}
			// if (this.NNMainDialog.cuoPaiToggle.isChecked === true) {
			// 	for (var i = 0; i < 4; ++i) {
			// 		this.cardArray[i].setValue(cardArr[i], callFunc);

			// 	}
			// 	this.cardArray[4].showFace(false);
			// 	this.cardArray[4].showBack(false);
			// 	// this.showCuoPai(4);

			// } else {
			// 	for (var i = startIndex; i < this.cardArray.length; ++i) {
			// 		this.cardArray[i].setValue(cardArr[i], callFunc1);

			// 	}
			// }
			for (var i = startIndex; i < this.cardArray.length; ++i) {
				this.cardArray[i].setValue(cardArr[i], callFunc1);

			}
			this.NNMainDialog.openCardNode.active = true;
		} else {
			for (var i = startIndex; i < this.cardArray.length; ++i) {
				this.cardArray[i].showBack(true);
			}
		}
	},


	getBezierPosArr: function (startPos, endPos) {
		var midPos = cc.v2((startPos.x + endPos.x) / 2, (startPos.y + endPos.y) / 2 + 300);
		return [startPos, midPos, endPos];
	},

	setCardPosAndChairId: function (pos, chairId) {
		this.pos = pos;
		this.chairId = chairId;
		this.reset();
	},

	// /*
	//  * 获取类型对应图片url
	//  */
	// getTypeSpriteUrl: function (cardArr) {
	// 	var gameRule = MPNNModel.getGameRule();
	// 	var rate = MPNNLogic.getSpecialCardTypeRate(cardArr);
	// 	if (rate === MPNNLogic.RATE_WUHUA) {
	// 		return 'GameCommon/NN/niuji/niu_12';
	// 	} else if (rate === MPNNLogic.RATE_ZHADAN) {
	// 		return 'GameCommon/NN/niuji/niu_13';
	// 	} else if (MPNNLogic.isFiveXiaoNiu(cardArr)) {
	// 		return 'GameCommon/NN/niuji/niu_14';
	// 	} else if (MPNNLogic.isFourColorNiu(cardArr)) {
	// 		return 'GameCommon/NN/niuji/niu_11';
	// 	} else {
	// 		return 'GameCommon/NN/niuji/niu_' + MPNNLogic.getNormalCardType(cardArr);
	// 	}
	// },

	/*
	 * 获取类型名
	 */
	getTypeAnimationName: function (cardArr) {
		var rate = MPNNLogic.getSpecialCardTypeRate(cardArr);
		if (MPNNLogic.isFiveXiaoNiu(cardArr)) {
			return 'wuxiaoniu';
		} else if (rate === MPNNLogic.RATE_ZHADAN) {
			return 'zhadanniu';
		} else if (rate === MPNNLogic.RATE_WUHUA) {
			return 'wuhuaniu'
		} else if (MPNNLogic.isFourColorNiu(cardArr)) {
			return 'sihuaniu';
		} else {
			if (MPNNLogic.getNormalCardType(cardArr) == 10) {
				return 'niuniu';
			} else if (MPNNLogic.getNormalCardType(cardArr) == 0) {
				return 'wuniu';
			} else {
				return 'niu' + MPNNLogic.getNormalCardType(cardArr);
			}

		}
	},

	/*
	 * 获取牌对应的图片url
	 */
	getCardUrl: function (cardId) {
		var num = MPNNLogic.getCardNumber(cardId);
		var color = MPNNLogic.getCardColor(cardId);
		var url = 'GameCommon/Card/';
		if (color === MPNNLogic.COLOR_FANGKUAI) {
			url += num;
		} else if (color === MPNNLogic.COLOR_CAOHUA) {
			url += (16 + num);
		} else if (color === MPNNLogic.COLOR_HONGTAO) {
			url += (32 + num);
		} else if (color === MPNNLogic.COLOR_HEITAO) {
			url += (48 + num);
		}
		return url;
	},


	// updateJiSuan: function (chairId) {
	// 	let mechairId = MPNNModel.getMyChairId();
	// 	if (chairId != mechairId) return true;
	//
	// 	var shootCount = this.shootCount;
	// 	if (shootCount == 3) {
	//
	// 		var oneGroup = [];
	// 		var twoGroup = [];
	//
	// 		for (var i = 0; i < this.cardArray.length; ++i) {
	// 			if (this.cardArray[i].isShoot) {
	// 				oneGroup.push(this.cardArray[i].cardData);
	// 			} else {
	// 				twoGroup.push(this.cardArray[i].cardData);
	// 			}
	// 		}
	//
	// 		var type = MPNNLogic.getCardTypeBy2Group(oneGroup, twoGroup);
	// 		//是否有牛按钮
	// 		this.NNMainDialog.setYouNiuBtnEnable(!!type);
	// 	} else {
	// 		this.NNMainDialog.setYouNiuBtnEnable(false);
	//
	// 	}
	// 	var isShootArray = [];
	// 	for (var i = 0; i < this.cardArray.length; ++i) {
	// 		if (this.cardArray[i].isShoot) {
	// 			isShootArray.push(MPNNLogic.getCardCount(this.cardArray[i].cardData));
	// 		}
	// 	}
	// 	this.NNMainDialog.updateJiSuan(isShootArray);
	//
	// },
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
			// this.updateJiSuan(this.chairId);
		}
	},
	//返回牌值图片路径
	getCardImgRes: function (index) {
		if (this.cardArray[index]) {
			return this.cardArray[index].getCardImgRes();
		}
	},
	/**
	 * 设置是否可以点击
	 * @param enable
	 */
	setClickEnabled: function (enable) {
		for (var i = 0; i < this.cardArray.length; ++i) {
			this.cardArray[i].setClickEnabled(enable);
		}
	},
	setShoot: function (enable) {
		for (var i = 0; i < this.cardArray.length; ++i) {
			this.cardArray[i].setShoot(enable);
		}
	},
	setValue: function (cardArray) {
		for (var i = 0; i < this.cardArray.length; ++i) {
			this.cardArray[i].setValue(cardArray[i]);
		}
	},

	onDestroy: function () {
		Global.MessageCallback.removeCustomListener('MPNNONCARDSHOOT');
		Global.MessageCallback.removeListener('RoomMessagePush', this);
		Global.MessageCallback.removeListener('GameMessagePush', this);
	},
});