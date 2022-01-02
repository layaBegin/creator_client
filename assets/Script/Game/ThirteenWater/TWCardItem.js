var TWModel = require('./TWModel');
var TWLogic = require('./TWLogic');
var GameProto = require('./TWProto');

cc.Class({
	extends: cc.Component,

	properties: {
		guaiLabel: cc.Label,
		toudaoLabel: cc.Label,
		zhongdaoLabel: cc.Label,
		weidaoLabel: cc.Label,
		zongfenLabel: cc.Label,
		speicalCardSprite: cc.Sprite,
		typeSprite: cc.Sprite,
		gameTypeSprite: cc.Sprite,
		gunSprite: cc.Sprite,
		holesNode: cc.Node,
		cardsNode: cc.Node,
		itemId: cc.Integer,

		toudaoLabel2: cc.Label,
		zhongdaoLabel2: cc.Label,
		weidaoLabel2: cc.Label,
		zongfenLabel2: cc.Label,

		node_bg_Toudao: cc.Node,
		node_bg_Zhongdao: cc.Node,
		node_bg_Weidao: cc.Node,
		node_bg_Zongfen: cc.Node,
	},

	onLoad: function () {
		this.cardNodeArr = [];
		this.gunSecond = 1.2;
		this.showTypeSecond = 0.5;
		this.turnSecond = 1.0;
		this.itemId = parseInt(this.itemId);

		this.isShowSpecialCard = false;

		for (let i = 0; i < 13; ++i) {
			let node = new cc.Node();
			node.parent = this.cardsNode;
			node.addComponent(cc.Sprite).sizeMode = cc.Sprite.SizeMode.CUSTOM;
			node.setContentSize(146, 204);
			node.zIndex = i + 1;
			this.cardNodeArr.push(node);
			node.on(cc.Node.EventType.TOUCH_START, function (event) {
				if (this.cardType === 2) {
					this.setCardType7();
				} else if (this.cardType === 7) {
					this.setCardType8();
				}
			}.bind(this));
		}
		for (let i = 0; i < 5; ++i) {
			this.holesNode.getChildByName('HoleSprite' + (i + 1)).active = false;
		}

		this.cardResPath = "ThirteenWater/TWCard/";
	},

	onTouchCard: function () { },

	offLineAndClient: function () {
		if (!TWModel.isCurChairPlaying(this.chairId)) return;

		this.unscheduleAllCallbacks();
		this.holesNode.active = false;
		let gameStatus = TWModel.gameStatus;
		let resout = TWModel.getResout();
		if (gameStatus === GameProto.GAME_STATUS_GAMEING) {
			this.node.active = true;
			if (TWModel.hasSortCard(this.chairId)) {
				this.setCardType1();
				this.setCardType2();
			} else {
				this.setCardType1();
			}
		} else if (gameStatus === GameProto.GAME_STATUS_SETTLE) {
			this.node.active = true;
			this.setCardType1();
			this.setCardType2();
			//this.showCard(TWModel.getResout(), TWModel.getGameSettleTm());
			this.setCardType3(resout);
			this.setCardType4(resout);
			this.setCardType5(resout);
			this.scheduleOnce(function () {
				this.displayCard(resout);
			}.bind(this), 0.6);
			this.scheduleOnce(function () {
				this.setCardType6(resout);
			}.bind(this), 0.1);
			/*			if(this.chairId === TWModel.getMyChairId()) {
							Global.DialogManager.createDialog('ThirteenWater/TWSettleDialog');
							this.showMainContinueButton();
						}*/
		}
		/*else if(gameStatus === GameProto.GAME_STATUS_NOTSTART) {
			//if(TWModel.getGameStartedOnce() && !TWModel.getPlayerReady(myChairId)) {
			if(false){//TWModel.getGameStartedOnce()) {
				this.node.active = true;
				this.setCardType1();
				this.setCardType2();
				this.setCardType3(resout);
				this.setCardType4(resout);
				this.setCardType5(resout);
				this.scheduleOnce(function() {
					this.setCardType6(resout);
				}.bind(this), 0.1);
				if(this.chairId === TWModel.getMyChairId()) {
					Global.DialogManager.createDialog('ThirteenWater/TWSettleDialog');
					this.showMainContinueButton();
				}
				//this.showCard(TWModel.getResout(), TWModel.getGameSettleTm());
			}
		}*/
	},

	onDestroy: function () { },

	setChairId: function (chairId) {
		this.chairId = chairId;
		if (TWModel.playingChairArr.indexOf(chairId) === -1) {
			this.node.active = false;
			return;
		}
		this.node.active = true;
		// test
		this.offLineAndClient();
	},

	onSendCardPush: function () {
		if (!TWModel.isCurChairPlaying(this.chairId)) return;
		this.node.active = true;

		this.unscheduleAllCallbacks();
		this.holesNode.active = false;

		this.setCardType1(true);
	},

	onShowGuaiPai: function () {
		// this.setNodeSpriteFrame('ThirteenWater/TWCommon/TW_guaipai', this.gameTypeSprite.node);
		// let index = TWModel.getIndexByChairId(this.chairId);
		// if(index == 0){
		// 	this.gameTypeSprite.node.y = -116;
		// }else if(index == 1){
		// 	this.gameTypeSprite.node.y = -183;
		// }else if(index == 2){
		// 	this.gameTypeSprite.node.y = -53;
		// }else if(index == 3){
		// 	this.gameTypeSprite.node.y = -200;
		// }

		// this.gameTypeSprite.node.active = true;

		this.speicalCardSprite.node.active = true;

		this.isShowSpecialCard = true;
	},

	onSortCardsPush: function () {
		if (this.sendCardCallback) {
			this.unschedule(this.sendCardCallback);
			this.sendCardCallback = null;
			this.setCardType1();
		}
		this.setCardType2();
	},

	setDelayStatus: function () {
		this.setNodeSpriteFrame('ThirteenWater/TWCommon/ysz', this.gameTypeSprite.node);
	},

	showCard: function (resout, showResultFinishedCallback) {
		let myChairId = TWModel.getMyChairId();
		let myIndex = TWModel.playingChairArr.indexOf(myChairId);
		let curIndex = TWModel.playingChairArr.indexOf(this.chairId);

		this.isOnAniaml = true;
		this.showResultFinishedCallback = showResultFinishedCallback;
		var memberCount = resout.cardsArr.length;
		var offSecond = (curIndex + memberCount - myIndex) % memberCount + 1;
		this.setCardType8();
		this.canFanpai = false;
		this.gameTypeSprite.node.active = false;
		var mianbaiCount = 0,
			preMianbai = 0;
		for (var i = 0; i < memberCount; ++i) {
			if (TWModel.getMianbai(i)) {
				++mianbaiCount;
				if (i <= curIndex) {
					++preMianbai;
				}
			}
		}
		this.scheduleOnce(function () {
			this.setCardType3(resout, true);
		}.bind(this), (offSecond - preMianbai) * this.turnSecond);
		this.scheduleOnce(function () {
				this.setCardType4(resout, true);
			}.bind(this),
			((memberCount - mianbaiCount) * 1 + offSecond - preMianbai) * this.turnSecond + this.showTypeSecond);
		this.scheduleOnce(function () {
				this.setCardType5(resout, true);
			}.bind(this),
			((memberCount - mianbaiCount) * 2 + offSecond - preMianbai) * this.turnSecond + 2 * this.showTypeSecond);

		this.scheduleOnce(function () {
			this.daqiangAnimal(resout);
		}.bind(this), (1 + (memberCount - mianbaiCount) * 3) * this.turnSecond + 3 * this.showTypeSecond);
	},

	onHide: function () {
		this.guaiLabel.node.active = false;
		this.toudaoLabel.node.active = false;
		if (this.toudaoLabel2)
			this.toudaoLabel2.node.active = false;
		if (this.node_bg_Toudao)
			this.node_bg_Toudao.active = false;
		this.zhongdaoLabel.node.active = false;
		if (this.zhongdaoLabel2)
			this.zhongdaoLabel2.node.active = false;
		if (this.node_bg_Zhongdao)
			this.node_bg_Zhongdao.active = false;
		this.weidaoLabel.node.active = false;
		if (this.weidaoLabel2)
			this.weidaoLabel.node.active = false;
		if (this.node_bg_Weidao)
			this.node_bg_Weidao.active = false;
		this.zongfenLabel.node.active = false;
		if (this.zongfenLabel2)
			this.zongfenLabel2.node.active = false;
		if (this.node_bg_Zongfen)
			this.node_bg_Zongfen.active = false;
		this.typeSprite.node.active = false;

		this.cardsNode.active = false;
	},

	/* 未理牌状态 */
	setCardType1: function (hasAnimal) {
		this.cardsNode.active = true;
		this.cardType = 1;
		var splitX = 30;
		var posArr = [ // 座位坐标
			{
				x: -126,
				y: -105
			}, {
				x: -97,
				y: -54
			}, {
				x: -165,
				y: 128
			}, {
				x: -280,
				y: -54
			}
		];
		this.cardsNode.setPosition(0, 0);
		this.cardsNode.setScale(1, 1);
		for (var i = 0; i < this.cardNodeArr.length; ++i) {
			if (hasAnimal) {
				this.cardNodeArr[i].x = posArr[this.itemId].x + splitX * 18;
				this.cardNodeArr[i].active = false;
			} else {
				this.cardNodeArr[i].x = posArr[this.itemId].x + splitX * i;
			}
			this.cardNodeArr[i].y = posArr[this.itemId].y;
			this.cardNodeArr[i].rotation = 0;
			this.setNodeSpriteFrame("GameCommon/Cards/cardBack", this.cardNodeArr[i]);
			this.cardNodeArr[i].setScale(1.1, 1.1);
		}
		if (hasAnimal) {
			AudioMgr.playSound('ThirteenWater/TWSound/tw_fapai1');
			var index = 0;
			var self = this;
			this.sendCardCallback = function () {
				if (index === 13) {
					self.unschedule(self.sendCardCallback);
					self.sendCardCallback = null;
					self.setNodeSpriteFrame('ThirteenWater/TWCommon/TW_lipaizhong', self.gameTypeSprite.node);
					self.gameTypeSprite.node.active = true;
					return;
				}
				self.cardNodeArr[index].active = true;
				self.cardNodeArr[index].runAction(cc.moveTo(0.1, cc.v2(posArr[self.itemId].x + splitX * index, posArr[self.itemId].y)));
				++index;
			};
			this.schedule(this.sendCardCallback, 0.05);
		} else {
			this.setNodeSpriteFrame('ThirteenWater/TWCommon/TW_lipaizhong', this.gameTypeSprite.node);
			this.gameTypeSprite.node.active = true;
		}
		if (this.chairId === TWModel.getMyChairId()) {
			this.gameTypeSprite.node.setPosition(24, -110);
		}
		this.guaiLabel.node.active = false;
		this.toudaoLabel.node.active = false;
		if (this.toudaoLabel2)
			this.toudaoLabel2.node.active = false;
		if (this.node_bg_Toudao)
			this.node_bg_Toudao.active = false;
		this.zhongdaoLabel.node.active = false;
		if (this.zhongdaoLabel2)
			this.zhongdaoLabel2.node.active = false;
		if (this.node_bg_Zhongdao)
			this.node_bg_Zhongdao.active = false;
		this.weidaoLabel.node.active = false;
		if (this.weidaoLabel2)
			this.weidaoLabel2.node.active = false;
		if (this.node_bg_Weidao)
			this.node_bg_Weidao.active = false;
		this.zongfenLabel.node.active = false;
		if (this.zongfenLabel2)
			this.zongfenLabel2.node.active = false;
		if (this.node_bg_Zongfen)
			this.node_bg_Zongfen.active = false;
		this.typeSprite.node.active = false;
	},

	/* 理牌状态 */
	setCardType2: function () {
		this.canFanpai = true;
		this.cardType = 2;
		this.gameTypeSprite.node.active = false;
		var posArr = [ // 牌坐标
			{
				x: -50,
				y: 172
			}, {
				x: 25,
				y: 173
			}, {
				x: 96,
				y: 154
			}, {
				x: -123,
				y: -16
			}, {
				x: -54,
				y: 11
			}, {
				x: 27,
				y: 8
			}, {
				x: 98,
				y: -4
			},
			{
				x: 165,
				y: -46
			}, {
				x: -123,
				y: -203
			}, {
				x: -49,
				y: -178
			}, {
				x: 27,
				y: -175
			}, {
				x: 95,
				y: -190
			}, {
				x: 170,
				y: -221
			},
		];
		var rotate = [-23, -8, 10, -40, -22, -7, 12, 28, -40, -22, -5, 13, 28]; // 牌旋转角度
		var cardsNodePosArr = [ // 座位坐标
			{
				x: 0,
				y: 66
			}, {
				x: 120,
				y: -72
			}, {
				x: 16,
				y: 70
			}, {
				x: -172,
				y: -68
			}
		];
		this.cardsNode.setPosition(cardsNodePosArr[this.itemId].x, cardsNodePosArr[this.itemId].y);
		if (this.itemId !== 0) {
			this.cardsNode.setScale(0.8, 0.8);
		} else {
			this.cardsNode.setScale(1, 1);
		}
		for (var i = 0; i < this.cardNodeArr.length; ++i) {
			this.cardNodeArr[i].active = true;
			this.cardNodeArr[i].setPosition(posArr[i].x, posArr[i].y);
			this.cardNodeArr[i].rotation = rotate[i];
			this.cardNodeArr[i].setScale(1.2, 1.2);
			// this.cardNodeArr[i].setScale(1, 1);
		}
		if (TWModel.getMianbai(this.chairId) && this.chairId === TWModel.getMyChairId()) {
			// this.setNodeSpriteFrame('ThirteenWater/TWCommon/TW_guaipai', this.gameTypeSprite.node);

			// let index = TWModel.getIndexByChairId(this.chairId);
			// if(index == 0){
			// 	this.gameTypeSprite.node.y = -116;
			// }else if(index == 1){
			// 	this.gameTypeSprite.node.y = -183;
			// }else if(index == 2){
			// 	this.gameTypeSprite.node.y = -53;
			// }else if(index == 3){
			// 	this.gameTypeSprite.node.y = -200;
			// }
			// this.gameTypeSprite.node.active = true;
			this.speicalCardSprite.node.active = true;
		} else {
			this.gameTypeSprite.node.active = false;
		}
	},

	/* 明头牌状态 */
	setCardType3: function (resout, showType) {
		this.cardType = 3;
		let myChairId = TWModel.getMyChairId();
		let myIndex = TWModel.playingChairArr.indexOf(myChairId);
		let curIndex = TWModel.playingChairArr.indexOf(this.chairId);

		let memberCount = TWModel.playingChairArr.length;
		let offSecond = (curIndex + memberCount - myIndex) % memberCount; //(this.chairId+memberCount-myChairId)%memberCount;
		let cardIdArr = resout.cardsArr[curIndex];
		let aftMianbai = 0;
		for (let i = 0; i < memberCount; ++i) {
			if (TWModel.getMianbai(i) && TWModel.playingChairArr[i] > this.chairId) {
				++aftMianbai;
			}
		}
		let delayTime = (memberCount - offSecond - aftMianbai) * this.turnSecond;
		if (!showType) {
			delayTime = 0;
		}
		let self = this;

		if (!TWModel.getMianbai(curIndex)) {
			for (let i = 0; i < 3; ++i) {
				this.setNodeSpriteFrame(this.getCardUrl(cardIdArr[i]), this.cardNodeArr[i]);
			}
		}
		if (myIndex >= 0) {
			let url = '',
				str = '';
			if (this.chairId !== myChairId) {
				let score = resout.scoresArr[myIndex][curIndex][0];
				if (score >= 0) {
					str = '赢+' + parseFloat(score.toFixed(2));
					url = 'ThirteenWater/TWCommon/fnt_game2';
				} else {
					str = '输' + parseFloat(score.toFixed(2));
					url = 'ThirteenWater/TWCommon/fnt_game1';
				}
			} else {
				let score = 0,
					zongStr = '';
				for (let i = 0; i < resout.scoresArr[myIndex].length; ++i) {
					score += resout.scoresArr[myIndex][i][0];
				}
				if (score >= 0) {
					str = '头+' + parseFloat(score.toFixed(2));
					zongStr = '总+' + parseFloat(score.toFixed(2));
					url = 'ThirteenWater/TWCommon/fnt_game3';
				} else {
					str = '头' + parseFloat(score.toFixed(2));
					zongStr = '总' + parseFloat(score.toFixed(2));
					url = 'ThirteenWater/TWCommon/fnt_game4';
				}
				this.scheduleOnce(function () {
					AssetMgr.loadResSync(url, cc.Font, function (err, font) {
						if (!err) {
							if (!cc.isValid(self)) {
								return;
							}
							self.zongfenLabel.font = font;
							self.zongfenLabel.string = zongStr;
							self.zongfenLabel.node.active = true;
							if (self.node_bg_Zongfen)
								self.node_bg_Zongfen.active = true;
						}
					});
				}, delayTime);
			}

			this.scheduleOnce(function () {
				AssetMgr.loadResSync(url, cc.Font, function (err, font) {
					if (!err) {
						if (!cc.isValid(self)) {
							return;
						}
						self.toudaoLabel.font = font;
						self.toudaoLabel.string = str;
						self.toudaoLabel.node.active = true;
						if (self.node_bg_Toudao)
							self.node_bg_Toudao.active = true;
					}
				});
			}, delayTime);
		}
		if (showType) {
			let touArr = TWLogic.getTouArr(resout.cardsArr[TWModel.playingChairArr.indexOf(this.chairId)]);
			if (!TWModel.getMianbai(this.chairId)) {
				AudioMgr.playSound(this.getSoundUrlByCardArr(touArr, 'tou'));
				this.setNodeSpriteFrame(this.getTypeUrlByCardArr(touArr, 'tou'), this.typeSprite.node);
				this.typeSprite.node.active = true;
				this.scheduleOnce(function () {
					this.typeSprite.node.active = false;
					this.typeSprite.spriteFrame = null;
				}.bind(this), 1);
			}
		}

		if (this.isShowSpecialCard == false)
			this.speicalCardSprite.node.active = false;
	},

	/* 明中牌状态 */
	setCardType4: function (resout, showType) {
		this.cardType = 4;
		var myChairId = TWModel.getMyChairId();
		let myIndex = TWModel.playingChairArr.indexOf(myChairId);
		let curIndex = TWModel.playingChairArr.indexOf(this.chairId);

		var memberCount = resout.cardsArr.length;
		var offSecond = (curIndex + memberCount - myIndex) % memberCount; //(this.chairId+memberCount-myChairId)%memberCount;
		var aftMianbai = 0;
		for (let i = 0; i < memberCount; ++i) {
			if (TWModel.getMianbai(i) && TWModel.playingChairArr[i] > this.chairId) {
				++aftMianbai;
			}
		}
		var cardIdArr = resout.cardsArr[curIndex];
		var delayTime = (memberCount - offSecond - aftMianbai) * this.turnSecond;
		if (!showType) {
			delayTime = 0;
		}
		var self = this;
		if (!TWModel.getMianbai(curIndex)) {
			for (let i = 3; i < 8; ++i) {
				this.setNodeSpriteFrame(this.getCardUrl(cardIdArr[i]), this.cardNodeArr[i]);
			}
		}
		if (myIndex >= 0) {
			var url = '';
			var str = '';
			if (this.chairId !== myChairId) {
				let score = resout.scoresArr[myIndex][curIndex][1];
				if (score >= 0) {
					str = '赢+' + parseFloat(score.toFixed(2));
					url = 'ThirteenWater/TWCommon/fnt_game2';
				} else {
					str = '输' + score;
					url = 'ThirteenWater/TWCommon/fnt_game1';
				}
			} else {
				let score = 0,
					zongStr, zongScore = 0,
					zongUrl;
				for (let i = 0; i < resout.daqiangArr[myIndex].length; ++i) {
					score += resout.scoresArr[myIndex][i][1];
					zongScore += resout.scoresArr[myIndex][i][0] + resout.scoresArr[myIndex][i][1];
				}
				if (score >= 0) {
					str = '中+' + parseFloat(score.toFixed(2));
					url = 'ThirteenWater/TWCommon/fnt_game3';
				} else {
					str = '中' + parseFloat(score.toFixed(2));
					url = 'ThirteenWater/TWCommon/fnt_game4';
				}
				if (zongScore >= 0) {
					zongStr = '总+' + parseFloat(zongScore.toFixed(2));
					zongUrl = 'ThirteenWater/TWCommon/fnt_game3';
				} else {
					zongStr = '总' + parseFloat(zongScore.toFixed(2));
					zongUrl = 'ThirteenWater/TWCommon/fnt_game4';
				}
				this.scheduleOnce(function () {
					AssetMgr.loadResSync(zongUrl, cc.Font, function (err, font) {
						if (!err) {
							if (!cc.isValid(self)) {
								return;
							}
							self.zongfenLabel.font = font;
							self.zongfenLabel.string = zongStr;
							self.zongfenLabel.node.active = true;
							if (self.node_bg_Zongfen)
								self.node_bg_Zongfen.active = true;
						}
					});
				}, delayTime);
			}

			this.scheduleOnce(function () {
				AssetMgr.loadResSync(url, cc.Font, function (err, font) {
					if (!err) {
						if (!cc.isValid(self)) {
							return;
						}
						self.zhongdaoLabel.font = font;
						self.zhongdaoLabel.string = str;
						self.zhongdaoLabel.node.active = true;
						if (self.node_bg_Zhongdao)
							self.node_bg_Zhongdao.active = true;
					}
				});
			}, delayTime);
		}
		if (showType) {
			var zhongArr = TWLogic.getZhongArr(resout.cardsArr[TWModel.playingChairArr.indexOf(this.chairId)]);
			if (!TWModel.getMianbai(this.chairId)) {
				this.setNodeSpriteFrame(this.getTypeUrlByCardArr(zhongArr), this.typeSprite.node);
				AudioMgr.playSound(this.getSoundUrlByCardArr(zhongArr));
				this.typeSprite.node.active = true;
				this.scheduleOnce(function () {
					this.typeSprite.node.active = false;
					this.typeSprite.SpriteFrame = null;
				}.bind(this), 1);
			}
		}
	},

	/*明尾牌状态 */
	setCardType5: function (resout, showType) {
		var myChairId = TWModel.getMyChairId();
		let myIndex = TWModel.playingChairArr.indexOf(myChairId);
		let curIndex = TWModel.playingChairArr.indexOf(this.chairId);

		var memberCount = resout.cardsArr.length;
		var offSecond = (curIndex + memberCount - myIndex) % memberCount; //(this.chairId+memberCount-myChairId)%memberCount;
		var aftMianbai = 0;
		for (let i = 0; i < memberCount; ++i) {
			if (TWModel.getMianbai(i) && TWModel.playingChairArr[i] > this.chairId) {
				++aftMianbai;
			}
		}
		var cardIdArr = resout.cardsArr[curIndex];
		var delayTime = (memberCount - offSecond - aftMianbai) * this.turnSecond;
		if (!showType) {
			delayTime = 0;
		}
		var self = this;
		if (!TWModel.getMianbai(curIndex)) {
			for (let i = 8; i < 13; ++i) {
				this.setNodeSpriteFrame(this.getCardUrl(cardIdArr[i]), this.cardNodeArr[i]);
			}
		}
		if (myIndex >= 0) {
			var str = '';
			var url = '';
			if (this.chairId !== myChairId) {
				let score = resout.scoresArr[myIndex][curIndex][2];
				if (score >= 0) {
					str = '赢+' + parseFloat(score.toFixed(2));
					url = 'ThirteenWater/TWCommon/fnt_game2';
				} else {
					str = '输' + parseFloat(score.toFixed(2));
					url = 'ThirteenWater/TWCommon/fnt_game1';
				}
			} else {
				let score = 0,
					zongScore = 0,
					zongUrl, zongStr;
				for (let i = 0; i < resout.daqiangArr[myIndex].length; ++i) {
					score += resout.scoresArr[myIndex][i][2];
					zongScore += resout.scoresArr[myIndex][i][0] + resout.scoresArr[myIndex][i][1] + resout.scoresArr[myIndex][i][2];
				}
				if (score >= 0) {
					str = '尾+' + parseFloat(score.toFixed(2));
					url = 'ThirteenWater/TWCommon/fnt_game3';
				} else {
					str = '尾' + parseFloat(score.toFixed(2));
					url = 'ThirteenWater/TWCommon/fnt_game4';
				}
				if (zongScore >= 0) {
					zongStr = '总+' + parseFloat(zongScore.toFixed(2));
					zongUrl = 'ThirteenWater/TWCommon/fnt_game3';
				} else {
					zongStr = '总' + parseFloat(zongScore.toFixed(2));
					zongUrl = 'ThirteenWater/TWCommon/fnt_game4';
				}
				this.scheduleOnce(function () {
					AssetMgr.loadResSync(zongUrl, cc.Font, function (err, font) {
						if (!err) {
							if (!cc.isValid(self)) {
								return;
							}
							self.zongfenLabel.font = font;
							self.zongfenLabel.string = zongStr;
							self.zongfenLabel.node.active = true;
							if (self.node_bg_Zongfen)
								self.node_bg_Zongfen.active = true;
						}
					});
				}, delayTime);
			}
			this.scheduleOnce(function () {
				AssetMgr.loadResSync(url, cc.Font, function (err, font) {
					if (!err) {
						if (!cc.isValid(self)) {
							return;
						}
						self.weidaoLabel.font = font;
						self.weidaoLabel.string = str;
						self.weidaoLabel.node.active = true;
						if (self.node_bg_Weidao)
							self.node_bg_Weidao.active = true;
					}
				});
				self.showMianbai(resout);
			}, delayTime);

			//显示特殊牌型				
			setTimeout(() => {
				if (!cc.isValid(this)) {
					return;
				}
				this.typeSprite.node.active = true;
				if (resout.guaiArr[curIndex] != null && resout.guaiArr[curIndex] != 0)
					this.setNodeSpriteFrame(this.getSpeicalCardUrl(resout.guaiArr[curIndex]), this.typeSprite.node);
			}, delayTime * 1000 + 500);
		}

		if (showType) {
			var weiArr = TWLogic.getWeiArr(resout.cardsArr[curIndex]);
			if (!TWModel.getMianbai(this.chairId)) {
				AudioMgr.playSound(this.getSoundUrlByCardArr(weiArr));
				this.setNodeSpriteFrame(this.getTypeUrlByCardArr(weiArr), this.typeSprite);
				this.typeSprite.node.active = true;
				this.scheduleOnce(function () {
					this.typeSprite.node.active = false;
					this.typeSprite.spriteFrame = null;
				}.bind(this), 1);
			}
		}
	},

	showMianbai: function (resout) {
		let curIndex = TWModel.playingChairArr.indexOf(this.chairId);
		if (TWModel.getMianbai(curIndex)) { // 免摆牌型
			let cardIdArr = resout.cardsArr[curIndex];
			for (let i = 0; i < 13; ++i) {
				this.setNodeSpriteFrame(this.getCardUrl(cardIdArr[i]), this.cardNodeArr[i]);
			}
		}

		this.speicalCardSprite.node.active = false;
		this.isShowSpecialCard = false;
	},

	displayCard: function (resout) {
		let curIndex = TWModel.playingChairArr.indexOf(this.chairId);
		let cardIdArr = resout.cardsArr[curIndex];
		for (let i = 0; i < 13; ++i) {
			this.setNodeSpriteFrame(this.getCardUrl(cardIdArr[i]), this.cardNodeArr[i]);
		}
	},

	/* 显示总分&倍率 */
	setCardType6: function (resout, playAudio) {
		var myChairId = TWModel.getMyChairId();
		let myIndex = TWModel.playingChairArr.indexOf(myChairId);
		if (myIndex < 0) return;
		let curIndex = TWModel.playingChairArr.indexOf(this.chairId);

		this.curCardItemIndex = curIndex;

		if (TWModel.getMianbai(curIndex)) { // 免摆牌型
			// if (!!playAudio) {
			// 	this.typeSprite.node.active = true;
			// 	this.setNodeSpriteFrame(this.getTypeUrlByCardArr(resout.cardsArr[curIndex]), this.typeSprite.node);
			// 	this.scheduleOnce(function () {
			// 		this.typeSprite.node.active = false;
			// 		this.typeSprite.spriteFrame = null;
			// 	}.bind(this), 1);
			// 	AudioMgr.playSound(this.getSoundUrlByCardArr(resout.cardsArr[curIndex]));
			// }
			var cardIdArr = resout.cardsArr[curIndex];
			for (i = 0; i < 13; ++i) {
				this.setNodeSpriteFrame(this.getCardUrl(cardIdArr[i]), this.cardNodeArr[i]);
			}
		}
		var url = '',
			str = '',
			str2 = '',
			url2 = '';
		if (this.chairId === myChairId) {
			let scoreByResult = TWLogic.getScoreArrByResout(resout);
			let score = scoreByResult.scoreArr[curIndex];
			cc.log("TwCardItem curIndex: ", curIndex);
			let score_single = scoreByResult.scoreArr_single[myIndex];
			if (score_single >= 0) {
				str = '总+' + parseFloat(score_single.toFixed(2))
				url = 'ThirteenWater/TWCommon/fnt_game3';
			} else {
				str = '总' + parseFloat(score_single.toFixed(2))
				url = 'ThirteenWater/TWCommon/fnt_game4';
			}
			if (score >= 0) {
				str2 = "(+" + parseFloat(score.toFixed(2)) + ")";
				url2 = 'ThirteenWater/TWCommon/fnt_game3';
			} else {
				str2 = "(" + parseFloat(score.toFixed(2)) + ")";
				url2 = 'ThirteenWater/TWCommon/fnt_game4';
			}
			let touScoreByResult = TWLogic.getTouScoreArrByResout(resout);
			let touScore = touScoreByResult.scoreArr[myIndex];
			let touScore_single = touScoreByResult.scoreArr_single[myIndex];
			var touUrl, touUrl2, touStr, touStr2;
			if (touScore_single >= 0) {
				touStr = '头+' + parseFloat(touScore_single.toFixed(2));
				touUrl = 'ThirteenWater/TWCommon/fnt_game3';
			} else {
				touStr = '头' + parseFloat(touScore_single.toFixed(2));
				touUrl = 'ThirteenWater/TWCommon/fnt_game4';
			}
			if (touScore >= 0) {
				touStr2 = "(+" + parseFloat(touScore.toFixed(2)) + ")";
				touUrl2 = 'ThirteenWater/TWCommon/fnt_game3';
			} else {
				touStr2 = "(" + parseFloat(touScore.toFixed(2)) + ")";
				touUrl2 = 'ThirteenWater/TWCommon/fnt_game4';
			}
			AssetMgr.loadResSync(touUrl, cc.Font, function (err, font) {
				if (!err) {
					if (!cc.isValid(this)) {
						return;
					}
					this.toudaoLabel.font = font;
					this.toudaoLabel.string = touStr;
					this.toudaoLabel.node.active = true;
					if (this.node_bg_Toudao)
						this.node_bg_Toudao.active = true;
				}
			}.bind(this));
			AssetMgr.loadResSync(touUrl2, cc.Font, function (err, font) {
				if (!err) {
					if (!cc.isValid(this)) {
						return;
					}
					if (this.toudaoLabel2) {
						this.toudaoLabel2.node.active = true;
						this.toudaoLabel2.font = font;
						this.toudaoLabel2.string = touStr2;
					}
				}
			}.bind(this));
			let zhongScoreByResult = TWLogic.getZhongScoreArrByResout(resout);
			let zhongScore = zhongScoreByResult.scoreArr[myIndex];
			let zhongScore_single = zhongScoreByResult.scoreArr_single[myIndex];
			var zhongUrl, zhongUrl2, zhongStr, zhongStr2;
			if (zhongScore_single >= 0) {
				zhongStr = '中+' + parseFloat(zhongScore_single.toFixed(2));
				zhongUrl = 'ThirteenWater/TWCommon/fnt_game3';
			} else {
				zhongStr = '中' + parseFloat(zhongScore_single.toFixed(2));
				zhongUrl = 'ThirteenWater/TWCommon/fnt_game4';
			}
			if (zhongScore >= 0) {
				zhongStr2 = "(+" + parseFloat(zhongScore.toFixed(2)) + ")";
				zhongUrl2 = 'ThirteenWater/TWCommon/fnt_game3';
			} else {
				zhongStr2 = "(" + parseFloat(zhongScore.toFixed(2)) + ")";
				zhongUrl2 = 'ThirteenWater/TWCommon/fnt_game4';
			}
			AssetMgr.loadResSync(zhongUrl, cc.Font, function (err, font) {
				if (!err) {
					if (!cc.isValid(this)) {
						return;
					}
					this.zhongdaoLabel.font = font;
					this.zhongdaoLabel.string = zhongStr;
					this.zhongdaoLabel.node.active = true;
					if (this.node_bg_Zhongdao)
						this.node_bg_Zhongdao.active = true;
				}
			}.bind(this));
			AssetMgr.loadResSync(zhongUrl2, cc.Font, function (err, font) {
				if (!err) {
					if (!cc.isValid(this)) {
						return;
					}
					if (this.zhongdaoLabel2) {
						this.zhongdaoLabel2.node.active = true;
						this.zhongdaoLabel2.font = font;
						this.zhongdaoLabel2.string = zhongStr2;
					}
				}
			}.bind(this));
			let weiScoreByResult = TWLogic.getWeiScoreArrByResout(resout);
			let weiScore = weiScoreByResult.scoreArr[myIndex];
			let weiScore_single = weiScoreByResult.scoreArr_single[myIndex];
			var weiUrl, weiUrl2, weiStr, weiStr2;
			if (weiScore_single >= 0) {
				weiStr = '尾+' + parseFloat(weiScore_single.toFixed(2));
				weiUrl = 'ThirteenWater/TWCommon/fnt_game3';
			} else {
				weiStr = '尾' + parseFloat(weiScore_single.toFixed(2));
				weiUrl = 'ThirteenWater/TWCommon/fnt_game4';
			}
			if (weiScore >= 0) {
				weiStr2 = "(+" + parseFloat(weiScore.toFixed(2)) + ")";
				weiUrl2 = 'ThirteenWater/TWCommon/fnt_game3';
			} else {
				weiStr2 = "(" + parseFloat(weiScore.toFixed(2)) + ")";
				weiUrl2 = 'ThirteenWater/TWCommon/fnt_game4';
			}
			AssetMgr.loadResSync(weiUrl, cc.Font, function (err, font) {
				if (!err) {
					if (!cc.isValid(this)) {
						return;
					}
					this.weidaoLabel.font = font;
					this.weidaoLabel.string = weiStr;
					this.weidaoLabel.node.active = true;
					if (this.node_bg_Weidao)
						this.node_bg_Weidao.active = true;
				}
			}.bind(this));
			AssetMgr.loadResSync(weiUrl2, cc.Font, function (err, font) {
				if (!err) {
					if (!cc.isValid(this)) {
						return;
					}
					if (this.weidaoLabel2) {
						this.weidaoLabel2.node.active = true;
						this.weidaoLabel2.font = font;
						this.weidaoLabel2.string = weiStr2;
					}
				}
			}.bind(this));
		} else {
			var daqiang = Math.abs(resout.daqiangArr[myIndex][curIndex]);
			var score = 0;
			if (daqiang > 1) { //打枪
				score = resout.scoresArr[myIndex][curIndex][0];
				if (score > 0) {
					this.toudaoLabel.string = '赢+' + parseFloat(score.toFixed(2)) + 'x' + daqiang;
				} else {
					this.toudaoLabel.string = '输' + parseFloat(score.toFixed(2)) + 'x' + daqiang;
				}
				score = resout.scoresArr[myIndex][curIndex][1];
				if (score > 0) {
					this.zhongdaoLabel.string = '赢+' + parseFloat(score.toFixed(2)) + 'x' + daqiang;
				} else {
					this.zhongdaoLabel.string = '输' + parseFloat(score.toFixed(2)) + 'x' + daqiang;
				}
				score = resout.scoresArr[myIndex][curIndex][2];
				if (score > 0) {
					this.weidaoLabel.string = '赢+' + parseFloat(score.toFixed(2)) + 'x' + daqiang;
				} else {
					this.weidaoLabel.string = '输' + parseFloat(score.toFixed(2)) + 'x' + daqiang;
				}
			}

			// var rate = resout.rateArr[curIndex]*resout.rateArr[myIndex];
			// str = '翻倍';
			// if(rate === 1) { str = '不翻倍'; }
			for (var i = 0; i < 3; ++i) {
				score += resout.scoresArr[myIndex][curIndex][i];
			}
			if (score >= 0) {
				url = 'ThirteenWater/TWCommon/fnt_game2';
			} else {
				url = 'ThirteenWater/TWCommon/fnt_game1';
			}
			// 显示怪牌分
			if (resout.guaipaiScoreArr[myChairId] + resout.guaipaiScoreArr[curIndex] > 0) {
				var guaiScore = resout.guaipaiScoreArr[myChairId] - resout.guaipaiScoreArr[curIndex];
				var guaiStr = '怪牌+' + parseFloat(guaiScore.toFixed(2));
				var guaiUrl = 'ThirteenWater/TWCommon/fnt_game2';
				if (guaiScore < 0) {
					guaiUrl = 'ThirteenWater/TWCommon/fnt_game1';
					guaiStr = '怪牌' + parseFloat(guaiScore.toFixed(2));
				}
				AssetMgr.loadResSync(guaiUrl, cc.Font, function (err, font) {
					if (!cc.isValid(this)) {
						return;
					}
					this.guaiLabel.font = font;
					this.guaiLabel.string = guaiStr;
					this.guaiLabel.node.active = true;
				}.bind(this));
			}
		}
		AssetMgr.loadResSync(url, cc.Font, function (err, font) {
			if (!err) {
				if (!cc.isValid(this)) {
					return;
				}
				this.zongfenLabel.font = font;
				this.zongfenLabel.string = str;
				this.zongfenLabel.node.active = true;
				if (this.node_bg_Zongfen)
					this.node_bg_Zongfen.active = true;
			}
		}.bind(this));
		if (url2) {
			AssetMgr.loadResSync(url2, cc.Font, function (err, font) {
				if (!err) {
					if (!cc.isValid(this)) {
						return;
					}
					if (this.zongfenLabel2) {
						this.zongfenLabel2.node.active = true;
						this.zongfenLabel2.font = font;
						this.zongfenLabel2.string = str2;
					}
				}
			}.bind(this));
		}


	},

	// 亮牌状态
	setCardType7: function (resout) {
		if (this.chairId !== TWModel.getMyChairId() || !this.canFanpai) {
			return;
		}
		var cardsArr = TWModel.getCardsArr();
		this.cardType = 7;
		var cardIdArr = cardsArr[TWModel.playingChairArr.indexOf(this.chairId)];
		for (var i = 0; i < 13; ++i) {
			this.setNodeSpriteFrame(this.getCardUrl(cardIdArr[i]), this.cardNodeArr[i]);
		}
		this.gameTypeSprite.node.active = false;
	},

	// 暗牌状态
	setCardType8: function () {
		if (this.chairId !== TWModel.getMyChairId() || !this.canFanpai) {
			return;
		}
		this.cardType = 2;
		for (var i = 0; i < 13; ++i) {
			this.setNodeSpriteFrame("GameCommon/Cards/cardBack", this.cardNodeArr[i]);
		}
		if (this.isShowSpecialCard == false)
			this.gameTypeSprite.node.active = TWModel.getMianbai(TWModel.playingChairArr.indexOf(this.chairId));
	},

	daqiangAnimal: function (resout, begPos) {
		var memberCount = resout.cardsArr.length;
		var daqiangArr = [];
		for (var i = 0; i < resout.daqiangArr.length; ++i) {
			daqiangArr[i] = [];
			for (var j = 0; j < resout.daqiangArr[i].length; ++j) {
				daqiangArr[i][j] = resout.daqiangArr[i][j];
			}
		}
		// 怪牌打枪数据添加
		/*for(var k = 0; k < daqiangArr.length; ++k) {
			if(TWModel.getMianbai(k)) {
				for(var m = 0; m < daqiangArr.length; ++m) {
					if(m !== k && !TWModel.getMianbai(m)) {
						daqiangArr[k][m] = 2;
					}
				}
			}
		}*/
		var index = 0;
		if (begPos) {
			index = begPos;
		}
		var self = this;
		var hasSanChuan = self.hasSanChuan(resout.daqiangArr);
		if (!TWModel.getGameRule().otherRule.youSanChuan) {
			hasSanChuan = false;
		}
		var func = function () {
			while (index < memberCount * memberCount && daqiangArr[Math.floor(index / memberCount)][index % memberCount] <= 1) {
				++index;
			}
			if (index >= memberCount * memberCount) {
				if (hasSanChuan) {
					var mgr = self.node.parent.getComponent('TWMainDialog');
					mgr.glassAnimal(function () {
						self.createSettleDialog();
					});
					self.unschedule(func);
				} else {
					self.createSettleDialog();
					self.unschedule(func);
				}
				return;
			}
			let i = Math.floor(index / memberCount);
			let j = index % memberCount;
			if (self.chairId === TWModel.playingChairArr[i]) {
				self.gunSprite.node.active = true;
				self.gunSprite.node.opacity = 255;
				self.threeGunAnimal(self.gunSprite.node, index, memberCount);
			} else if (self.chairId === TWModel.playingChairArr[j]) {
				self.holesNode.active = true;
				self.holesNode.opacity = 255;
				self.threeHoleAnimal(self.holesNode);
			} else {
				self.gunSprite.node.active = false;
			}
			++index;
		};
		func();
		if (index < memberCount * memberCount) {
			this.schedule(func, this.gunSecond);
		}
	},

	createSettleDialog: function () {
		let self = this;
		let resout = TWModel.getResout();
		let curIndex = TWModel.playingChairArr.indexOf(this.chairId);
		this.scheduleOnce(function () {
			self.setCardType6(resout, true);
		}, this.turnSecond / 2);
		this.scheduleOnce(function () {
			self.gunSprite.node.active = false;
			self.holesNode.active = false;
			if (curIndex === 0) {
				if (!!self.showResultFinishedCallback) {
					self.showResultFinishedCallback();
				}
				/*Global.DialogManager.createDialog('ThirteenWater/TWSettleDialog');
				self.showMainContinueButton();*/
			}
			for (let i = 0; i < 5; ++i) {
				self.holesNode.getChildByName('HoleSprite' + (i + 1)).active = false;
			}
			self.isOnAniaml = false;
		}, this.turnSecond * 1.5);
	},

	//是否是三穿
	hasSanChuan: function (arr) {
		var i, j, count;
		for (i = 0; i < arr.length; ++i) {
			count = 0;
			for (j = 0; j < arr[i].length; ++j) {
				if (arr[i][j] > 1) {
					++count;
				}
			}
			if (count === 3) {
				return true;
			}
		}
		return false;
	},

	threeGunAnimal: function (node, index, memberCount) {
		AudioMgr.playSound('ThirteenWater/TWSound/tw_sanqiang2');
		if (!node) {
			node = this.gunSprite.node;
		}
		var self = this;
		var bottomChairId = TWModel.getMyChairId();
		var posNameArr = ['bottom', 'right', 'top', 'left'];
		var myDir = posNameArr[(this.chairId - bottomChairId + 4) % 4]; // 此枪所在位置
		var gunDir = posNameArr[(index % memberCount + 4 - bottomChairId) % 4]; // 枪打的位置
		var offX = 14,
			offR = 16;
		if (myDir === 'bottom') {
			if (gunDir === 'right') {
				node.scaleX = -2.5;
				offX = -offX;
				offR = -offR;
			} else if (gunDir === 'top') {
				node.rotation = 40;
			}
		} else if (myDir === 'right') {
			if (gunDir === 'left') {
				node.rotation = -50;
			} else if (gunDir === 'bottom') {
				node.rotation = -110;
			}
		} else if (myDir === 'top') {
			if (gunDir === 'left') {
				node.rotation = -105;
			} else if (gunDir === 'bottom') {
				node.rotation = -140;
			} else if (gunDir === 'right') {
				node.rotation = -180;
			}
		} else if (myDir === 'left') {
			offX = -offX;
			offR = -offR;
			if (gunDir === 'right') {
				node.rotation = 50;
			} else if (gunDir === 'right') {
				node.rotation = 50;
			} else if (gunDir === 'bottom') {
				node.rotation = 105;
			}
		}
		node.runAction(cc.sequence(
			cc.spawn(cc.moveBy(0.1, cc.v2(offX, 0)), cc.rotateBy(0.1, offR)),
			cc.spawn(cc.moveBy(0.1, cc.v2(-offX, 0)), cc.rotateBy(0.1, -offR)),
			cc.delayTime(0.1),
			cc.spawn(cc.moveBy(0.1, cc.v2(offX, 0)), cc.rotateBy(0.1, offR)),
			cc.spawn(cc.moveBy(0.1, cc.v2(-offX, 0)), cc.rotateBy(0.1, -offR)),
			cc.delayTime(0.1),
			cc.spawn(cc.moveBy(0.1, cc.v2(offX, 0)), cc.rotateBy(0.1, offR)),
			cc.spawn(cc.moveBy(0.1, cc.v2(-offX, 0)), cc.rotateBy(0.1, -offR)),
			cc.callFunc(function () {
				node.opacity = 0;
				node.rotation = 0;
				if (myDir === 'bottom') {
					node.scaleX = 2.5;
				}
			})
		));
	},

	oneGunAnimal: function (node) {
		AudioMgr.playSound('ThirteenWater/TWSound/tw_yiqiang');
		if (!node) {
			node = this.gunSprite.node;
		}
		node.runAction(cc.sequence(
			cc.moveBy(0.2, cc.v2(8, 8)),
			cc.moveBy(0.2, cc.v2(-8, -8))
		));
		node.runAction(cc.sequence(
			cc.rotateBy(0.2, +3),
			cc.rotateBy(0.2, -3)
		));
	},

	threeHoleAnimal: function (node) {
		if (!node) {
			node = this.holesNode;
		}
		var holeNameArr = ['HoleSprite1', 'HoleSprite2', 'HoleSprite3', 'HoleSprite4', 'HoleSprite5'];
		if (node.getChildByName(holeNameArr[1]).active === true) {
			node.runAction(cc.sequence(
				cc.callFunc(function () {
					node.getChildByName(holeNameArr[0]).active = true;
				}),
				cc.delayTime(0.3),
				cc.callFunc(function () {
					node.getChildByName(holeNameArr[3]).active = true;
				})
			));
		} else {
			node.runAction(cc.sequence(
				cc.callFunc(function () {
					node.getChildByName(holeNameArr[1]).active = true;
				}),
				cc.delayTime(0.3),
				cc.callFunc(function () {
					node.getChildByName(holeNameArr[2]).active = true;
				}),
				cc.delayTime(0.3),
				cc.callFunc(function () {
					node.getChildByName(holeNameArr[4]).active = true;
				})
			));
		}
	},

	oneHoleAnimal: function (node) {
		if (!node) {
			node = this.holesNode;
		}
		//node.active = true;
		var holeNameArr = ['HoleSprite1', 'HoleSprite2', 'HoleSprite3', 'HoleSprite4', 'HoleSprite5'];
		var i;
		var random = Math.floor(Math.random() * 5);
		for (i = 0; i < holeNameArr.length; ++i) {
			node.getChildByName(holeNameArr[i]).active = false;
		}
		node.runAction(cc.sequence(
			cc.delayTime(0.2),
			cc.callFunc(function () {
				node.getChildByName(holeNameArr[random]).active = true;
			})
		));
	},

	setNodeSpriteFrame: function (url, node) {
		// AssetMgr.loadResSync(url, cc.SpriteFrame, function (err, spriteFrame) {
		// 	if (!err) {
		// 		node.getComponent(cc.Sprite).spriteFrame = spriteFrame;
		// 	}
		// });
		Global.CCHelper.updateSpriteFrame(url, node.getComponent(cc.Sprite));
	},

	getCardUrl: function (cardValue) {
		let cardUrl = "GameCommon/Cards/value_";
		let num = cardValue % 13 + 1;
		let color = Math.floor(cardValue / 13);
		cardUrl += num + "_" + color;
		return cardUrl;
	},

	getSpeicalCardUrl: function (type_) {
		let url = "";
		if (type_ == TWLogic.SanTongHua) {
			url = "ThirteenWater/TWSortCard/guaipaiType/sth";
		} else if (type_ == TWLogic.SanShunZi) {
			url = "ThirteenWater/TWSortCard/guaipaiType/ssz";
		} else if (type_ == TWLogic.LiuDuiBan) {
			url = "ThirteenWater/TWSortCard/guaipaiType/ldb";
		} else if (type_ == TWLogic.YiTiaoLong) {
			url = "ThirteenWater/TWSortCard/guaipaiType/ytl";
		} else if (type_ == TWLogic.ZhiZhunYiTiaoLong) {
			url = "ThirteenWater/TWSortCard/guaipaiType/zzytl";
		}

		return url;
	},

	getTypeUrlByCardArr: function (cardArr, type) {
		var url = 'ThirteenWater/TWSort/danpai';
		if (TWLogic.hasYitiaolong(cardArr)) {
			url = 'ThirteenWater/TWSort/yitiaolong';
		} else if (TWLogic.hasLiuduiban(cardArr)) {
			url = 'ThirteenWater/TWSort/liuduiban';
		} else if (TWLogic.hasSanhua(cardArr)) {
			url = 'ThirteenWater/TWSort/sanhua';
		} else if (TWLogic.hasSanshun(cardArr)) {
			url = 'ThirteenWater/TWSort/sanshun';
		} else if (TWLogic.hasTonghuashun(cardArr)) {
			url = 'ThirteenWater/TWSort/tonghuashun';
		} else if (TWLogic.hasSitiao(cardArr)) {
			url = 'ThirteenWater/TWSort/sitiao';
		} else if (TWLogic.hasHulu(cardArr)) {
			url = 'ThirteenWater/TWSort/hulu';
		} else if (TWLogic.hasTonghua(cardArr)) {
			url = 'ThirteenWater/TWSort/tonghua';
		} else if (TWLogic.hasShunzi(cardArr)) {
			url = 'ThirteenWater/TWSort/shunzi';
		} else if (TWLogic.hasSantiao(cardArr)) {
			url = 'ThirteenWater/TWSort/santiao';
			if (type && type === 'tou') {
				url = 'ThirteenWater/TWSort/jingang';
			}
		} else if (TWLogic.hasLiangdui(cardArr)) {
			url = 'ThirteenWater/TWSort/liangdui';
		} else if (TWLogic.hasDuizi(cardArr)) {
			url = 'ThirteenWater/TWSort/duizi';
		}
		return url;
	},

	getSoundUrlByCardArr: function (cardArr, type) {
		var url = 'ThirteenWater/TWSound/tw_danpai';
		if (TWLogic.hasYitiaolong(cardArr)) {
			url = 'ThirteenWater/TWSound/tw_yitiaolong';
		} else if (TWLogic.hasLiuduiban(cardArr)) {
			url = 'ThirteenWater/TWSound/tw_liuduiban';
		} else if (TWLogic.hasSanhua(cardArr)) {
			url = 'ThirteenWater/TWSound/tw_sanhua';
		} else if (TWLogic.hasSanshun(cardArr)) {
			url = 'ThirteenWater/TWSound/tw_shanshun';
		} else if (TWLogic.hasTonghuashun(cardArr)) {
			url = 'ThirteenWater/TWSound/tw_tonghuashun';
		} else if (TWLogic.hasSitiao(cardArr)) {
			url = 'ThirteenWater/TWSound/tw_sitiao';
		} else if (TWLogic.hasHulu(cardArr)) {
			url = 'ThirteenWater/TWSound/tw_hulu';
		} else if (TWLogic.hasTonghua(cardArr)) {
			url = 'ThirteenWater/TWSound/tw_tonghua';
		} else if (TWLogic.hasShunzi(cardArr)) {
			url = 'ThirteenWater/TWSound/tw_shunzi';
		} else if (TWLogic.hasSantiao(cardArr)) {
			url = 'ThirteenWater/TWSound/tw_santiao';
			if (type && type === 'tou') {
				url = 'ThirteenWater/TWSound/tw_jingang';
			}
		} else if (TWLogic.hasLiangdui(cardArr)) {
			url = 'ThirteenWater/TWSound/tw_liangdui';
		} else if (TWLogic.hasDuizi(cardArr)) {
			url = 'ThirteenWater/TWSound/tw_duizi';
		}
		return url;
	},

	showMainContinueButton: function () {
		var pnode = this.node.parent;
		if (TWModel.getGameEndData() !== null) {
			pnode.getChildByName('ExitButton').active = true;
		} else {
			pnode.getChildByName('ContinueButton').active = true;
		}
	},

	getIsOnAnimal: function () {
		return this.isOnAniaml;
	},
});