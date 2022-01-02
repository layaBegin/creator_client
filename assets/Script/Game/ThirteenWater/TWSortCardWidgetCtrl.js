var TWLogic = require('./TWLogic');
var GameMessageRouter = 'game.gameHandler.gameMessageNotify';
var GameProto = require('./TWProto');
var RoomAPI = require('../../API/RoomAPI');

let SORT_CARD_MAX_TIME = 20;

cc.Class({
	extends: cc.Component,

	properties: {
		touCancelButton: cc.Button,
		zhongCancelButton: cc.Button,
		weiCancelButton: cc.Button,
		touButton: cc.Button,
		zhongButton: cc.Button,
		weiButton: cc.Button,
		duiziButton: cc.Button,
		liangduiButton: cc.Button,
		santiaoButton: cc.Button,
		shunziButton: cc.Button,
		tonghuaButton: cc.Button,
		huluButton: cc.Button,
		sitiaoButton: cc.Button,
		tonghuashunButton: cc.Button,
		confirmButton: cc.Button,
		cardsNode: cc.Node,
		buttonsNode: cc.Node,
		touTypeSprite: cc.Sprite,
		zhongTypeSprite: cc.Sprite,
		weiTypeSprite: cc.Sprite,

		clockTimeLabel: cc.Label,

		node_page1: cc.Node,
		node_page2: cc.Node,

		node_checkMark_huase: cc.Node,
		node_checkMark_daxiao: cc.Node,
		bg_btnpagechange_sdbp: cc.Sprite,
		bg_btnpagechange_yjbp: cc.Sprite,

		Btn_type1: cc.Button,
		Btn_type2: cc.Button,
		Btn_type3: cc.Button,
		node_checkMark_btntype1: cc.Node,
		node_checkMark_btntype2: cc.Node,
		node_checkMark_btntype3: cc.Node,

		Sp_toudao_cardtype_page2: {
			default: [],
			type: cc.Sprite
		},
		Sp_zhongdao_cardtype_page2: {
			default: [],
			type: cc.Sprite
		},
		Sp_weidao_cardtype_page2: {
			default: [],
			type: cc.Sprite
		},

		bg_toudaotype: cc.Sprite,
		bg_zhongdaotype: cc.Sprite,
		bg_weidaotype: cc.Sprite
	},

	onLoad: function () {
		this.yjbpGroupCards = null;
	},

	onDestroy: function () { },

	initWidget: function () {
		this.cardNodeArr = [];
		this.zhongCardArr = [];
		this.touCardArr = [];
		this.weiCardArr = [];
		this.resoutIndex = 0;
		this.upY = 20;
		//var cardsNode = this.node.getChildByName('CardsNode');
		var i;
		for (i = 0; i < 13; ++i) {
			this.cardNodeArr.push(this.cardsNode.getChildByName('Sprite' + i));
		}
		this.confirmButton.interactable = false;
		this.touCancelButton.node.active = false;
		this.zhongCancelButton.node.active = false;
		this.weiCancelButton.node.active = false;
		this.touTypeSprite.node.active = false;
		this.bg_toudaotype.node.active = false;
		this.zhongTypeSprite.node.active = false;
		this.bg_zhongdaotype.node.active = false;
		this.weiTypeSprite.node.active = false;
		this.bg_weidaotype.node.active = false;
	},

	setCardArr: function (cardArr) {
		this.initWidget();

		this.cardArr = TWLogic.sortCardByCountThenColor(cardArr);
		// let testArr = [3,25,22,20,15,38,35,32,31,29,45,43,40];
		// this.cardArr = testArr;
		this.cardUpArr = [];
		var i;
		for (i = 0; i < this.cardArr.length; ++i) {
			Global.CCHelper.updateSpriteFrame(this.getCardUrl(this.cardArr[i]), this.cardNodeArr[i].getComponent(cc.Sprite));
			this.cardUpArr[i] = false;
			this.addMoveAndEndEvent(this.cardNodeArr[i], i);
		}

		this.node_checkMark_daxiao.active = true;
		this.node_checkMark_huase.active = false;

		this.setTypeButton();

		// 开启定时器
		this.unscheduleAllCallbacks();
		this.clockTime = SORT_CARD_MAX_TIME;
		this.clockTimeLabel.string = this.clockTime.toString();
		this.schedule(this.clockScheduler.bind(this), 1);
	},

	clockScheduler: function () {
		this.clockTime--;
		if (this.clockTime < 0) {
			RoomAPI.gameMessageNotify(GameProto.getGameCardsSortRequestData(TWLogic.autoSortCards(this.cardArr), Date.now()))
			this.unscheduleAllCallbacks();

			this.node.active = false;
		} else {
			this.clockTimeLabel.string = this.clockTime.toString();
		}
	},

	addMoveAndEndEvent: function (node, i) {
		node.on(cc.Node.EventType.TOUCH_END, function (event) {
			this.onTouchCardEnd(event, i);
		}.bind(this));
		node.on(cc.Node.EventType.TOUCH_START, function (event) {
			this.onTouchCardStart(event, i);
		}.bind(this));
		node.on(cc.Node.EventType.TOUCH_MOVE, function (event) {
			this.onTouchMove(event, i);
		}.bind(this));
		node.on(cc.Node.EventType.TOUCH_CANCEL, function (event) {
			this.onTouchCardEnd(event, i);
		}.bind(this));
	},

	onTouchCard: function (event, param) {
		var i = parseInt(param);
		if (param < 0 || param >= 13) {
			return;
		}
		if (this.cardUpArr[i]) {
			this.cardNodeArr[i].y -= this.upY;
		} else {
			this.cardNodeArr[i].y += this.upY;
		}
		this.cardUpArr[i] = !this.cardUpArr[i];
	},

	onTouchCardStart: function (event, param) {
		this.startX = event.currentTouch._point.x;
		this.startY = event.currentTouch._point.y;
	},

	onTouchMove: function (event, param) {
		var x = event.currentTouch._point.x;
		var y = event.currentTouch._point.y;
		/*
		if(Math.abs(x-this.startX) < 10 || Math.abs(y-this.startY) > 30) {
			this.onTouchCard(null, param);
			return;
		}
		*/
		x = this.cardsNode.convertToNodeSpace(cc.v2(x, y)).x;
		var restCardArr = this.getRestCardArr();
		var width = this.cardsNode.width;
		var cardWid = this.cardNodeArr[0].width;
		var firstNode = this.cardNodeArr[this.cardArr.indexOf(restCardArr[0])];
		var secondNode = this.cardNodeArr[this.cardArr.indexOf(restCardArr[1])];
		var offx = secondNode.x - firstNode.x;
		var bx = width / 2 + firstNode.x - cardWid / 2;
		var index = Math.floor((x - bx) / offx);
		var i = restCardArr.indexOf(this.cardArr[param]);
		var nodeIndex;
		if (index >= i) {
			while (i <= index) {
				nodeIndex = this.cardArr.indexOf(restCardArr[i]);
				if (nodeIndex >= 0 && nodeIndex < 13) {
					this.cardNodeArr[nodeIndex].color = new cc.Color(200, 200, 200);
				}
				++i;
			}
		} else {
			while (i >= index) {
				nodeIndex = this.cardArr.indexOf(restCardArr[i]);
				if (nodeIndex >= 0 && nodeIndex < 13) {
					this.cardNodeArr[nodeIndex].color = new cc.Color(200, 200, 200);
				}
				--i;
			}
		}
	},

	onTouchCardEnd: function (event, param) {
		var x = event.currentTouch._point.x;
		var y = event.currentTouch._point.y;
		/*
		if(Math.abs(x-this.startX) < 10 || Math.abs(y-this.startY) > 30) {
			this.onTouchCard(null, param);
			return;
		}
		*/
		x = this.cardsNode.convertToNodeSpace(cc.v2(x, y)).x;
		var restCardArr = this.getRestCardArr();
		var width = this.cardsNode.width;
		var cardWid = this.cardNodeArr[0].width;
		var firstNode = this.cardNodeArr[this.cardArr.indexOf(restCardArr[0])];
		var secondNode = this.cardNodeArr[this.cardArr.indexOf(restCardArr[1])];
		var offx = secondNode.x - firstNode.x;
		var bx = width / 2 + firstNode.x - cardWid / 2;
		var index = Math.floor((x - bx) / offx);
		var i = restCardArr.indexOf(this.cardArr[param]);
		if (index >= i) {
			while (i <= index) {
				this.onTouchCard(null, this.cardArr.indexOf(restCardArr[i]));
				++i;
			}
		} else {
			while (i >= index) {
				this.onTouchCard(null, this.cardArr.indexOf(restCardArr[i]));
				--i;
			}
		}
		for (i = 0; i < this.cardNodeArr.length; ++i) {
			this.cardNodeArr[i].color = new cc.Color(255, 255, 255);
		}
	},

	sortRestCard: function () {
		var restCardArr = this.getRestCardArr();
		var width = this.cardsNode.width;
		var cardWid = this.cardNodeArr[0].width;
		var offx = 47;
		var i, node;
		width = cardWid + (restCardArr.length - 1) * offx;
		for (i = 0; i < restCardArr.length; ++i) {
			node = this.cardNodeArr[this.cardArr.indexOf(restCardArr[i])];
			node.x = cardWid / 2 + i * offx - width / 2;
		}
		for (i = 0; i < this.cardUpArr.length; ++i) {
			if (this.cardUpArr[i]) {
				this.cardUpArr[i] = false;
				this.cardNodeArr[i].y -= this.upY;
			}
		}
	},

	setTypeButton: function () {
		var chooseArr = this.getRestCardArr();
		this.duiziButton.interactable = TWLogic.hasDuizi(chooseArr);
		this.liangduiButton.interactable = TWLogic.hasLiangdui(chooseArr);
		this.santiaoButton.interactable = TWLogic.hasSantiao(chooseArr);
		this.shunziButton.interactable = TWLogic.hasShunzi(chooseArr);
		this.tonghuaButton.interactable = TWLogic.hasTonghua(chooseArr);
		this.huluButton.interactable = TWLogic.hasHulu(chooseArr);
		this.sitiaoButton.interactable = TWLogic.hasSitiao(chooseArr);
		this.tonghuashunButton.interactable = TWLogic.hasTonghuashun(chooseArr);
	},

	updatePage2: function () {
		let groupCards = TWLogic.getAutoSortCardsArr(this.cardArr);
		this.yjbpGroupCards = groupCards;

		this.Btn_type1.node.active = false;
		this.Btn_type2.node.active = false;
		this.Btn_type3.node.active = false;

		for (let i = 0; i < groupCards.length; i++) {
			let groupCardsItem = groupCards[i];

			if (i == 0) {
				this.Btn_type1.node.active = true;
			} else if (i == 1) {
				this.Btn_type2.node.active = true;
			} else if (i == 2) {
				this.Btn_type3.node.active = true;
			}

			let url = this.getTypeUrlByCardArr(groupCardsItem.toudaoArr, "yjbp");
			Global.CCHelper.updateSpriteFrame(url, this.Sp_toudao_cardtype_page2[i]);
			url = this.getTypeUrlByCardArr(groupCardsItem.zhongdaoArr, "yjbp");
			Global.CCHelper.updateSpriteFrame(url, this.Sp_zhongdao_cardtype_page2[i]);
			url = this.getTypeUrlByCardArr(groupCardsItem.weidaoArr, "yjbp");
			Global.CCHelper.updateSpriteFrame(url, this.Sp_weidao_cardtype_page2[i]);
		}

		this.OnBtn_type1();
	},

	OnBtn_pageChange: function () {
		if (this.node_page1.activeInHierarchy == true) {
			this.node_page1.active = false;
			this.node_page2.active = true;

			this.bg_btnpagechange_yjbp.node.active = true;
			this.bg_btnpagechange_sdbp.node.active = false;

			this.node_checkMark_btntype1.active = true;
			this.node_checkMark_btntype2.active = false;
			this.node_checkMark_btntype3.active = false;

			this.updatePage2();
		} else if (this.node_page2.activeInHierarchy == true) {
			this.node_page1.active = true;
			this.node_page2.active = false;

			this.bg_btnpagechange_yjbp.node.active = false;
			this.bg_btnpagechange_sdbp.node.active = true;

			this.onButtonClick(null, "weidao_cancel");
			this.onButtonClick(null, "zhongdao_cancel");
			this.onButtonClick(null, "toudao_cancel");
		}
	},

	OnBtn_huase: function () {
		if (this.cardArr == null)
			return;

		this.onButtonClick(null, "weidao_cancel");
		this.onButtonClick(null, "zhongdao_cancel");
		this.onButtonClick(null, "toudao_cancel");

		this.cardArr = TWLogic.sortCardByColor(this.cardArr);
		this.cardUpArr = [];
		var i;
		for (i = 0; i < this.cardArr.length; ++i) {
			Global.CCHelper.updateSpriteFrame(this.getCardUrl(this.cardArr[i]), this.cardNodeArr[i].getComponent(cc.Sprite));
			this.cardUpArr[i] = false;
		}

		this.node_checkMark_daxiao.active = false;
		this.node_checkMark_huase.active = true;
	},

	OnBtn_daxiao: function () {
		if (this.cardArr == null)
			return;

		this.onButtonClick(null, "weidao_cancel");
		this.onButtonClick(null, "zhongdao_cancel");
		this.onButtonClick(null, "toudao_cancel");

		this.cardArr = TWLogic.sortCardByCountThenColor(this.cardArr);
		this.cardUpArr = [];
		var i;
		for (i = 0; i < this.cardArr.length; ++i) {
			Global.CCHelper.updateSpriteFrame(this.getCardUrl(this.cardArr[i]), this.cardNodeArr[i].getComponent(cc.Sprite));
			this.cardUpArr[i] = false;
		}

		this.node_checkMark_daxiao.active = true;
		this.node_checkMark_huase.active = false;
	},

	OnBtn_type1: function () {
		this.node_checkMark_btntype1.active = true;
		this.node_checkMark_btntype2.active = false;
		this.node_checkMark_btntype3.active = false;

		if (this.yjbpGroupCards == null)
			return;

		this.onButtonClick(null, "weidao_cancel");
		this.onButtonClick(null, "zhongdao_cancel");
		this.onButtonClick(null, "toudao_cancel");

		let oneGroupCards = this.yjbpGroupCards[0];
		this.selectCard(oneGroupCards.weidaoArr);
		this.onButtonClick(null, "weidao");
		this.selectCard(oneGroupCards.zhongdaoArr);
		this.onButtonClick(null, "zhongdao");
	},

	OnBtn_type2: function () {
		this.node_checkMark_btntype1.active = false;
		this.node_checkMark_btntype2.active = true;
		this.node_checkMark_btntype3.active = false;

		if (this.yjbpGroupCards == null)
			return;

		this.onButtonClick(null, "weidao_cancel");
		this.onButtonClick(null, "zhongdao_cancel");
		this.onButtonClick(null, "toudao_cancel");

		let oneGroupCards = this.yjbpGroupCards[1];
		this.selectCard(oneGroupCards.weidaoArr);
		this.onButtonClick(null, "weidao");
		this.selectCard(oneGroupCards.zhongdaoArr);
		this.onButtonClick(null, "zhongdao");
	},

	OnBtn_type3: function () {
		this.node_checkMark_btntype1.active = false;
		this.node_checkMark_btntype2.active = false;
		this.node_checkMark_btntype3.active = true;

		if (this.yjbpGroupCards == null)
			return;

		this.onButtonClick(null, "weidao_cancel");
		this.onButtonClick(null, "zhongdao_cancel");
		this.onButtonClick(null, "toudao_cancel");

		let oneGroupCards = this.yjbpGroupCards[2];
		this.selectCard(oneGroupCards.weidaoArr);
		this.onButtonClick(null, "weidao");
		this.selectCard(oneGroupCards.zhongdaoArr);
		this.onButtonClick(null, "zhongdao");
	},

	onButtonClick: function (event, param) {
		if (!Global.isStartBgMusic) {
			Global.isStartBgMusic = true;
			AudioMgr.startPlayBgMusic();
		}
		if (param === 'confirm') {
			this.sendSortCard();
		} else if (param === 'toudao') {
			this.onClickToudao();
		} else if (param === 'toudao_cancel') {
			this.onClickToudaoCancel();
		} else if (param === 'zhongdao') {
			this.onClickZhongdao();
		} else if (param === 'zhongdao_cancel') {
			this.onClickZhongdaoCancel();
		} else if (param === 'weidao') {
			this.onClickWeidao();
		} else if (param === 'weidao_cancel') {
			this.onClickWeidaoCancel();
		} else {
			this.onTouchType(param);
		}
	},

	onClickToudao: function () {
		var count = 0,
			i, cardWid = 87;
		for (i = 0; i < this.cardUpArr.length; ++i) {
			if (this.cardUpArr[i] && this.zhongCardArr.indexOf(i) === -1 && this.weiCardArr.indexOf(i) === -1) {
				++count;
				this.touCardArr.push(i);
			}
		}
		if (count !== 3) {
			Confirm.show('头道必须是3张牌');
			this.touCardArr = [];
		} else {
			if (!this.verifySortCard()) {
				this.touCardArr = [];
				return;
			}
			this.touButton.interactable = false;
			var buttonWidth = this.touButton.node.width;
			var cardCount = this.touCardArr.length;
			var node, offx = (buttonWidth - cardWid) / (cardCount - 1);
			for (i = 0; i < cardCount; ++i) {
				this.cardNodeArr[this.touCardArr[i]].active = false;
				node = this.getCardNode(this.cardArr[this.touCardArr[i]]);
				node.parent = this.touButton.node;
				node.x = cardWid / 2 + i * offx - buttonWidth / 2;
			}
			this.sortRestCard();
			this.confirmButton.interactable = (this.touCardArr.length + this.zhongCardArr.length + this.weiCardArr.length === 13);
			this.touCancelButton.node.active = true;
			this.setTypeButton();
			this.restCardAutoFill();
			this.setTypeNameByCards(this.touCardArr, this.touTypeSprite);
			this.bg_toudaotype.node.active = true;
			this.resoutIndex = 0;
		}
	},

	onClickToudaoCancel: function () {
		var i;
		this.touButton.interactable = true;
		this.touCancelButton.node.active = false;
		this.touButton.node.removeAllChildren();
		for (i = 0; i < this.touCardArr.length; ++i) {
			this.cardNodeArr[this.touCardArr[i]].active = true;
		}
		this.touCardArr = [];
		this.sortRestCard();
		this.setTypeButton();
		this.confirmButton.interactable = false;
		this.touTypeSprite.node.active = false;
		this.bg_toudaotype.node.active = false;
	},

	onClickZhongdao: function () {
		var count = 0,
			i, cardWid = 87;
		for (i = 0; i < this.cardUpArr.length; ++i) {
			if (this.cardUpArr[i] && this.touCardArr.indexOf(i) === -1 && this.weiCardArr.indexOf(i) === -1) {
				++count;
				this.zhongCardArr.push(i);
			}
		}
		if (count !== 5) {
			Confirm.show('中道必须是5张牌');
			this.zhongCardArr = [];
		} else {
			if (!this.verifySortCard()) {
				this.zhongCardArr = [];
				return;
			}
			this.zhongButton.interactable = false;
			var buttonWidth = this.zhongButton.node.width;
			var cardCount = this.zhongCardArr.length;
			var node, offx = (buttonWidth - cardWid) / (cardCount - 1);
			for (i = 0; i < cardCount; ++i) {
				this.cardNodeArr[this.zhongCardArr[i]].active = false;
				node = this.getCardNode(this.cardArr[this.zhongCardArr[i]]);
				node.parent = this.zhongButton.node;
				node.x = cardWid / 2 + i * offx - buttonWidth / 2;
			}
			this.sortRestCard();
			this.confirmButton.interactable = (this.touCardArr.length + this.zhongCardArr.length + this.weiCardArr.length === 13);
			this.zhongCancelButton.node.active = true;
			this.setTypeButton();
			this.restCardAutoFill();
			this.setTypeNameByCards(this.zhongCardArr, this.zhongTypeSprite);
			this.bg_zhongdaotype.node.active = true;
			this.resoutIndex = 0;
		}
	},


	onClickZhongdaoCancel: function () {
		var i;
		this.zhongButton.interactable = true;
		this.zhongCancelButton.node.active = false;
		this.zhongButton.node.removeAllChildren();
		for (i = 0; i < this.zhongCardArr.length; ++i) {
			this.cardNodeArr[this.zhongCardArr[i]].active = true;
		}
		this.zhongCardArr = [];
		this.sortRestCard();
		this.setTypeButton();
		this.confirmButton.interactable = false;
		this.zhongTypeSprite.node.active = false;
		this.bg_zhongdaotype.node.active = false;
	},

	onClickWeidao: function () {
		var count = 0,
			i, cardWid = 87;
		for (i = 0; i < this.cardUpArr.length; ++i) {
			if (this.cardUpArr[i] && this.touCardArr.indexOf(i) === -1 && this.zhongCardArr.indexOf(i) === -1) {
				++count;
				this.weiCardArr.push(i);
			}
		}
		if (count !== 5) {
			Confirm.show('尾道必须是5张牌');
			this.weiCardArr = [];
		} else {
			if (!this.verifySortCard()) {
				this.weiCardArr = [];
				return;
			}
			var buttonWidth = this.weiButton.node.width;
			this.weiButton.interactable = false;
			var cardCount = this.weiCardArr.length;
			var node, offx = (buttonWidth - cardWid) / (cardCount - 1);
			for (i = 0; i < cardCount; ++i) {
				this.cardNodeArr[this.weiCardArr[i]].active = false;
				node = this.getCardNode(this.cardArr[this.weiCardArr[i]]);
				node.parent = this.weiButton.node;
				node.x = cardWid / 2 + i * offx - buttonWidth / 2;
			}
			this.sortRestCard();
			this.confirmButton.interactable = (this.touCardArr.length + this.zhongCardArr.length + this.weiCardArr.length === 13);
			this.weiCancelButton.node.active = true;
			this.setTypeButton();
			this.restCardAutoFill();
			this.setTypeNameByCards(this.weiCardArr, this.weiTypeSprite);
			this.bg_weidaotype.node.active = true;
			this.resoutIndex = 0;
		}
	},

	onClickWeidaoCancel: function () {
		var i;
		this.weiButton.interactable = true;
		this.weiCancelButton.node.active = false;
		this.weiCancelButton.node.active = false;
		this.weiButton.node.removeAllChildren();
		for (i = 0; i < this.weiCardArr.length; ++i) {
			this.cardNodeArr[this.weiCardArr[i]].active = true;
		}
		this.weiCardArr = [];
		this.sortRestCard();
		this.setTypeButton();
		this.confirmButton.interactable = false;
		this.weiTypeSprite.node.active = false;
		this.bg_weidaotype.node.active = false;
	},

	verifySortCard: function () {
		var touCardIdArr = [],
			zhongCardIdArr = [],
			weiCardIdArr = [];
		var i;
		for (i = 0; i < this.touCardArr.length; ++i) {
			touCardIdArr.push(this.cardArr[this.touCardArr[i]]);
		}
		for (i = 0; i < this.zhongCardArr.length; ++i) {
			zhongCardIdArr.push(this.cardArr[this.zhongCardArr[i]]);
		}
		for (i = 0; i < this.weiCardArr.length; ++i) {
			weiCardIdArr.push(this.cardArr[this.weiCardArr[i]]);
		}
		if (touCardIdArr.length !== 0 && zhongCardIdArr.length !== 0) {
			if (TWLogic.compareCards(touCardIdArr, zhongCardIdArr, TWLogic.getTouZhongWeiCardType(touCardIdArr),
				TWLogic.getTouZhongWeiCardType(zhongCardIdArr))) {
				Confirm.show('中道必须大于头道');
				return false;
			}
		}
		if (weiCardIdArr.length !== 0 && zhongCardIdArr.length !== 0) {
			if (TWLogic.compareCards(zhongCardIdArr, weiCardIdArr, TWLogic.getTouZhongWeiCardType(zhongCardIdArr),
				TWLogic.getTouZhongWeiCardType(weiCardIdArr))) {
				Confirm.show('尾道必须大于中道');
				return false;
			}
		}
		if (weiCardIdArr.length !== 0 && touCardIdArr.length !== 0) {
			if (TWLogic.compareCards(touCardIdArr, weiCardIdArr, TWLogic.getTouZhongWeiCardType(touCardIdArr),
				TWLogic.getTouZhongWeiCardType(weiCardIdArr))) {
				Confirm.show('尾道必须大于头道');
				return false;
			}
		}
		return true;
	},

	selectCard: function (arr) {
		let chooseArr = arr;
		let j = 0;
		for (i = 0; i < this.cardUpArr.length; ++i) {
			if (this.cardUpArr[i] && chooseArr.indexOf(this.cardArr[i]) === -1) {
				this.cardUpArr[i] = false;
				this.cardNodeArr[i].y -= this.upY;
			}
		}
		for (i = 0; i < chooseArr.length; ++i) {
			j = this.cardArr.indexOf(chooseArr[i]);
			if (!this.cardUpArr[j]) {
				this.cardUpArr[j] = true;
				this.cardNodeArr[j].y += this.upY;
			}
		}
	},

	restCardAutoFill: function () {
		var canFill = false,
			restCardArr, i, func;
		if (this.touCardArr.length > 0 && this.zhongCardArr.length > 0) {
			canFill = true;
			func = this.onClickWeidao.bind(this);
		}
		if (this.touCardArr.length > 0 && this.weiCardArr.length > 0) {
			canFill = true;
			func = this.onClickZhongdao.bind(this);
		}
		if (this.zhongCardArr.length > 0 && this.weiCardArr.length > 0) {
			canFill = true;
			func = this.onClickToudao.bind(this);
		}
		if (this.touCardArr.length + this.zhongCardArr.length + this.weiCardArr.length === 13) {
			canFill = false;
		}
		if (canFill) {
			restCardArr = this.getRestCardArr();
			for (i = 0; i < this.cardArr.length; ++i) {
				if (restCardArr.indexOf(this.cardArr[i]) !== -1) {
					this.cardNodeArr[i].y += this.upY;
					this.cardUpArr[i] = true;
				}
			}
			func();
		}
	},

	onTouchType: function (name) {
		var restArr = this.getRestCardArr();
		cc.log("restArr " + restArr);
		var resout, i, j, chooseArr;
		if (name === 'duizi') {
			resout = TWLogic.getDuizi(restArr);
		} else if (name === 'liangdui') {
			resout = TWLogic.getLiangdui(restArr);
		} else if (name === 'santiao') {
			resout = TWLogic.getSantiao(restArr);
		} else if (name === 'shunzi') {
			resout = TWLogic.getShunzi(restArr);
			resout = TWLogic.sortResoutArr(resout);
		} else if (name === 'tonghua') {
			resout = TWLogic.getTonghua(restArr);
			resout = TWLogic.sortResoutArr(resout);
		} else if (name === 'hulu') {
			resout = TWLogic.getHulu(restArr);
		} else if (name === 'sitiao') {
			resout = TWLogic.getSitiao(restArr);
		} else if (name === 'tonghuashun') {
			resout = TWLogic.getTonghuashun(restArr);
			resout = TWLogic.sortResoutArr(resout);
		}
		//if(name !== 'hulu' && name !== 'santiao') {
		//	resout = TWLogic.sortResoutArr(resout);
		//}
		if (this.preName && name !== this.preName) {
			this.resoutIndex = 0;
		}
		if (this.resoutIndex >= resout.length) {
			this.resoutIndex = this.resoutIndex % resout.length;
		}
		chooseArr = resout[this.resoutIndex];
		++this.resoutIndex;
		for (i = 0; i < this.cardUpArr.length; ++i) {
			if (this.cardUpArr[i] && chooseArr.indexOf(this.cardArr[i]) === -1) {
				this.cardUpArr[i] = false;
				this.cardNodeArr[i].y -= this.upY;
			}
		}
		for (i = 0; i < chooseArr.length; ++i) {
			j = this.cardArr.indexOf(chooseArr[i]);
			if (!this.cardUpArr[j]) {
				this.cardUpArr[j] = true;
				this.cardNodeArr[j].y += this.upY;
			}
		}
		this.preName = name;
	},

	/* 获取剩余的牌 */
	getRestCardArr: function () {
		var chooseArr = [];
		var i, canInsert;
		for (i = 0; i < this.cardArr.length; ++i) {
			canInsert = true;
			if (this.touCardArr.length > 0 && this.touCardArr.indexOf(i) !== -1) {
				canInsert = false;
			}
			if (this.zhongCardArr.length > 0 && this.zhongCardArr.indexOf(i) !== -1) {
				canInsert = false;
			}
			if (this.weiCardArr.length > 0 && this.weiCardArr.indexOf(i) !== -1) {
				canInsert = false;
			}
			if (canInsert) {
				chooseArr.push(this.cardArr[i]);
			}
		}
		return chooseArr;
	},

	getCardNode: function (cardId) {
		var node = new cc.Node();
		var sprite = node.addComponent(cc.Sprite);
		Global.CCHelper.updateSpriteFrame(this.getCardUrl(cardId), sprite);
		// AssetMgr.loadResSync(this.getCardUrl(cardId), cc.SpriteFrame, function (err, spriteFrame) {
		// 	if (!err) {
		// 		sprite.spriteFrame = spriteFrame;
		// 	}
		// });
		node.scaleX = 0.6;
		node.scaleY = 0.6;
		return node;
	},

	sendSortCard: function () {
		var cardArr = [],
			i;
		for (i = 0; i < this.touCardArr.length; ++i) {
			cardArr.push(this.cardArr[this.touCardArr[i]]);
		}
		for (i = 0; i < this.zhongCardArr.length; ++i) {
			cardArr.push(this.cardArr[this.zhongCardArr[i]]);
		}
		for (i = 0; i < this.weiCardArr.length; ++i) {
			cardArr.push(this.cardArr[this.weiCardArr[i]]);
		}
		Global.NetworkManager.notify(GameMessageRouter, GameProto.getGameCardsSortRequestData(cardArr, Date.now()));

		this.unscheduleAllCallbacks();

		this.node.active = false;
	},

	// 根据牌设置牌型
	setTypeNameByCards: function (cardArr, sprite) {
		var array = [];
		for (var i = 0; i < cardArr.length; ++i) {
			array.push(this.cardArr[cardArr[i]]);
		}
		var url = this.getTypeUrlByCardArr(array, "sdbp");
		cc.log("url " + url);
		Global.CCHelper.updateSpriteFrame(url, sprite);
		sprite.node.active = true;
	},

	getCardUrl: function (cardValue) {
		let cardUrl = "GameCommon/Cards/value_";
		let num = cardValue % 13 + 1;
		let color = Math.floor(cardValue / 13);
		cardUrl += num + "_" + color;
		return cardUrl;
	},

	getTypeUrlByCardArr: function (cardArr, resPath) {
		var url = 'ThirteenWater/TWSort/' + resPath + '/danpai';
		if (TWLogic.hasTonghuashun(cardArr)) {
			url = 'ThirteenWater/TWSort/' + resPath + '/tonghuashun';
		} else if (TWLogic.hasSitiao(cardArr)) {
			url = 'ThirteenWater/TWSort/' + resPath + '/sitiao';
		} else if (TWLogic.hasHulu(cardArr)) {
			url = 'ThirteenWater/TWSort/' + resPath + '/hulu';
		} else if (TWLogic.hasTonghua(cardArr)) {
			url = 'ThirteenWater/TWSort/' + resPath + '/tonghua';
		} else if (TWLogic.hasShunzi(cardArr)) {
			url = 'ThirteenWater/TWSort/' + resPath + '/shunzi';
		} else if (TWLogic.hasSantiao(cardArr)) {
			url = 'ThirteenWater/TWSort/' + resPath + '/santiao';
		} else if (TWLogic.hasLiangdui(cardArr)) {
			url = 'ThirteenWater/TWSort/' + resPath + '/liangdui';
		} else if (TWLogic.hasDuizi(cardArr)) {
			url = 'ThirteenWater/TWSort/' + resPath + '/duizi';
		}
		return url;
	},
});