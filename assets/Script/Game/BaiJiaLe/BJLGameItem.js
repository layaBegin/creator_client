var Lu = require('Lu');
var BJLLogic = require('./BJLLogic');
var BJLProto = require('./BJLProto');
var HallAPI = require('../../API/HallAPI');

cc.Class({
	extends: cc.Component,

	properties: {
		zhupanContent: cc.Node,
		daluContent: cc.Node,
		dayanContent: cc.Node,
		tanglangContent: cc.Node,
		xiaoluContent: cc.Node,
		xianLabel: cc.Label,
		zhuangLabel: cc.Label,
		heLabel: cc.Label,
		stateSprite: cc.Sprite,
		tickLabel: cc.Label,
		miLabel: cc.Label,
		progressbar: cc.ProgressBar,
		zhupanZhuangNode: cc.Node,
		zhupanXianNode: cc.Node,
		zhupanHeNode: cc.Node,
		daluHongNode: cc.Node,
		daluLanNode: cc.Node,
		xiaoluHongNode: cc.Node,
		xiaoluLanNode: cc.Node,
		dayanHongNode: cc.Node,
		dayanLanNode: cc.Node,
		tanglangHongNode: cc.Node,
		tanglangLanNode: cc.Node,
		minLabel: cc.Label
	},

	onLoad: function () { },


	onEnable: function () {
		this.unscheduleAllCallbacks()
	},
	/*
	 * 初始化界面
	 */
	setData: function (gameData, isForce) {
		this.roomId = gameData.roomId;
		this.initScene(gameData.winTypeArr, gameData.gameStatus, isForce);
		var stateUrl;
		if (gameData.gameStatus === BJLProto.STATUS_POUR) {
			stateUrl = 'BaiJiaLe/xiazhuzhong';
		} else {
			stateUrl = 'BaiJiaLe/jiesuanzhong';
		}
		this.progressTick = parseInt(gameData.statusTime);
		this.gameStatus = gameData.gameStatus;
		this.getConfig(gameData)
		Global.CCHelper.updateSpriteFrame(stateUrl, this.stateSprite);

		// var self = this;
		// AssetMgr.loadResSync(stateUrl, cc.SpriteFrame, function (err, res) {
		// 	if (!err) {
		// 		self.stateSprite.spriteFrame = res;
		// 	} else {
		// 		console.log(err);
		// 	}
		// });

		// if (gameData.gameStatus === BJLProto.STATUS_POUR) {
		// 	this.tickTm = parseInt(gameData.statusTime);
		// 	this.tickLabel.string = this.tickTm < 0 ? 0 : this.tickTm;
		// 	var callFunc = function () {
		// 		--self.tickTm;
		// 		self.tickLabel.string = self.tickTm < 0 ? 0 : self.tickTm;
		// 		if (self.tickTm <= 0) {
		// 			self.tickLabel.node.active = false;
		// 			self.unschedule(callFunc);
		// 			AssetMgr.loadResSync('BaiJiaLe/jiesuanzhong', cc.SpriteFrame, function (err, res) {
		// 				if (!err) {
		// 					self.stateSprite.spriteFrame = res;
		// 				} else {
		// 					console.log(err);
		// 				}
		// 			});
		// 		}
		// 	};
		// 	this.schedule(callFunc, 1);
		// }

		let self = this;
		this.tickTm = parseInt(gameData.statusTime);
		this.tickLabel.string = this.tickTm < 0 ? 0 : this.tickTm;
		let callFunc = function () {
			--self.tickTm;
			self.tickLabel.string = self.tickTm < 0 ? 0 : self.tickTm;
			if (self.tickTm <= 0) {
				self.unschedule(callFunc);
			}
		};
		this.schedule(callFunc, 1);


		this.scheduleOnce(function () { // 重新请求服务器信息
			HallAPI.getRoomGameDataByRoomID(this.roomId, function (data) {
				self.setData(data.msg.gameData.gameData, false);
			});
		}, gameData.statusTime + 0.1);
	},

	getConfig: function (gameData) {
		let min = [];
		let max = []
		let data = gameData.parameters.config.gameConfig

		for (const key in data) {
			min.push(data[key].redLimit.min)
			max.push(data[key].redLimit.max)
		}
		this.minLabel.string = "限红" + Math.max.apply(null, min) + "-" + Math.max.apply(null, max)

	},

	/*
	 * 重写界面
	 */
	initScene: function (typeArr, gameStatus, isForce) {
		var array = [];
		var i;
		var xianCount = 0,
			zhuangCount = 0,
			xianDuiCount = 0,
			zhuangDuiCount = 0,
			heCount = 0;
		for (i = 0; i < typeArr.length; ++i) {
			if ((typeArr[i] & BJLLogic.WIN_XIANDUI) > 0) {
				array.push(Lu.TYPE_XIAN | Lu.TYPE_DUI);
				++xianDuiCount;
			} else if ((typeArr[i] & BJLLogic.WIN_XIAN) > 0) {
				array.push(Lu.TYPE_XIAN);
				++xianCount;
			} else if ((typeArr[i] & BJLLogic.WIN_ZHUANGDUI) > 0) {
				array.push(Lu.TYPE_ZHUANG | Lu.TYPE_DUI);
				++zhuangDuiCount;
			} else if ((typeArr[i] & BJLLogic.WIN_ZHUANG) > 0) {
				array.push(Lu.TYPE_ZHUANG);
				++zhuangCount;
			} else if ((typeArr[i] & BJLLogic.WIN_HE) > 0) {
				array.push(Lu.TYPE_HU);
				++heCount;
			}
		}
		this.xianLabel.string = '闲' + (xianCount + xianDuiCount);
		this.zhuangLabel.string = '庄' + (zhuangCount + zhuangDuiCount);
		this.heLabel.string = '和' + heCount;
		if (array.length > 0 && (isForce || gameStatus === BJLProto.STATUS_RESOUT)) {
			this.scheduleOnce(function () {
				this.writeAllRoad(Lu.getZhupanArr(array));
			}.bind(this), 0.1);
		}
	},

	/*
	 * 写所有的路
	 */
	writeAllRoad: function (zhupanArr) {
		var daluArr = Lu.getDaluArr(zhupanArr);
		var dayanArr = Lu.getDayanArr(daluArr);
		var xiaoluArr = Lu.getXiaoluArr(daluArr);
		var tanglangArr = Lu.getTanglangArr(daluArr);
		this.writeZhuPan(zhupanArr);
		this.writeDalu(Lu.getFormatArr(daluArr));
		// this.writeDayan(Lu.getFormatArr(dayanArr));
		// this.writeTanglang(Lu.getFormatArr(tanglangArr));
		// this.writeXiaolu(Lu.getFormatArr(xiaoluArr));
	},

	/*
	 * 朱盘路
	 */
	writeZhuPan: function (zhupanArr) {
		this.zhupanContent.removeAllChildren();
		var width = 270 / 8,
			height = 206 / 6;
		var i, j, node, duiNode;
		if (zhupanArr.length > 8) {
			this.zhupanContent.width = width * zhupanArr.length;
			this.zhupanContent.x = (8 - zhupanArr.length) * width / 2;
		} else {
			this.zhupanContent.width = 270;
			this.zhupanContent.x = 0;
		}
		var bgX = -this.zhupanContent.width / 2;
		var bgY = this.zhupanContent.height / 2;
		for (i = 0; i < zhupanArr.length; ++i) {
			for (j = 0; j < zhupanArr[i].length; ++j) {
				if ((zhupanArr[i][j] & Lu.TYPE_ZHUANG) > 0) {
					node = cc.instantiate(this.zhupanZhuangNode);
					if ((zhupanArr[i][j] & Lu.TYPE_DUI) > 0) {
						duiNode = cc.instantiate(this.dayanHongNode);
						duiNode.parent = node;
						duiNode.setPosition(cc.v2(-10, 10));
					}
				} else if ((zhupanArr[i][j] & Lu.TYPE_XIAN) > 0) {
					node = cc.instantiate(this.zhupanXianNode);
					if ((zhupanArr[i][j] & Lu.TYPE_DUI) > 0) {
						duiNode = cc.instantiate(this.dayanLanNode);
						duiNode.parent = node;
						duiNode.setPosition(cc.v2(10, -10));
					}
				} else {
					node = cc.instantiate(this.zhupanHeNode);
				}
				node.parent = this.zhupanContent;
				node.x = bgX + width * (i + 0.5);
				node.y = bgY - height * (j + 0.5);
			}
		}
	},

	/*
	 * 大路
	 */
	writeDalu: function (daluArr) {
		this.daluContent.removeAllChildren();
		var width = 270 / 16,
			height = 100 / 6;
		var i, j, node;
		if (daluArr.length > 16) {
			this.daluContent.width = width * daluArr.length;
			this.daluContent.x = (16 - daluArr.length) * width / 2;
		} else {
			this.daluContent.width = 270;
			this.daluContent.x = 0;
		}
		var bgX = -this.daluContent.width / 2;
		var bgY = this.daluContent.height / 2;
		for (i = 0; i < daluArr.length; ++i) {
			for (j = 0; j < daluArr[i].length; ++j) {
				if (!!daluArr[i][j]) {
					if ((daluArr[i][j] & Lu.TYPE_ZHUANG) > 0) {
						node = cc.instantiate(this.daluHongNode);
					} else {
						node = cc.instantiate(this.daluLanNode);
					}
					if (Math.floor(daluArr[i][j] / Lu.TYPE_HU) > 0) {
						node.getChildByName('Label').getComponent(cc.Label).string = Math.floor(daluArr[i][j] / Lu.TYPE_HU);
					}
					node.parent = this.daluContent;
					node.x = bgX + width * (i + 0.5);
					node.y = bgY - height * (j + 0.5);
				}
			}
		}
	},

	/*
	 * 大眼仔路
	 */
	writeDayan: function (dayanArr) {
		this.dayanContent.removeAllChildren();
		var width = 135 / 24,
			height = 51 / 6;
		var i, j, node;
		if (dayanArr.length > 24) {
			this.dayanContent.width = width * dayanArr.length;
			this.dayanContent.x = (24 - dayanArr.length) * width / 2;
		} else {
			this.dayanContent.width = 135;
			this.dayanContent.x = 0;
		}
		var bgX = -this.dayanContent.width / 2;
		var bgY = this.dayanContent.height / 2;
		for (i = 0; i < dayanArr.length; ++i) {
			for (j = 0; j < dayanArr[i].length; ++j) {
				if (!!dayanArr[i][j]) {
					if (dayanArr[i][j] === Lu.HONG) {
						node = cc.instantiate(this.dayanHongNode);
					} else {
						node = cc.instantiate(this.dayanLanNode);
					}
					node.parent = this.dayanContent;
					node.x = bgX + width * i;
					node.y = bgY - height * (j + 0.5);
				}
			}
		}
	},

	/*
	 * 小路
	 */
	writeXiaolu: function (xiaoluArr) {
		this.xiaoluContent.removeAllChildren();
		var width = 135 / 20,
			height = 51 / 6;
		var i, j, node;
		if (xiaoluArr.length > 20) {
			this.xiaoluContent.width = width * xiaoluArr.length;
			this.xiaoluContent.x = (20 - xiaoluArr.length) * width / 2;
		} else {
			this.xiaoluContent.width = 135;
			this.xiaoluContent.x = 0;
		}
		var bgX = -this.xiaoluContent.width / 2;
		var bgY = this.xiaoluContent.height / 2;
		for (i = 0; i < xiaoluArr.length; ++i) {
			for (j = 0; j < xiaoluArr[i].length; ++j) {
				if (!!xiaoluArr[i][j]) {
					if (xiaoluArr[i][j] === Lu.HONG) {
						node = cc.instantiate(this.xiaoluHongNode);
					} else {
						node = cc.instantiate(this.xiaoluLanNode);
					}
					node.parent = this.xiaoluContent;
					node.x = bgX + width * (i + 0.5);
					node.y = bgY - height * (j + 0.5);
				}
			}
		}
	},

	/*
	 * 螳螂路
	 */
	writeTanglang: function (tanglangArr) {
		this.tanglangContent.removeAllChildren();
		var width = 135 / 24,
			height = 51 / 6;
		var i, j, node;
		if (tanglangArr.length > 24) {
			this.tanglangContent.width = width * tanglangArr.length;
			this.tanglangContent.x = (24 - tanglangArr.length) * width / 2;
		} else {
			this.tanglangContent.width = 135;
			this.tanglangContent.x = 0;
		}
		var bgX = -this.tanglangContent.width / 2;
		var bgY = this.tanglangContent.height / 2;
		for (i = 0; i < tanglangArr.length; ++i) {
			for (j = 0; j < tanglangArr[i].length; ++j) {
				if (!!tanglangArr[i][j]) {
					if (tanglangArr[i][j] === Lu.HONG) {
						node = cc.instantiate(this.tanglangHongNode);
					} else {
						node = cc.instantiate(this.tanglangLanNode);
					}
					node.parent = this.tanglangContent;
					node.x = bgX + width * i;
					node.y = bgY - height * (j + 0.5);
				}
			}
		}
	},

	onButtonClick: function (event, param) {
		Global.CCHelper.playPreSound();
		if (param === 'enter_game') {
			Matching.joinRoom(this.roomId)
			// Global.API.hall.joinRoomRequest(this.roomId);
		}
	},

	update: function (tm) {
		if (this.gameStatus === BJLProto.STATUS_POUR) {
			var percent = this.progressTick / BJLProto.POUR_TM;
			this.progressbar.progress = (percent <= 0) ? 0 : percent;
			this.progressTick -= tm;
		}
	},
});