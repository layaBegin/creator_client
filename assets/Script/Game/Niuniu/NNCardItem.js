var NNProto = require('./NNProto');
var RoomProto = require('../../API/RoomProto');
var NNLogic = require('./NNLogic');
var NNModel = require('./NNModel');
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
		this.NNMainDialog = this.node.parent.parent.parent.getComponent("NNMainDialog");
		this.audioManager = this.NNMainDialog.getAudioManager();
		this.cardArray = [];
		this.shootCount = 0;
		this.bShowCard = false;
		this.endCardPos0 = [cc.v2(-60, 0), cc.v2(-30, 0), cc.v2(0, 0), cc.v2(30, 0), cc.v2(60, 0)];
		this.endCardPos = [cc.v2(-60, 0), cc.v2(-30, 0), cc.v2(0, 0), cc.v2(40, 0), cc.v2(70, 0)];
		this.myCardPos = [cc.v2(-210, 0), cc.v2(-105, 0), cc.v2(0, 0), cc.v2(105, 0), cc.v2(210, 0)];
		this.reset();
		//只要监听了这个消息的所有 监听回调都会触发，所以主界面会触发，这里也会触发。

		Global.MessageCallback.addListener('RoomMessagePush', this);
		Global.MessageCallback.addListener('GameMessagePush', this);
		Global.MessageCallback.addListener('NNONCARDSHOOT', this.onCardShoot.bind(this));

	},
	reset: function () {
		this.typeAni.parent.active = false; //type隐藏
		this.winLabel.string = "";
		this.loseLabel.string = "";
		this.shootCount = 0;
		this.bShowCard = false;

		this.layoutNode.getComponent(cc.Layout).enabled = false;
		// if (this.cardArray.length <= 0) return;
		for (let i = 0; i < this.cardArray.length; i++) {
			this.cardArray[i].reset();
		}
	},
	//重置
	offLineAndClient: function () {
		this.reset();

		let chairCount = NNModel.getChairCount();

		var self = this;
		AssetMgr.loadResSync("Niuniu/NNCardPrefab", cc.Prefab, function (err, prefab) {
			if (err) {
				cc.log("=======加载CardPrefab 报错");
			} else {
				if (!cc.isValid(self)) {
					return;
				}
				self.cardArray = [];
				for (let i = 0; i < chairCount; i++) {
					let cardPrefab = cc.instantiate(prefab);
					cardPrefab.parent = self.layoutNode;
					let cardJs = cardPrefab.getComponent("NNCard");
					self.cardArray.push(cardJs);
					// cardJs.reset();
				}
				self.showState();
			}
		});
	},
	showState: function () {
		var gameStatus = NNModel.getGameStatus();
		var chairIndex = NNModel.getChairIdIndex(this.chairId);
		var cardArr, i;
		if (chairIndex < 0) {
			return;
		}
		if (gameStatus === NNProto.GAME_STATUS_ROBBANK || gameStatus === NNProto.GAME_STATUS_POURSCORE) {
			// this.node.active = false;
		}
		//看牌中 cardNode true
		else if (gameStatus === NNProto.GAME_STATUS_SORTCARD) {
			var showCardArr = NNModel.getShowCardArr();
			this.node.active = true;
			let myChairId = NNModel.getMyChairId();
			if (showCardArr[this.chairId] === 1) {
				this.answerShowCardPush(this.chairId, NNModel.getCardsArr()[chairIndex]);
			} else {
				if (this.chairId === NNModel.getMyChairId()) {
					// var callFunc = function (self) {
					// 	self.showBack(false);
					// 	self.showFace(true);
					// 	self.setClickEnabled(true);
					// };
					let cardArr = NNModel.getMyCardArr();
					// for (i = 0; i < cardArr.length; ++i) {
					// 	this.cardArray[i].setValue(cardArr[i], callFunc);
					// 	this.cardArray[i].node.setPosition(this.myCardPos[i]);
					// }
					this.sendCard(this.chairId, cardArr);
				} else {
					for (i = 0; i < 5; ++i) {
						this.cardArray[i].showFace(false);
						this.cardArray[i].showBack(true);
						this.cardArray[i].setClickEnabled(false);
						this.cardArray[i].node.setPosition(this.endCardPos0[i]);
					}
				}
			}
		}
		//结果牌下推
		else if (gameStatus === NNProto.GAME_STATUS_RESOUT) {

			// if(this.chairId === NNModel.getMyChairId()){
			// 	cardArr = NNModel.get
			// }
			var cardArr = NNModel.cardsArr[chairIndex];
			cc.log("=====游戏结果断线重连");
			var finalScoreArr = NNModel.finalScoreArr;
			this.answerResoutPush(finalScoreArr, cardArr);
		}

	},

	messageCallbackHandler: function (router, msg) {
		if (!this.pos) {
			return;
		}
		var myChairId = NNModel.getMyChairId();
		if (router === 'RoomMessagePush') {
			if (msg.type === RoomProto.USER_READY_PUSH) {
				this.answerUserReadyPush(msg.data.chairId);
			}
			//其他玩家进入
			else if (msg.type === RoomProto.OTHER_USER_ENTRY_ROOM_PUSH) {

				if (msg.data.roomUserInfo.chairId === this.chairId) {
					this.reset();
					//如果没有加载过 卡牌
					if (this.cardArray.length <= 0) {
						this.offLineAndClient();
					}
				}
			} else if (msg.type === RoomProto.USER_LEAVE_ROOM_PUSH) {
				this.answerUserLeavePush(msg.data.roomUserInfo.chairId);
			}
		} else if (router === 'GameMessagePush') {
			if (NNModel.getChairIdIndex(this.chairId) < 0) {
				return;
			}
			//发牌推送
			if (msg.type === NNProto.RESOUT_CARD_PUSH) {
				this.answerResoutCardPush(msg.data.chairId, msg.data.cardArr);
			}
			//亮牌回复
			else if (msg.type === NNProto.SHOW_CARD_PUSH) {
				if (msg.data.chairId === this.chairId)
					this.answerShowCardPush(msg.data.chairId, msg.data.cardArr);
			}
			//游戏结果
			else if (msg.type === NNProto.GAME_RESOUT_PUSH) {
				this.answerResoutPush(msg.data.finalScoreArr, msg.data.cardsArr);
			}
			//游戏状态
			else if (msg.type === NNProto.GAME_STATUS_PUSH) {
				if (msg.data.gameStatus === NNProto.GAME_STATUS_PREPARE) {
					this.scheduleOnce(function () {
						this.answerUserReadyPush(this.chairId);
					}.bind(this), NNProto.AUTO_READY_TM - 4);
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
			if (chairId === NNModel.getMyChairId()) {
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
	//发牌推送
	answerResoutCardPush: function (chairId, cardArr) {

		this.sendCard(chairId, cardArr);
	},
	getPercentFinalScore: function (finalScoreArr) {
		var fsArr = [];
		for (let i = 0; i < finalScoreArr.length; i++) {
			let percent = NNModel.getProfitPercentage();
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
		var scoreArr = this.getPercentFinalScore(scoreArr);
		var score = scoreArr[this.chairId];
		if (score < 0) {
			this.winLabel.string = "";
			this.loseLabel.string = score;
		} else {
			this.winLabel.string = "+" + score;
			this.loseLabel.string = "";
		}
		var chairIndex = NNModel.getChairIdIndex(this.chairId);
		if (chairIndex >= 0 && cardsArr) {
			this.showAllCardAndType(this.chairId, cardsArr);
			if (this.chairId === NNModel.getMyChairId()) {
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
			this.showAllCardAndType(chairId, cardArr);
			this.bShowCard = true;
		}
	},

	showAllCardAndType: function (chairId, cardArr) {
		if (this.bShowCard) return;
		if (chairId !== this.chairId) return;
		if (this.cardArray.length <= 0) return;

		this.layoutNode.getComponent(cc.Layout).enabled = false;
		var cardArr = NNLogic.getSortCard(cardArr);
		var myChairId = NNModel.getMyChairId();

		this.node.active = true;
		if (chairId === myChairId) {
			this.NNMainDialog.cuoPaiMask.active = false;
			if (this.peekCard) {
				this.peekCard.node.destroy();
				this.peekCard = null;
			}
			this.onOpenMyAction(cardArr);
		} else {
			this.onOpenAction(cardArr);
		}

		this.typeAni.parent.active = true;
		let name = this.getTypeAnimationName(cardArr);
		this.typeAni.active = true
		this.typeAni.getComponent(dragonBones.ArmatureDisplay).playAnimation(name, 1)
		var rate = NNLogic.getSpecialCardTypeRate(cardArr);
		let sex = NNModel.getSexByChairId(chairId);
		//5花牛
		if (rate === NNLogic.RATE_WUHUA) {
			AudioMgr.playSound('GameCommon/NN/sound1/N' + 12 + "_" + sex);
		} //炸弹牛
		else if (rate === NNLogic.RATE_ZHADAN) {
			AudioMgr.playSound('GameCommon/NN/sound1/N' + 13 + "_" + sex);
		} //4花牛
		else if (NNLogic.isFourColorNiu(cardArr)) {
			AudioMgr.playSound('GameCommon/NN/sound1/N' + 11 + "_" + sex);
		} //5xiaoniu
		else if (NNLogic.isFiveXiaoNiu(cardArr)) {
			AudioMgr.playSound('GameCommon/NN/sound1/N' + 14 + "_" + sex);
		} else {
			rate = NNLogic.getNormalCardType(cardArr);
			AudioMgr.playSound('GameCommon/NN/sound1/N' + rate + "_" + sex);
		}
		this.NNMainDialog.cuoPaiToggle.interactable = true; //可以搓牌的交互打开

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
	 * 发牌特效 下注完开始发牌
	 */
	sendCard: function (chairId, cardArr) {
		if (this.cardArray.length <= 0) return;
		this.NNMainDialog.cuoPaiToggle.interactable = false;
		this.node.active = true;
		var cardItemPos = this.node.parent.getPosition();
		var cardsPosArr = [];
		var startPos = cc.v2(-cardItemPos.x, -cardItemPos.y); //自己的负方向，就是父物体的 0 的位置

		for (let i = 0; i < this.cardArray.length; ++i) {
			let card = this.cardArray[i];
			cardsPosArr.push(card.node.getPosition());
			card.node.setPosition(startPos);
			card.showBack(true);
		}

		this.layoutNode.getComponent(cc.Layout).enabled = false;

		for (let i = 0; i < this.cardArray.length; ++i) {
			let node = this.cardArray[i].node;
			node.position = startPos;
			let moveAction = cc.moveTo(0.2, this.endCardPos0[i]);
			node.runAction(cc.sequence([cc.delayTime(0.03 * i + this.chairId * 0.1),
				cc.callFunc(function () {
					AudioMgr.playSound('GameCommon/NN/sound1/sendCard');
				}),
				moveAction
			]));
		}
		if (this.chairId !== NNModel.getMyChairId()) return;
		var callFunc = function () {
			this.NNMainDialog.doSendCardFinish();
		};
		this.scheduleOnce(function () {
			this.showCard(cardArr, this.myCardPos, callFunc.bind(this));
		}.bind(this), this.chairId * 0.1 + 0.03 * 5 + 0.22);
	},
	showCuoPai: function (cardIndex) {
		//搓牌特效
		this.NNMainDialog.cuoPaiMask.active = true;
		this.NNMainDialog.statePoint.setPosition(0, 210);
		var self = this;
		AssetMgr.loadResSync("PeekCard/PeekCard", cc.Prefab, function (err, prefab) {
			if (err) {
				cc.log("======PeekCard加载错误");
			} else {
				if (!cc.isValid(self)) {
					return;
				}
				let newNode = cc.instantiate(prefab);
				newNode.parent = self.NNMainDialog.cuopaiPoint;
				self.peekCard = newNode.getComponent("PeekCard");
				self.peekCard._moveSpeed = 0.7;
				self.peekCard.setCardSize(cc.size(250 * 2, 179 * 2));
				self.peekCard.setCardBack("GameCommon/cuoPaiCards/cardBack.png");
				self.peekCard.setCardFace(self.getCardImgRes(cardIndex));
				// self.peekCard.setPosition(0, -30);
				// self.peekCard.setShadow("ErRenNiuniu/shadow");
				self.peekCard.setFinishCallBack(function () {
					setTimeout(function () {
						if (!cc.isValid(self)) {
							return;
						}
						Global.NetworkManager.notify(GameMessageRouter, NNProto.getShowCardNotifyData());
						self.NNMainDialog && self.NNMainDialog.statePoint.setPosition(0, 120);
					}, 1000)
				});
				self.peekCard.init();
			}
		});
	},
	//显示牌
	showCard: function (cardArr, cardPosArr, cb) {
		if (this.chairId !== NNModel.getMyChairId()) return;
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
				cc.callFunc(function () {
					this.cardArray[j].setClickEnabled(true);
				}.bind(this))
			];
			var isCuopai = this.NNMainDialog.cuoPaiToggle.isChecked;
			if (isCuopai && j === 4) {
				//搓牌特效
				this.showCuoPai(j);
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
	/*
	 * 显示牌
	 */
	showMyCard: function (cardArr) {
		if (this.chairId === NNModel.getMyChairId()) {
			if (this.NNMainDialog.cuoPaiToggle.isChecked === true) {
				var callFunc = function (self) {
					self.setClickEnabled(true);
					self.flipCard();
				}
				for (var i = 0; i < 4; ++i) {
					this.cardArray[i].setValue(cardArr[i], callFunc);
				}
				this.cardArray[4].showFace(false);
				this.cardArray[4].showBack(false);
				var callFunc1 = function () {
					this.showCuoPai(4);
				};
				this.cardArray[4].setValue(cardArr[i], null, callFunc1.bind(this))
				// this.showCuoPai(4);

			} else {
				var callFunc1 = function (self) {
					self.setClickEnabled(true);
					self.flipCard();
				}
				for (var i = 0; i < 5; ++i) {
					this.cardArray[i].setValue(cardArr[i], callFunc1);
				}
			}
		} else {
			for (var i = 0; i < 5; ++i) {
				this.cardArray[i].setClickEnabled(false); //其他玩家不让点击
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
	// 	var gameRule = NNModel.getGameRule();
	// 	var rate = NNLogic.getSpecialCardTypeRate(cardArr);
	// 	if (rate === NNLogic.RATE_WUHUA) {
	// 		return 'GameCommon/NN/niuji/niu_12';
	// 	} else if (rate === NNLogic.RATE_ZHADAN) {
	// 		return 'GameCommon/NN/niuji/niu_13';
	// 	} else if (NNLogic.isFiveXiaoNiu(cardArr)) {
	// 		return 'GameCommon/NN/niuji/niu_14';
	// 	} else if (NNLogic.isFourColorNiu(cardArr)) {
	// 		return 'GameCommon/NN/niuji/niu_11';
	// 	} else {
	// 		return 'GameCommon/NN/niuji/niu_' + NNLogic.getNormalCardType(cardArr);
	// 	}
	// },

	/*
	 * 获取类型名
	 */
	getTypeAnimationName: function (cardArr) {
		var rate = NNLogic.getSpecialCardTypeRate(cardArr);
		if (rate === NNLogic.RATE_WUHUA) {
			return 'wuhuaniu'
		} else if (rate === NNLogic.RATE_ZHADAN) {
			return 'zhadanniu';
		} else if (NNLogic.isFiveXiaoNiu(cardArr)) {
			return 'wuxiaoniu';
		} else if (NNLogic.isFourColorNiu(cardArr)) {
			return 'sihuaniu';
		} else {
			if (NNLogic.getNormalCardType(cardArr) == 10) {
				return 'niuniu';
			} else if (NNLogic.getNormalCardType(cardArr) == 0) {
				return 'wuniu';
			} else {
				return 'niu' + NNLogic.getNormalCardType(cardArr);
			}

		}
	},

	/*
	 * 获取牌对应的图片url
	 */
	getCardUrl: function (cardId) {
		var num = NNLogic.getCardNumber(cardId);
		var color = NNLogic.getCardColor(cardId);
		var url = 'GameCommon/Card/';
		if (color === NNLogic.COLOR_FANGKUAI) {
			url += num;
		} else if (color === NNLogic.COLOR_CAOHUA) {
			url += (16 + num);
		} else if (color === NNLogic.COLOR_HONGTAO) {
			url += (32 + num);
		} else if (color === NNLogic.COLOR_HEITAO) {
			url += (48 + num);
		}
		return url;
	},


	updateJiSuan: function (chairId) {
		let mechairId = NNModel.getMyChairId();
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

			var type = NNLogic.getCardTypeBy2Group(oneGroup, twoGroup);
			//是否有牛按钮
			this.NNMainDialog.setYouNiuBtnEnable(!!type);
		} else {
			this.NNMainDialog.setYouNiuBtnEnable(false);

		}
		var isShootArray = [];
		for (var i = 0; i < this.cardArray.length; ++i) {
			if (this.cardArray[i].isShoot) {
				isShootArray.push(NNLogic.getCardCount(this.cardArray[i].cardData));
			}
		}
		this.NNMainDialog.updateJiSuan(isShootArray);

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
		Global.MessageCallback.removeCustomListener('NNONCARDSHOOT');
		Global.MessageCallback.removeListener('RoomMessagePush', this);
		Global.MessageCallback.removeListener('GameMessagePush', this);
	},
});