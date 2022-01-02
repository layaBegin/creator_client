var BJLLogic = require('./BJLLogic');
var BJLProto = require('./BJLProto');
var RoomProto = require('../../API/RoomProto');

cc.Class({
	extends: cc.Component,
	properties: {
		xianNode: cc.Node,
		zhuangNode: cc.Node,
		winSprite: cc.Sprite,
		peekNode: cc.Node,
	},

	onLoad: function () {
		Global.MessageCallback.addListener('GameMessagePush', this);
		Global.MessageCallback.addListener('RoomMessagePush', this);
		this.node.active = false;
		this.isPeekMode = false;
	},

	onDestroy: function () {
		Global.MessageCallback.removeListener('GameMessagePush', this);
		Global.MessageCallback.removeListener('RoomMessagePush', this);
	},

	messageCallbackHandler(router, msg) {
		if (router === 'RoomMessagePush') {
			if (msg.type === RoomProto.GET_ROOM_SCENE_INFO_PUSH) {
				if (msg.data.gameData.gameStatus === BJLProto.STATUS_POUR) {
					this.node.active = false;
				} else if (msg.data.gameData.gameStatus === BJLProto.STATUS_RESOUT) {
					this.node.active = true;
					this.reconectResout(msg.data.gameData.resultData.cardsArr, msg.data.gameData.resultData.type);
				} else {

				}
			}
		} else if (router === "GameMessagePush") {
			if (msg.type === BJLProto.RESOUT_PUSH) {
				this.node.active = true;
				var myUid = Global.Player.getPy('uid');
				this.isWin = false;
				if (msg.data.resout.userWinObj[myUid] && msg.data.resout.userWinObj[myUid] > 0) {
					this.isWin = true;
				}
				this.showResout(msg.data.resout.cardsArr, msg.data.resout.type);
			} else if (msg.type === BJLProto.STATUS_PUSH) {
				if (msg.data.gameStatus === BJLProto.STATUS_POUR) {
					this.node.active = false;
				}
			}
		}
	},

	/*
	 * 显示结果
	 */
	showResout: function (cardsArr, type) {
		this.cardsArr = cardsArr;
		this.currentType = type;
		let xianValue = this.xianNode.getChildByName('XianValue').getComponent(cc.Sprite);
		let zhuangValue = this.zhuangNode.getChildByName('ZhuangValue').getComponent(cc.Sprite);
		this.winSprite.node.active = false;
		Global.CCHelper.updateSpriteFrame('BaiJiaLe/xian0', xianValue);
		Global.CCHelper.updateSpriteFrame('BaiJiaLe/zhuang0', zhuangValue);
		let arr1 = cardsArr[0];
		let arr2 = cardsArr[1];
		let i;
		this.nodeArr = [
			this.xianNode.getChildByName('Card1'),
			this.zhuangNode.getChildByName('Card1'),
			this.xianNode.getChildByName('Card2'),
			this.zhuangNode.getChildByName('Card2'),
		];
		this.cardArr = [arr1[0], arr2[0], arr1[1], arr2[1]];
		if (!isNaN(arr1[2])) {
			this.nodeArr.push(this.xianNode.getChildByName('Card3'));
			this.cardArr.push(arr1[2]);
		}
		if (!isNaN(arr2[2])) {
			this.nodeArr.push(this.zhuangNode.getChildByName('Card3'));
			this.cardArr.push(arr2[2]);
		}
		for (i = 1; i <= 3; ++i) {
			this.xianNode.getChildByName('Card' + i).active = false;
			this.zhuangNode.getChildByName('Card' + i).active = false;
		}
		for (i = 0; i < this.nodeArr.length; ++i) {
			Global.CCHelper.updateSpriteFrame('GameCommon/Card/card_back', this.nodeArr[i].getComponent(cc.Sprite));
		}

		this.xianCount = 0;
		this.zhuangCount = 0;
		this.index = 0;
		this.stepState = 0; //0表示第一阶段，前四张牌；1表示第二阶段，补牌
		this.nodeCount = this.nodeArr.length; //如果不搓牌直接播放完
		// if (this.peekState != 0) {
		// 	this.nodeCount = 4;//需要搓牌先前四张
		// }

		if ((this.currentType & BJLLogic.WIN_ZHUANG) > 0) {
			Global.CCHelper.updateSpriteFrame('BaiJiaLe/zhuangying', this.winSprite);
		} else if ((this.currentType & BJLLogic.WIN_XIAN) > 0) {
			Global.CCHelper.updateSpriteFrame('BaiJiaLe/xianying', this.winSprite);
		} else {
			Global.CCHelper.updateSpriteFrame('BaiJiaLe/he', this.winSprite);
		}
		this.schedule(this.showCardEffect, 1.2);
	},

	//显示翻牌效果
	showCardEffect: function () {
		if (this.index >= this.nodeCount) {
			this.unschedule(this.showCardEffect);
			if (this.index == this.nodeArr.length) {
				this.showDotAnimal();
			}
			return;
		}
		this.nodeArr[this.index].active = true;
		let typeState = 0; //0表示闲家，1表示庄家
		if (this.nodeArr[this.index].parent != this.xianNode) {
			typeState = 1;
		}
		let cardValue = BJLLogic.getCardCount(this.cardArr[this.index]);
		this.playCardSound(typeState, this.index, cardValue);

		// if (this.peekState != 0) {//当前局需要搓牌
		// 	if (this.index > 1) {//进入需要搓牌的
		// 		if (this.peekState == 1) {//闲家搓牌
		// 			if (typeState == 0) {//当前闲家
		// 				this.showPeekCard();
		// 				return;
		// 			}
		// 		}
		// 		else {//庄家搓牌
		// 			if (typeState == 1) {//当前庄家
		// 				this.showPeekCard();
		// 				return;
		// 			}
		// 		}
		// 	}
		// }
		this.showCardFaceEffect(this.index);
	},

	//显示牌面效果
	showCardFaceEffect: function (index) {
		let sequenceArr = [];
		sequenceArr.push(cc.scaleTo(0.1, 0, 1));
		let self = this;
		let setCardFaceInfo = cc.callFunc(function () {
			Global.CCHelper.updateSpriteFrame(self.getCardUrl(self.cardArr[index]), self.nodeArr[index].getComponent(cc.Sprite));
			AudioMgr.playSound('BaiJiaLe/Audio/flipcard');
			if (self.nodeArr[index].parent == self.xianNode) {
				self.xianCount += BJLLogic.getCardCount(self.cardArr[index]);
				let tempXianValue = self.xianCount % 10;
				let xianValue = self.xianNode.getChildByName('XianValue').getComponent(cc.Sprite);
				Global.CCHelper.updateSpriteFrame('BaiJiaLe/xian' + tempXianValue, xianValue);
			} else {
				self.zhuangCount += BJLLogic.getCardCount(self.cardArr[index]);
				let tempZhuangValue = self.zhuangCount % 10;
				let zhuangValue = self.zhuangNode.getChildByName('ZhuangValue').getComponent(cc.Sprite);
				Global.CCHelper.updateSpriteFrame('BaiJiaLe/zhuang' + tempZhuangValue, zhuangValue);
			}
		});
		sequenceArr.push(setCardFaceInfo);
		sequenceArr.push(cc.scaleTo(0.1, 1, 1));
		sequenceArr.push(cc.callFunc(function () {
			++self.index;
		}));
		this.nodeArr[index].runAction(cc.sequence(sequenceArr));
	},

	//播放牌的声音
	playCardSound: function (typeState, index, cardValue) {
		let soundStr = '';
		if (typeState === 0) {
			// if (index < 4) {
			soundStr = 'BaiJiaLe/Audio/player';
			// } else {
			// 	if (cardValue === 8) {
			// 		soundStr = 'BaiJiaLe/Audio/player_8';
			// 	}
			// 	else if (cardValue === 9) {
			// 		soundStr = 'BaiJiaLe/Audio/player_9';
			// 	} else {
			// 		soundStr = 'BaiJiaLe/Audio/player_add';
			// 	}
			// }
		} else {
			// if (index < 4) {
			soundStr = 'BaiJiaLe/Audio/banker';
			// } else {
			// 	if (cardValue === 8) {
			// 		soundStr = 'BaiJiaLe/Audio/banker_8';
			// 	}
			// 	else if (cardValue === 9) {
			// 		soundStr = 'BaiJiaLe/Audio/banker_9';
			// 	} else {
			// 		soundStr = 'BaiJiaLe/Audio/banker_add';
			// 	}
			// }
		}
		AudioMgr.playSound(soundStr);
	},

	//显示搓牌
	// showPeekCard: function () {
	// 	this.peekCardIndex = this.index;
	// 	let self = this;
	// 	AssetMgr.loadResSync("PeekCard/PeekCard", cc.Prefab, function (err, prefab) {
	// 		if (err) {
	// 			cc.log("搓牌资源加载出错：" + err);
	// 		}
	// 		else {
	// 			let newNode = cc.instantiate(prefab);
	// 			newNode.parent = self.peekNode;
	// 			self.peekCard = newNode.getComponent("PeekCard");
	// 			self.peekCard._moveSpeed = 0.7;
	// 			self.peekCard.setCardSize(cc.size(250 * 1.5, 179 * 1.5));
	// 			self.peekCard.setCardBack("GameCommon/cuoPaiCards/cardBack.png");
	// 			let cardFace = self.getPeekCardUrl(self.cardArr[self.peekCardIndex]);
	// 			// cc.log("cardFace:" + cardFace);
	// 			self.peekCard.setCardFace(cardFace);//设置牌面信息
	// 			// self.peekCard.setShadow("GameCommon/cuoPaiCards/shadow.png");
	// 			self.peekCard.setFinishCallBack(function () {
	// 				self.peekCardFinish();
	// 			});
	// 			self.peekCard.init();
	// 			self.scheduleOnce(function () {
	// 				self.peekCardFinish();
	// 			}, 3);
	// 		}
	// 	});
	// 	++this.index;
	// },

	peekCardFinish: function () {
		if (this.peekCardIndex == -1) {
			return;
		}
		if (this.stepState == 0) {
			this.stepState = 1;
			this.nodeCount = this.nodeArr.length;
			this.schedule(this.showCardEffect, 1.2);
		}
		this.showCardFaceEffect(this.peekCardIndex);
		this.peekCardIndex = -1;
		if (this.peekCard) {
			this.peekCard.node.destroy();
			this.peekCard = null;
		}
	},

	/*
	 * 显示点数动画
	 */
	showDotAnimal: function () {
		// let tm = 0;
		// this.scheduleOnce(function () {
		// 	AudioMgr.playSound('BaiJiaLe/Audio/player');
		// }, 1);
		// this.scheduleOnce(function () {
		// 	AudioMgr.playSound('BaiJiaLe/Audio/point_' + BJLLogic.getCardArrCount(this.cardsArr[0]));
		// }, 2);
		// tm = 2;
		// this.scheduleOnce(function () {
		// 	AudioMgr.playSound('BaiJiaLe/Audio/banker');
		// }, 1 + tm);
		// this.scheduleOnce(function () {
		// 	AudioMgr.playSound('BaiJiaLe/Audio/point_' + BJLLogic.getCardArrCount(this.cardsArr[1]));
		// }, 2 + tm);

		this.showWinSprite();
		// let cardCount = this.cardsArr[0].length + this.cardsArr[1].length;
		// tm = cardCount + 2;
		// this.scheduleOnce(function () {
		// 	this.showWinSprite();
		// }.bind(this), tm);
	},

	/*
	 * 显示输赢
	 */
	showWinSprite: function () {
		var self = this;
		this.winSprite.node.active = true;
		this.winSprite.node.setScale(1.3);
		this.winSprite.node.runAction(cc.sequence(
			cc.scaleTo(0.2, 1, 1),
			cc.callFunc(function () {
				AudioMgr.playSound('BaiJiaLe/Audio/papa');

			}),
			cc.delayTime(0.5),
			cc.callFunc(function () {
				if ((self.currentType & BJLLogic.WIN_ZHUANG) > 0) {
					AudioMgr.playSound('BaiJiaLe/Audio/banker_win');
				} else if ((self.currentType & BJLLogic.WIN_XIAN) > 0) {
					AudioMgr.playSound('BaiJiaLe/Audio/player_win');
				} else {
					AudioMgr.playSound('BaiJiaLe/Audio/tie');
				}
				if (self.isWin) {
					AudioMgr.playSound('BaiJiaLe/Audio/win_game');
				}
			})
		));
	},

	/*
	 * 断线重连时显示结果
	 */
	reconectResout: function (cardsArr, type) {
		var xianValue = this.xianNode.getChildByName('XianValue').getComponent(cc.Sprite);
		var zhuangValue = this.zhuangNode.getChildByName('ZhuangValue').getComponent(cc.Sprite);
		this.winSprite.node.active = true;
		var arr1 = cardsArr[0];
		var arr2 = cardsArr[1];
		var i, node;
		for (i = 0; i < 3; ++i) {
			node = this.xianNode.getChildByName('Card' + (i + 1));
			if (i < arr1.length) {
				node.active = true;
				Global.CCHelper.updateSpriteFrame(this.getCardUrl(arr1[i]), node.getComponent(cc.Sprite));
			} else {
				node.active = false;
			}
			node = this.zhuangNode.getChildByName('Card' + (i + 1));
			if (i < arr2.length) {
				node.active = true;
				Global.CCHelper.updateSpriteFrame(this.getCardUrl(arr2[i]), node.getComponent(cc.Sprite));
			} else {
				node.active = false;
			}
		}

		var xianCount = 0,
			zhuangCount = 0;
		for (i = 0; i < arr1.length; ++i) {
			xianCount += BJLLogic.getCardCount(arr1[i]);
		}
		for (i = 0; i < arr2.length; ++i) {
			zhuangCount += BJLLogic.getCardCount(arr2[i]);
		}
		xianCount = xianCount % 10;
		Global.CCHelper.updateSpriteFrame('BaiJiaLe/xian' + xianCount, xianValue);
		zhuangCount = zhuangCount % 10;
		Global.CCHelper.updateSpriteFrame('BaiJiaLe/zhuang' + zhuangCount, zhuangValue);
		if ((type & BJLLogic.WIN_ZHUANG) > 0) {
			Global.CCHelper.updateSpriteFrame('BaiJiaLe/zhuangying', this.winSprite);
		} else if ((type & BJLLogic.WIN_XIAN) > 0) {
			Global.CCHelper.updateSpriteFrame('BaiJiaLe/xianying', this.winSprite);
		} else {
			Global.CCHelper.updateSpriteFrame('BaiJiaLe/he', this.winSprite);
		}
	},

	/*
	 *
	 */
	getCardUrl: function (cardId) {
		let num = cardId % 13 + 1;
		let color = Math.floor(cardId / 13);
		let url = 'GameCommon/Card/';
		if (color === 0) {
			url += num;
		} else if (color === 1) {
			url += (16 + num);
		} else if (color === 2) {
			url += (32 + num);
		} else if (color === 3) {
			url += (48 + num);
		}
		return url;
	},

	//获取搓牌url
	getPeekCardUrl: function (cardValue) {
		let num = cardValue % 13 + 1;
		let color = Math.floor(cardValue / 13);
		let url = 'GameCommon/cuoPaiCards/value_' + num + '_' + color + ".png";
		return url;
	},

	//更新下注信息
	updateBetInfo: function (betRecord) {
		this.betRecord = betRecord;
		this.peekState = 0; //搓牌状态，0表示不搓，1表示搓闲，2表示搓庄
		let xianValue = 0;
		let zhuangValue = 0;
		if (this.betRecord[BJLLogic.WIN_XIAN])
			xianValue += this.betRecord[BJLLogic.WIN_XIAN];
		if (this.betRecord[BJLLogic.WIN_XIANDUI])
			xianValue += this.betRecord[BJLLogic.WIN_XIANDUI];
		if (this.betRecord[BJLLogic.WIN_XIANTW])
			xianValue += this.betRecord[BJLLogic.WIN_XIANTW];
		if (this.betRecord[BJLLogic.WIN_ZHUANG])
			zhuangValue += this.betRecord[BJLLogic.WIN_ZHUANG];
		if (this.betRecord[BJLLogic.WIN_ZHUANGDUI])
			zhuangValue += this.betRecord[BJLLogic.WIN_ZHUANGDUI];
		if (this.betRecord[BJLLogic.WIN_ZHUANGTW])
			zhuangValue += this.betRecord[BJLLogic.WIN_ZHUANGTW];

		if (xianValue == 0 && zhuangValue == 0) {
			this.peekState = 0;
			return;
		}
		if (xianValue > zhuangValue) {
			this.peekState = 1;
		} else {
			this.peekState = 2;
		}
		if (this.isPeekMode == false) {
			this.peekState = 0;
		}
	}
});