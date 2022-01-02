var RoomMessageRouter = 'game.gameHandler.roomMessageNotify';
var GameMessageRouter = 'game.gameHandler.gameMessageNotify';
var RoomProto = require('../../API/RoomProto');
var TTZProto = require('./TTZProto');
var TTZModel = require('./TTZModel');
let roomAPI = require('../../API/RoomAPI');

cc.Class({
	extends: cc.Component,

	properties: {
		myHeadNode: cc.Node, //头像
		cardsNode: cc.Node, //所有牌节点
		touziNode: cc.Node, //骰子 节点
		onLineMenu: cc.Node, //在线玩家 按钮
		deskLabel: cc.Label,
		cardLabel: cc.Label,
		coinButtons: cc.Node, //下注按钮
		tianmenAreaNode: cc.Node, //天门管理
		zhongmenAreaNode: cc.Node, //中门管理
		dimenAreaNode: cc.Node, //地门管理
		audioItem: cc.Prefab,
		exitPoint: cc.Node
	},

	onLoad: function () {
		this.exitPoint.getComponent('GameDropDownList').setGameInfo(TTZModel.kindId, TTZModel.profitPercentage);

		this.chipButton = this.node.getChildByName("chipButton");
		this.chipButton.active = false;

		this.speed = 1500;
		this.pourCoinNodeArr = [];


		var myHeadCtrl = this.myHeadNode.getComponent('TTZHead'); //头像管理
		myHeadCtrl.setHeadMsg(TTZModel.getMyUid(), false);
		this.setCardLabel();
		this.reconnect();

		var audioItem = cc.instantiate(this.audioItem);
		audioItem.parent = this.node;
		this.audioManager = audioItem.getComponent('TTZAudioNode');
		Global.MessageCallback.addListener('RoomMessagePush', this);
		Global.MessageCallback.addListener('GameMessagePush', this);
		Global.MessageCallback.addListener('ReConnectSuccess', this);
		roomAPI.roomMessageNotify(RoomProto.getRoomSceneInfoNotify());
		// // 获取场景
		// this.scheduleOnce(function () {
		// 	roomAPI.roomMessageNotify(RoomProto.getRoomSceneInfoNotify());
		// }, 0.2);
	},

	reconnect: function () {
		var gameStatus = TTZModel.getGameStatus();
		//这段 废话
		for (var i = this.pourCoinNodeArr.length - 1; i >= 0; --i) {
			if (this.pourCoinNodeArr[i]) {
				this.pourCoinNodeArr[i].removeFromParent();
				this.pourCoinNodeArr.pop();
			}
		}
		//下注 状态
		if (gameStatus === TTZProto.GAME_STATUS_POUR) {
			var dirArr = [TTZProto.TIANMEN, TTZProto.DIMEN, TTZProto.ZHONGMEN];
			for (i = 0; i < dirArr.length; ++i) {
				var pourGold = TTZModel.getPourGoldOnDir(dirArr[i]);
				this.playerPourGold(null, dirArr[i], pourGold);
			}
		}
		//显示结果 状态
		else if (gameStatus === TTZProto.GAME_STATUS_RESOUT) {
			this.scheduleOnce(function () {
				Global.DialogManager.createDialog('TuiTongZi/TTZResoutDialog', TTZModel.getResout());
			}, 2);
		}
	},

	onDestroy: function () {
		Global.MessageCallback.removeListener('RoomMessagePush', this);
		Global.MessageCallback.removeListener('GameMessagePush', this);
		Global.MessageCallback.removeListener('ReConnectSuccess', this);
	},

	messageCallbackHandler: function (router, msg) {
		var myUid = TTZModel.getMyUid();
		if (router === 'RoomMessagePush') {
			if (msg.type === RoomProto.USER_LEAVE_ROOM_RESPONSE) {
				if (msg.data.chairId === TTZModel.getMyChairId()) {
					Waiting.hide();
				}
			} else if (msg.type === RoomProto.USER_LEAVE_ROOM_PUSH) {
				if (msg.data.roomUserInfo.userInfo.uid === myUid) {
					this.exitGame()
				}
			}
			//else if(msg.type === RoomProto.USER_RECONNECT_PUSH) {
			//	TTZModel.setEntryRoomData(msg.data);
			//	this.reconnect();
			//}
		} else if (router === 'GameMessagePush') {
			if (msg.type === TTZProto.GAME_BANKERCHANGE_PUSH) { // 换庄推送
				this.setCardLabel(msg.data.bureau);
			} else if (msg.type === TTZProto.GAME_POURGOLD_PUSH) { // 下注推送
				this.playerPourGold(msg.data.uid, msg.data.direction, msg.data.pourGold);
			} else if (msg.type === TTZProto.GAME_RESOUT_PUSH) { // 406 结果推送
				this.scheduleOnce(function () {
					this.answerGameResout(msg.data.resout);
				}.bind(this), 10);
			} else if (msg.type === TTZProto.GAME_BUREAU_PUSH) { // 局数变化推送
				this.setCardLabel(msg.data.bureau);
			} else if (msg.type === RoomProto.USER_RECONNECT_PUSH) {
				Global.DialogManager.destroyDialog('TuiTongZi/TTZMainDialog');
				TTZModel.setGameData(msg.data.gameData);
				Global.DialogManager.createDialog('TuiTongZi/TTZMainDialog');
			} else if (msg.type === TTZProto.REDLIMIT_ERROR) {
				if (TTZModel.gameConfig.hasOwnProperty(msg.data.direction)) {
					var limitMaxGold = TTZModel.gameConfig[msg.data.direction].redLimit.max;
					var limitMinGold = TTZModel.gameConfig[msg.data.direction].redLimit.min;
				}
				Tip.makeText('下注失败，此区域限红' + limitMinGold + "-" + limitMaxGold)
			}
		} else if (router === 'ReConnectSuccess') {
			//Global.NetworkManager.notify(RoomMessageRouter, RoomProto.getUserReconnectNotifyData());
			if (Global.Player.isInRoom()) {
				Global.API.hall.joinRoomRequest(TTZModel.getRoomId(), function () {
					Global.NetworkManager.notify(RoomMessageRouter, RoomProto.getUserReconnectNotifyData());
				}, undefined, Config.GameType.TTZ);
			} else {
				Confirm.show("当前房间已解散！", () => {
					this.exitGame();
				})
			}
		}
	},

	onButtonClick: function (event, param) {
		if (param === 'tianmen' || param === 'zhongmen' || param === 'dimen') {
			this.tempToPourGold(param);
		} else if (param === 'rule') {
			Global.DialogManager.createDialog('GameCommon/GameRule/GameRuleDialog', {
				kind: Global.Enum.gameType.TTZ
			});
		} else if (param === 'close') {
			Confirm.show('确认退出游戏?', function () {
				Global.NetworkManager.notify(RoomMessageRouter, RoomProto.userLeaveRoomNotify());
				Waiting.show();
			}, function () {});
		} else if (param === 'setting') {
			var self = this;
			Global.DialogManager.createDialog('Setting/SettingDialog', {
				callback: self.audioManager.setVolume.bind(self.audioManager)
			});
		} else if (param === 'on_line') {
			Global.DialogManager.createDialog("GameCommon/GameOnlineUser/GameOnlineUserDialog");
		}
		Global.CCHelper.playPreSound();
		// AudioMgr.playSound("GameCommon/Sound/button-click");

	},

	// 尝试下注
	tempToPourGold: function (param) {
		var dir = TTZProto.DIMEN;
		if (param === 'tianmen') {
			dir = TTZProto.TIANMEN;
		} else if (param === 'zhongmen') {
			dir = TTZProto.ZHONGMEN;
		}
		//非下注状态，不能下注
		var gameStatus = TTZModel.getGameStatus();
		if (gameStatus !== TTZProto.GAME_STATUS_POUR) {
			Tip.makeText("非下注时间，无法下注");
			console.log('can not pour gold');
			return;
		}
		//庄家不能下注
		else if (TTZModel.getMyUid() === TTZModel.getBankerUid()) {
			console.log('banker can not pour gold');
			return;
		}
		//获取 下注 筹码大小
		var pourGold = TTZModel.getChooseCoin();
		var me = TTZModel.getMe(); //获取自己 玩家信息
		var alPourGold = TTZModel.getMyPourGold(); //获取我的 总下注金额
		var mydirPourGold = TTZModel.getMyPourGoldOnDir(dir);
		//先判断筹码是否大于我的 剩余金额
		if (TTZModel.gameConfig.hasOwnProperty(dir)) {
			var limitMaxGold = TTZModel.gameConfig[dir].redLimit.max;
		}
		if (pourGold > me.userInfo.gold - alPourGold) {
			Confirm.show("金币不够，请先充值");
			console.log('error: not enough gold');
		}
		// else if (mydirPourGold >= limitMaxGold) {
		// 	Tip.makeText("下注失败，此区域限红" + limitMaxGold);

		// } 
		else {
			Global.NetworkManager.notify(GameMessageRouter, TTZProto.pourGoldRequestData(pourGold, dir));
		}
	},

	// 404 下注回复
	playerPourGold: function (uid, dir, pourGold) {
		var goldArr = [];
		var coinArr = [];
		for (let i = 0; i < TTZModel.Bettype.length; i++) {
			coinArr.splice(0, 0, TTZModel.Bettype[i])
		}
		// var coinArr = [1000, 500, 100, 50, 10, 1];
		var count, startPos;
		for (var i = 0; i < coinArr.length; ++i) {
			count = Math.floor(pourGold / coinArr[i]) % 10;
			goldArr.push(count);
			pourGold -= count * coinArr[i];
		}
		if (uid === TTZModel.getMyUid()) {
			startPos = this.myHeadNode.getPosition(); //自己的位置
			if (uid === TTZModel.getBankerUid()) {
				startPos = this.node.getChildByName('ReturnButton').getPosition();
			}
		} else if (uid === TTZModel.getBankerUid()) {
			startPos = this.node.getChildByName('WomanNode').getPosition(); //庄家位置
		} else {
			startPos = this.onLineMenu.getPosition(); //在线玩家位置
		}
		var node;
		for (i = 0; i < goldArr.length; ++i) {
			for (var j = 0; j < goldArr[i]; ++j) {
				node = this.getCoinNode(coinArr[i]);
				node.coin = coinArr[i];
				this.pourGoldAnimal(node, startPos, dir);
			}
		}
		//获取这一门  玩家下注 的 总金额
		pourGold = TTZModel.getPourGoldOnDir(dir);
		//获取自己下的总金额
		var myPour = TTZModel.getMyPourGoldOnDir(dir);
		if (dir === TTZProto.TIANMEN) {
			this.tianmenAreaNode.getChildByName('PourLabel').getComponent(cc.Label).string = pourGold;
			this.tianmenAreaNode.getChildByName('MyPourLabel').getComponent(cc.Label).string = myPour;
		} else if (dir === TTZProto.ZHONGMEN) {
			this.zhongmenAreaNode.getChildByName('PourLabel').getComponent(cc.Label).string = pourGold;
			this.zhongmenAreaNode.getChildByName('MyPourLabel').getComponent(cc.Label).string = myPour;
		} else if (dir === TTZProto.DIMEN) {
			this.dimenAreaNode.getChildByName('PourLabel').getComponent(cc.Label).string = pourGold;
			this.dimenAreaNode.getChildByName('MyPourLabel').getComponent(cc.Label).string = myPour;
		}
		//钱不够 ，按钮不让点击
		var TTZCoinButtons = this.coinButtons.getComponent("TTZCoinButtons");
		if (TTZCoinButtons.xiazhudi)
			TTZCoinButtons.updateButtonState();
	},

	myWinGold: function (dir, gold) {
		console.log('myWinGold', dir, gold);
		var chooseAreaNodeArr = [this.tianmenAreaNode, this.zhongmenAreaNode, this.dimenAreaNode];
		var chooseAreaNode = chooseAreaNodeArr[dir];
		var chooseAreaNodePos = chooseAreaNode.getPosition();
		var goldArr = [];
		for (let i = 0; i < TTZModel.Bettype.length; i++) {
			goldArr.splice(0, 0, TTZModel.Bettype[i]);
		}
		// var goldArr = [1000, 500, 100, 50, 10];
		var countArr = [];
		var count, node;
		for (var i = 0; i < goldArr.length; ++i) {
			count = Math.floor(gold / goldArr[i]);
			countArr.push(count);
			gold -= count * goldArr[i];
		}
		var startPos, endPos, moveTm;
		endPos = this.myHeadNode.getPosition();
		endPos = cc.v2(endPos.x - chooseAreaNodePos.x, endPos.y - chooseAreaNodePos.y);
		var recordNodeArr = [];
		var dirArr = [TTZProto.TIANMEN, TTZProto.ZHONGMEN, TTZProto.DIMEN];
		for (i = 0; i < countArr.length; ++i) {
			for (var j = this.pourCoinNodeArr.length - 1; j >= 0 && countArr[i] > 0; --j) {
				node = this.pourCoinNodeArr[j];
				if (node.coin === goldArr[i] && countArr[i] > 0 && dirArr[dir] === node.dir) {
					this.pourCoinNodeArr.splice(j, 1);
					recordNodeArr.push(node);
					--countArr[i];
					startPos = node.getPosition();
					moveTm = Global.Utils.getDist(startPos, endPos) / this.speed;
					node.runAction(cc.moveTo(moveTm, endPos));
				}
			}
		}
		this.scheduleOnce(function () {
			for (var i = recordNodeArr.length - 1; i >= 0; --i) {
				recordNodeArr[i].removeFromParent();
				recordNodeArr[i] = null;
			}
		}, moveTm);
		chooseAreaNode.getChildByName('MyPourLabel').getComponent(cc.Label).string = '0';
	},

	othersWinGold: function (dir) {
		var node, startPosvar, endPos, moveTm;
		var chooseAreaNodeArr = [this.tianmenAreaNode, this.zhongmenAreaNode, this.dimenAreaNode];
		var chooseAreaNode = chooseAreaNodeArr[dir];
		var chooseAreaNodePos = chooseAreaNode.getPosition();
		endPos = this.onLineMenu.getPosition();
		endPos = cc.v2(endPos.x - chooseAreaNodePos.x, endPos.y - chooseAreaNodePos.y);
		var recordNodeArr = [];
		var dirArr = [TTZProto.TIANMEN, TTZProto.ZHONGMEN, TTZProto.DIMEN];
		for (var i = this.pourCoinNodeArr.length - 1; i >= 0; --i) {
			node = this.pourCoinNodeArr[i];
			if (node && node.dir === dirArr[dir]) {
				this.pourCoinNodeArr.splice(i, 1);
				recordNodeArr.push(node);
				var startPos = node.getPosition();
				moveTm = Global.Utils.getDist(startPos, endPos) / this.speed;
				node.runAction(cc.moveTo(moveTm, endPos));
			}
		}
		this.scheduleOnce(function () {
			for (var i = recordNodeArr.length - 1; i >= 0; --i) {
				recordNodeArr[i].removeFromParent();
				recordNodeArr[i] = null;
			}
		}, moveTm);
		chooseAreaNode.getChildByName('PourLabel').getComponent(cc.Label).string = '0';
	},

	bankerWinGold: function (dir) {
		var node, startPos, endPos, moveTm;
		var chooseAreaNodeArr = [this.tianmenAreaNode, this.zhongmenAreaNode, this.dimenAreaNode];
		var chooseAreaNode = chooseAreaNodeArr[dir];
		var chooseAreaNodePos = chooseAreaNode.getPosition();
		endPos = this.node.getChildByName('WomanNode').getPosition();
		endPos = cc.v2(endPos.x - chooseAreaNodePos.x, endPos.y - chooseAreaNodePos.y);
		var recordNodeArr = [];
		var dirArr = [TTZProto.TIANMEN, TTZProto.ZHONGMEN, TTZProto.DIMEN];
		for (var i = this.pourCoinNodeArr.length - 1; i >= 0; --i) {
			node = this.pourCoinNodeArr[i];
			if (node && node.dir === dirArr[dir]) {
				this.pourCoinNodeArr.splice(i, 1);
				recordNodeArr.push(node);
				startPos = node.getPosition();
				moveTm = Global.Utils.getDist(startPos, endPos) / this.speed;
				node.runAction(cc.moveTo(moveTm, endPos));
			}
		}
		this.scheduleOnce(function () {
			for (var i = recordNodeArr.length - 1; i >= 0; --i) {
				recordNodeArr[i].removeFromParent();
				recordNodeArr[i] = null;
			}
		}, moveTm);
		chooseAreaNode.getChildByName('PourLabel').getComponent(cc.Label).string = '0';
		chooseAreaNode.getChildByName('MyPourLabel').getComponent(cc.Label).string = '0';
	},
	//加载 筹码
	getCoinNode: function (coin) {
		//var coinArr = [1, 10, 50, 100, 500];
		//var index = coinArr.indexOf(coin);
		// if (coin === 1) {
		// 	coin = 0;
		// }
		// var url = 'GameCommon/Jetton/jetton' + coin;
		// var node = new cc.Node();
		// AssetMgr.loadResSync(url, cc.SpriteFrame, function (err, spriteFrame) {
		// 	if (!err) {
		// 		node.addComponent(cc.Sprite).spriteFrame = spriteFrame;
		// 		node.width = 50;
		// 		node.height = 50;
		// 	} else {
		// 		console.log('error getCoinNode', err.message);
		// 	}
		// });
		let i = TTZModel.Bettype.indexOf(coin);
		if (i >= 0) {
			var button = cc.find(i.toString(), this.chipButton);
			var node = cc.instantiate(button);
			node.removeComponent(cc.Button);
			node.getChildByName("label").getComponent(cc.Label).string = Math.floor(coin);
			node.setScale(0.4);
		}
		return node;
	},
	//扔筹码动画
	pourGoldAnimal: function (node, startPos, dir) {
		this.pourCoinNodeArr.push(node);
		node.dir = dir;
		var chooseAreaNodeArr = [0, this.tianmenAreaNode, this.zhongmenAreaNode, this.dimenAreaNode];
		var chooseAreaNode = chooseAreaNodeArr[dir];
		var pos = chooseAreaNode.getPosition();
		startPos = cc.v2(startPos.x - pos.x, startPos.y - pos.y); //相对于门 的坐标
		var endPos = cc.v2(chooseAreaNode.width * (Math.random() - 0.5), chooseAreaNode.height * (Math.random() - 0.5));
		node.parent = chooseAreaNode;
		node.setPosition(startPos);
		var moveTm = Global.Utils.getDist(startPos, endPos) / this.speed;
		node.runAction(cc.moveTo(moveTm, endPos));
		if (node.coin > 100) {
			AudioMgr.playSound("GameCommon/Sound/bet_big");
		} else {
			AudioMgr.playSound("GameCommon/Sound/bet_small");
		}

	},

	setCardLabel: function (bureau) {
		if (!bureau) {
			bureau = TTZModel.getBureau();
		}
		var cardCount = 40 - bureau * 8;
		this.cardLabel.string = bureau + '/' + TTZModel.getMaxBureau() + '(' + cardCount + ')';
	},
	//游戏结果
	answerGameResout: function (resout) {
		// 庄家先收
		var dirArr = [TTZProto.TIANMEN, TTZProto.ZHONGMEN, TTZProto.DIMEN];
		var self = this;
		var delayTime = 1;
		var bankerUid = TTZModel.getBankerUid();
		var myUid = TTZModel.getMyUid();
		for (var i = 0; i < resout.winArr.length; ++i) {
			if (resout.winArr[i] === true) {
				this.bankerWinGold(i);
			} else {
				var dirGold = TTZModel.getPourGoldOnDir(dirArr[i]);
				self.playerPourGoldDelay(bankerUid, dirArr[i], dirGold, 1);
				delayTime = 2;
			}
		}
		for (i = 0; i < dirArr.length; ++i) {
			if (resout.winArr[i] === false) {
				if (myUid === bankerUid) {
					self.othersWinGoldDelay(i, delayTime);
				} else {
					var myPour = TTZModel.getMyPourGoldOnDir(dirArr[i]);
					if (myPour > 0) {
						self.myWinGoldDelay(i, myPour * 2, delayTime);
					}
					self.othersWinGoldDelay(i, delayTime);
				}
			}
		}
		var nodeArr = [this.tianmenAreaNode, this.zhongmenAreaNode, this.dimenAreaNode];
		this.scheduleOnce(function () {
			Global.DialogManager.createDialog('TuiTongZi/TTZResoutDialog', resout);
			for (var i = 0; i < nodeArr.length; ++i) {
				nodeArr[i].getChildByName('WinSprite').active = false;
			}
		}, 3);
		for (i = 0; i < nodeArr.length; ++i) {
			if (!resout.winArr[i]) {
				var node = nodeArr[i].getChildByName('WinSprite');
				node.active = true;
				node.runAction(cc.sequence(
					cc.fadeIn(0.3), cc.fadeOut(0.3),
					cc.fadeIn(0.3), cc.fadeOut(0.3),
					cc.fadeIn(0.3), cc.fadeOut(0.3),
					cc.fadeIn(0.3), cc.fadeOut(0.3)
				));
			}
		}
	},

	myWinGoldDelay: function (dir, pourGold, delay) {
		var self = this;
		this.scheduleOnce(function () {
			self.myWinGold(dir, pourGold);
		}, delay);
	},

	othersWinGoldDelay: function (dir, delay) {
		var self = this;
		this.scheduleOnce(function () {
			self.othersWinGold(dir);
		}, delay);
	},

	playerPourGoldDelay: function (uid, dir, pourGold, delay) {
		var self = this;
		this.scheduleOnce(function () {
			self.playerPourGold(uid, dir, pourGold);
		}, delay);
	},

	getAudioManager: function () {
		return this.audioManager;
	},
	exitGame() {
		ViewMgr.goBackHall(Config.GameType.TTZ);
	},
});