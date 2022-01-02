var TTZProto = require('./TTZProto');
var RoomProto = require('../../API/RoomProto');
var TTZModel = require('./TTZModel');

cc.Class({
    extends: cc.Component,

	properties: {
		rootNode: cc.Node,
		buttonArr:[cc.Node],
		// button1: cc.Node,
		// button2: cc.Node,
		// button3: cc.Node,
		// button4: cc.Node,
		// button5: cc.Node,
		// button6: cc.Node
	},

	start: function () {
		var betArr = TTZModel.Bettype;
		for (let i = 0; i < this.buttonArr.length; i++) {
			if (i < betArr.length) {
				this.buttonArr[i].active = true;
				this.buttonArr[i].getChildByName("label").getComponent(cc.Label).string = Math.floor(betArr[i]);
			}
			else
				this.buttonArr[i].active = false;
		}
		this.xiazhudi = cc.find("xiazhudi", this.node);
		this.xiazhudi.active = true;
		this.xiazhudi.setPosition(this.buttonArr[0].getPosition());
		this.updateButtonState();
		Global.MessageCallback.addListener('RoomMessagePush', this);
		Global.MessageCallback.addListener('GameMessagePush', this);
		/*this.button1.y = 20;*/
		// this.buttonArr[0].getComponent(cc.Button).interactable = false;
	},
	updateButtonNum: function (betArr) {
		for (let i = 0; i < this.buttonArr.length; i++) {
			if (i < betArr.length) {
				this.buttonArr[i].active = true;
				this.buttonArr[i].getChildByName("label").getComponent(cc.Label).string = Math.floor(betArr[i]);
			}
			else
				this.buttonArr[i].active = false;
		}
		// this.xiazhudi.active  = false;

	},

	onDestroy: function () {
		Global.MessageCallback.removeListener('RoomMessagePush', this);
		Global.MessageCallback.removeListener('GameMessagePush', this);
	},

	messageCallbackHandler: function (router, msg) {
		if (router === 'GameMessagePush') {
			if (msg.type === TTZProto.GAME_STATUSCHANGE_PUSH) { // 状态推送
				//this.gameStatusChange(msg.data.gameStatus);
			}
			else if(msg.type === TTZProto.GAME_BANKERCHANGE_PUSH) {		// 庄家变化
				this.bankerChange(msg.data.bankerUid);
			}
			else if (msg.type === TTZProto.GAME_RESOUT_PUSH) {
				this.updateButtonNum(msg.data.baseScoreArr);
			}

		}
		else if(router === 'RoomMessagePush') {
			if(msg.type === RoomProto.USER_RECONNECT_PUSH) {
				this.bankerChange(msg.data.gameData.bankerUid);
			}
		}
	},

	bankerChange: function (bankerUid) {
		if (!bankerUid) {
			bankerUid = TTZModel.getBankerUid();
		}
		this.rootNode.active = (bankerUid !== TTZModel.getMyUid());
	},

	onButtonClick: function (event, param) {
		/*var gameStatus = TTZModel.getGameStatus();
		if(gameStatus !== TTZProto.GAME_STATUS_POUR) {
			return;
		}*/
		// var buttonArr = [this.button1, this.button2, this.button3, this.button4, this.button5,this.button6];
		// var coinArr = [1, 10, 50, 100, 500,1000];
		var coinArr = TTZModel.Bettype;
		for (var i = 0; i < coinArr.length; ++i) {
			if (parseInt(param) === i) {
				this.xiazhudi.setPosition(this.buttonArr[i].getPosition());
				this.xiazhudi.active = true;
				// this.buttonArr[i].getComponent(cc.Button).interactable = false;//关掉交互 说明点击了
				TTZModel.setChooseCoin(coinArr[i]);
				Global.CCHelper.playPreSound();
				// AudioMgr.playSound("GameCommon/Sound/button-click");
			} else {
				// this.buttonArr[i].getComponent(cc.Button).interactable = true;
			}
		}
	},
	getGold: function () {
		var me = TTZModel.getMe();
		var pourGold = TTZModel.getMyPourGold();
		return (me.userInfo.gold - pourGold);
	},
	updateButtonState: function () {
		var coinArr = TTZModel.Bettype;
		for (let i = 0; i < this.buttonArr.length; i++) {
			var chipButton = this.buttonArr[i].getComponent(cc.Button);
			if (this.getGold() > coinArr[i]) {
				chipButton.enabled = true;
				chipButton.node.opacity = 255;
			} else {
				var x = this.buttonArr[i].getPosition().x;
				var y = this.buttonArr[i].getPosition().y;
				if (this.xiazhudi.position.x < x + 5 && this.xiazhudi.position.x > x - 5 ||
					this.xiazhudi.position.y < y + 5 && this.xiazhudi.position.y > y - 5)
					this.xiazhudi.active = false;
				chipButton.enabled = false;
				chipButton.node.opacity = 150;
			}

		}
	}
});