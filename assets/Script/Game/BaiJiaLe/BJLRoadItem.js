var Lu = require('Lu');
var BJLLogic = require('./BJLLogic');
var BJLProto = require('./BJLProto');
var RoomProto = require('../../API/RoomProto');

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
		xianduiLabel: cc.Label,
		zhuangduiLabel: cc.Label,
		heLabel: cc.Label,
		bajiuLabel: cc.Label,
		bureauLabel: cc.Label,
		maskNode: cc.Node,
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

		zhuangXianhong: cc.Label,
		xianXianhong: cc.Label,
		zhuangDuiXianhong: cc.Label,
		xianDuiXianhong: cc.Label,
		zhuangTwXianhong: cc.Label,
		xianTwXianhong: cc.Label,
		heXianhong: cc.Label,
		tongdianpingXianhong: cc.Label,

		wenluZhuangDayan: cc.Sprite,
		wenluZhuangXiaolu: cc.Sprite,
		wenluZhuangTanglang: cc.Sprite,

		wenluXianDayan: cc.Sprite,
		wenluXianXiaolu: cc.Sprite,
		wenluXianTanglang: cc.Sprite,
	},

	onLoad: function () {
		Global.MessageCallback.addListener('RoomMessagePush', this);
		Global.MessageCallback.addListener('GameMessagePush', this);
	},

	onDestroy: function () {
		Global.MessageCallback.removeListener('RoomMessagePush', this);
		Global.MessageCallback.removeListener('GameMessagePush', this);
	},

	messageCallbackHandler(router, msg) {
		if (router === 'RoomMessagePush') {
			if (msg.type === RoomProto.GET_ROOM_SCENE_INFO_PUSH) {
				cc.log("走势图更新");
				this.initScene(msg.data.gameData.bajiuCount, msg.data.gameData.winTypeArr);
				this.setRoadMask(msg.data.gameData.gameStatus);
			}
		}
		else if (router === "GameMessagePush") {
			if (msg.type === BJLProto.RESOUT_PUSH) {
				this.bajiuCount = msg.data.resout.bajiuCount;
				this.winTypeArr = msg.data.resout.winTypeArr;
				// this.scheduleOnce(function () {
				// 	this.bajiuCount = msg.data.resout.bajiuCount;
				// 	this.winTypeArr = msg.data.resout.winTypeArr;
				// 	this.initScene(msg.data.resout.bajiuCount, msg.data.resout.winTypeArr);
				// }.bind(this), BJLProto.RESOUT_TM - 2);
			}
			else if (msg.type === BJLProto.STATUS_PUSH) {
				this.setRoadMask(msg.data.gameStatus);
			}
		}
	},

	//设置遮挡关系
	setRoadMask: function (gameStatus) {
		if (gameStatus === BJLProto.STATUS_POUR) {
			this.maskNode.active = false;
			if (!!this.winTypeArr) {
				this.initScene(this.bajiuCount, this.winTypeArr);
				this.winTypeArr = null;
			}
		}
		else if (gameStatus === BJLProto.STATUS_RESOUT) {
			this.maskNode.active = true;
		}
	},

	//重写界面
	initScene: function (bajiuCount, typeArr) {
		cc.log("走势图更新界面");
		this.bajiuLabel.string = bajiuCount;
		this.bureauLabel.string = typeArr.length;
		let array = [];
		let i;
		let xianCount = 0, zhuangCount = 0, xianDuiCount = 0, zhuangDuiCount = 0, heCount = 0;
		for (i = 0; i < typeArr.length; ++i) {
			if ((typeArr[i] & BJLLogic.WIN_XIANDUI) > 0) {
				array.push(Lu.TYPE_XIAN | Lu.TYPE_DUI);
				++xianDuiCount;
			}
			else if ((typeArr[i] & BJLLogic.WIN_XIAN) > 0) {
				array.push(Lu.TYPE_XIAN);
				++xianCount;
			}
			else if ((typeArr[i] & BJLLogic.WIN_ZHUANGDUI) > 0) {
				array.push(Lu.TYPE_ZHUANG | Lu.TYPE_DUI);
				++zhuangDuiCount;
			}
			else if ((typeArr[i] & BJLLogic.WIN_ZHUANG) > 0) {
				array.push(Lu.TYPE_ZHUANG);
				++zhuangCount;
			}
			else if ((typeArr[i] & BJLLogic.WIN_HE) > 0) {
				array.push(Lu.TYPE_HU);
				++heCount;
			}
		}
		this.xianLabel.string = xianCount;
		this.zhuangLabel.string = zhuangCount;
		this.xianduiLabel.string = xianDuiCount;
		this.zhuangduiLabel.string = zhuangDuiCount;
		this.heLabel.string = heCount;
		if (array.length > 0) {
			this.writeAllRoad(Lu.getZhupanArr(array));
			this.updateWenLu(array);
		}
	},

	//写所有的路
	writeAllRoad: function (zhupanArr) {
		cc.log("写所有的路");
		var daluArr = Lu.getDaluArr(zhupanArr);
		var dayanArr = Lu.getDayanArr(daluArr);
		var xiaoluArr = Lu.getXiaoluArr(daluArr);
		var tanglangArr = Lu.getTanglangArr(daluArr);
		this.writeZhuPan(zhupanArr);
		this.writeDalu(Lu.getFormatArr(daluArr));
		this.writeDayan(Lu.getFormatArr(dayanArr));
		this.writeTanglang(Lu.getFormatArr(tanglangArr));
		this.writeXiaolu(Lu.getFormatArr(xiaoluArr));
	},

	//朱盘路
	writeZhuPan: function (zhupanArr) {
		this.zhupanContent.removeAllChildren();
		var width = 238 / 8, height = 179 / 6;
		var bgX = -this.zhupanContent.width / 2;
		var bgY = this.zhupanContent.height / 2;
		var i, j, node, duiNode;
		if (zhupanArr.length > 8) {
			this.zhupanContent.width = width * zhupanArr.length;
			this.zhupanContent.x = (8 - zhupanArr.length) * width / 2;
		} else {
			this.zhupanContent.width = 238;
			this.zhupanContent.x = 0;
		}

		for (i = 0; i < zhupanArr.length; ++i) {
			for (j = 0; j < zhupanArr[i].length; ++j) {
				if ((zhupanArr[i][j] & Lu.TYPE_ZHUANG) > 0) {
					node = cc.instantiate(this.zhupanZhuangNode);
					if ((zhupanArr[i][j] & Lu.TYPE_DUI) > 0) {
						duiNode = cc.instantiate(this.dayanHongNode);
						duiNode.parent = node;
						duiNode.setPosition(cc.v2(-10, 10));
					}
				}
				else if ((zhupanArr[i][j] & Lu.TYPE_XIAN) > 0) {
					node = cc.instantiate(this.zhupanXianNode);
					if ((zhupanArr[i][j] & Lu.TYPE_DUI) > 0) {
						duiNode = cc.instantiate(this.dayanLanNode);
						duiNode.parent = node;
						duiNode.setPosition(cc.v2(10, -10));
					}
				}
				else {
					node = cc.instantiate(this.zhupanHeNode);
				}
				node.parent = this.zhupanContent;
				node.x = bgX + width * (i + 0.5);
				node.y = bgY - height * (j + 0.5);
			}
		}
	},

	//大路
	writeDalu: function (daluArr) {
		this.daluContent.removeAllChildren();
		var width = 240 / 16, height = 90 / 6;
		var i, j, node;
		if (daluArr.length > 16) {
			this.daluContent.width = width * daluArr.length;
			this.daluContent.x = (16 - daluArr.length) * width / 2;
		} else {
			this.daluContent.width = 240;
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

	//大眼仔路
	writeDayan: function (dayanArr) {
		this.dayanContent.removeAllChildren();
		var width = 119 / 16, height = 44 / 6;
		var i, j, node;
		if (dayanArr.length > 16) {
			this.dayanContent.width = width * dayanArr.length;
			this.dayanContent.x = (16 - dayanArr.length) * width / 2;
		} else {
			this.dayanContent.width = 119;
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
					node.x = bgX + width * (i + 0.5);
					node.y = bgY - height * (j + 0.5);
				}
			}
		}
	},

	//小路
	writeXiaolu: function (xiaoluArr) {
		this.xiaoluContent.removeAllChildren();
		var width = 119 / 16, height = 45 / 6;
		var i, j, node;
		if (xiaoluArr.length > 16) {
			this.xiaoluContent.width = width * xiaoluArr.length;
			this.xiaoluContent.x = (16 - xiaoluArr.length) * width / 2;
		} else {
			this.xiaoluContent.width = 119;
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
					node.x = bgX + width * (i + 0.4);
					node.y = bgY - height * (j + 0.5);
				}
			}
		}
	},

	//螳螂路
	writeTanglang: function (tanglangArr) {
		this.tanglangContent.removeAllChildren();
		var width = 119 / 16, height = 44 / 6;
		var i, j, node;
		if (tanglangArr.length > 16) {
			this.tanglangContent.width = width * tanglangArr.length;
			this.tanglangContent.x = (16 - tanglangArr.length) * width / 2;
		} else {
			this.tanglangContent.width = 119;
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
					node.x = bgX + width * (i);
					node.y = bgY - height * (j + 0.5);
				}
			}
		}
	},

	//更新问路
	updateWenLu: function (roadArr) {
		this.updateXianWenLu(roadArr);
		this.updateZhuangWenLu(roadArr);
	},

	//更新闲问路
	updateXianWenLu: function (roadArr) {
		let tempArr = [];
		for (let i = 0; i < roadArr.length; ++i) {
			tempArr.push(roadArr[i]);
		}
		tempArr.push(Lu.TYPE_XIAN);
		let arr = Lu.getZhupanArr(tempArr);
		let daluArr = Lu.getDaluArr(arr);
		let dayanArr = Lu.getDayanArr(daluArr);
		dayanArr = Lu.getFormatArr(dayanArr);
		let xiaoluArr = Lu.getXiaoluArr(daluArr);
		xiaoluArr = Lu.getFormatArr(xiaoluArr);
		let tanglangArr = Lu.getTanglangArr(daluArr);
		tanglangArr = Lu.getFormatArr(tanglangArr);

		if (dayanArr.length == 0) {
			this.wenluXianDayan.node.active = false;
		}
		else {
			let dayanWenlu = 0;
			for (let i = 0; i < dayanArr.length; ++i) {
				for (let j = 0; j < dayanArr[i].length; ++j) {
					if (!!dayanArr[i][j]) {
						dayanWenlu = dayanArr[i][j];
					}
				}
			}
			this.wenluXianDayan.node.active = true;
			if (dayanWenlu === Lu.HONG) {
				Global.CCHelper.updateSpriteFrame('BaiJiaLe/daluZhuang', this.wenluXianDayan);
			} else if (dayanWenlu === Lu.LAN) {
				Global.CCHelper.updateSpriteFrame('BaiJiaLe/daluXian', this.wenluXianDayan);
			}
			else {
				this.wenluXianDayan.node.active = false;
			}
		}

		if (xiaoluArr.length == 0) {
			this.wenluXianXiaolu.node.active = false;
		}
		else {
			let xiaoluWenlu = 0;
			for (let i = 0; i < xiaoluArr.length; ++i) {
				for (let j = 0; j < xiaoluArr[i].length; ++j) {
					if (!!xiaoluArr[i][j]) {
						xiaoluWenlu = xiaoluArr[i][j];
					}
				}
			}
			this.wenluXianXiaolu.node.active = true;
			if (xiaoluWenlu === Lu.HONG) {
				Global.CCHelper.updateSpriteFrame('BaiJiaLe/zoushiXiaoluZhuang', this.wenluXianXiaolu);
			} else if (xiaoluWenlu === Lu.LAN) {
				Global.CCHelper.updateSpriteFrame('BaiJiaLe/zoushiXiaoluXian', this.wenluXianXiaolu);
			}
			else {
				this.wenluXianXiaolu.node.active = false;
			}
		}

		if (tanglangArr.length == 0) {
			this.wenluXianTanglang.node.active = false;
		}
		else {
			let tanglangWenlu = 0;
			for (let i = 0; i < tanglangArr.length; ++i) {
				for (let j = 0; j < tanglangArr[i].length; ++j) {
					if (!!tanglangArr[i][j]) {
						tanglangWenlu = tanglangArr[i][j];
					}
				}
			}
			this.wenluXianTanglang.node.active = true;
			if (tanglangWenlu === Lu.HONG) {
				Global.CCHelper.updateSpriteFrame('BaiJiaLe/zoushiTanglangZhuang', this.wenluXianTanglang);
			} else if (tanglangWenlu === Lu.LAN) {
				Global.CCHelper.updateSpriteFrame('BaiJiaLe/zoushiTanglangXian', this.wenluXianTanglang);
			}
			else {
				this.wenluXianTanglang.node.active = false;
			}
		}
	},

	//更新庄问路
	updateZhuangWenLu: function (roadArr) {
		let tempArr = [];
		for (let i = 0; i < roadArr.length; ++i) {
			tempArr.push(roadArr[i]);
		}
		tempArr.push(Lu.TYPE_ZHUANG);
		let arr = Lu.getZhupanArr(tempArr);
		let daluArr = Lu.getDaluArr(arr);
		let dayanArr = Lu.getDayanArr(daluArr);
		dayanArr = Lu.getFormatArr(dayanArr);
		let xiaoluArr = Lu.getXiaoluArr(daluArr);
		xiaoluArr = Lu.getFormatArr(xiaoluArr);
		let tanglangArr = Lu.getTanglangArr(daluArr);
		tanglangArr = Lu.getFormatArr(tanglangArr);

		if (dayanArr.length == 0) {
			this.wenluZhuangDayan.node.active = false;
		}
		else {
			let dayanWenlu = 0;
			for (let i = 0; i < dayanArr.length; ++i) {
				for (let j = 0; j < dayanArr[i].length; ++j) {
					if (!!dayanArr[i][j]) {
						dayanWenlu = dayanArr[i][j];
					}
				}
			}
			this.wenluZhuangDayan.node.active = true;
			if (dayanWenlu === Lu.HONG) {
				Global.CCHelper.updateSpriteFrame('BaiJiaLe/daluZhuang', this.wenluZhuangDayan);
			} else if (dayanWenlu == Lu.LAN) {
				Global.CCHelper.updateSpriteFrame('BaiJiaLe/daluXian', this.wenluZhuangDayan);
			} else {
				this.wenluZhuangDayan.node.active = false;
			}
		}

		if (xiaoluArr.length == 0) {
			this.wenluZhuangXiaolu.node.active = false;
		}
		else {
			let xiaoluWenlu = 0;
			for (let i = 0; i < xiaoluArr.length; ++i) {
				for (let j = 0; j < xiaoluArr[i].length; ++j) {
					if (!!xiaoluArr[i][j]) {
						xiaoluWenlu = xiaoluArr[i][j];
					}
				}
			}
			this.wenluZhuangXiaolu.node.active = true;
			if (xiaoluWenlu === Lu.HONG) {
				Global.CCHelper.updateSpriteFrame('BaiJiaLe/zoushiXiaoluZhuang', this.wenluZhuangXiaolu);
			} else if (xiaoluWenlu === Lu.LAN) {
				Global.CCHelper.updateSpriteFrame('BaiJiaLe/zoushiXiaoluXian', this.wenluZhuangXiaolu);
			}
			else {
				this.wenluZhuangXiaolu.node.active = false;
			}
		}

		if (tanglangArr.length == 0) {
			this.wenluZhuangTanglang.node.active = false;
		}
		else {
			let tanglangWenlu = 0;
			for (let i = 0; i < tanglangArr.length; ++i) {
				for (let j = 0; j < tanglangArr[i].length; ++j) {
					if (!!tanglangArr[i][j]) {
						tanglangWenlu = tanglangArr[i][j];
					}
				}
			}
			this.wenluZhuangTanglang.node.active = true;
			if (tanglangWenlu === Lu.HONG) {
				Global.CCHelper.updateSpriteFrame('BaiJiaLe/zoushiTanglangZhuang', this.wenluZhuangTanglang);
			} else if (tanglangWenlu === Lu.LAN) {
				Global.CCHelper.updateSpriteFrame('BaiJiaLe/zoushiTanglangXian', this.wenluZhuangTanglang);
			} else {
				this.wenluZhuangTanglang.node.active = false;
			}
		}
	}

});
