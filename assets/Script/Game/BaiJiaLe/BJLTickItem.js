var BJLProto = require('./BJLProto');
var RoomProto = require('../../API/RoomProto');

cc.Class({
	extends: cc.Component,
	properties: {
		tickLabel: cc.Label,
		pourSprite: cc.Node,
		resoutSprite: cc.Node,
		serverStartSprite: cc.Node,
	},

	onLoad: function () {
		Global.MessageCallback.addListener('GameMessagePush', this);
		Global.MessageCallback.addListener('RoomMessagePush', this);
		this.pourSprite.active = false;
		this.resoutSprite.active = false;
		this.serverStartSprite.active = false;
	},

	onDestroy: function () {
		Global.MessageCallback.removeListener('GameMessagePush', this);
		Global.MessageCallback.removeListener('RoomMessagePush', this);
	},

	messageCallbackHandler(router, msg) {
		if (router === 'RoomMessagePush') {
			if (msg.type === RoomProto.GET_ROOM_SCENE_INFO_PUSH) {
				if (msg.data.gameData.gameStatus === BJLProto.STATUS_POUR) {
					let statusTime = msg.data.gameData.statusTime;
					if (!statusTime) {
						statusTime = msg.data.gameData.Statustime;
					}
					this.startPour(statusTime);
				} else if (msg.data.gameData.gameStatus === BJLProto.STATUS_RESOUT) {
					let statusTime = msg.data.gameData.statusTime;
					if (!statusTime) {
						statusTime = msg.data.gameData.Statustime;
					}
					this.startResout(statusTime);
				} else if (msg.data.gameData.gameStatus === BJLProto.STATUS_NONE) {
					let statusTime = msg.data.gameData.statusTime;
					if (!statusTime) {
						statusTime = msg.data.gameData.Statustime;
					}
					this.waitStart(statusTime);
				}
			}
		} else if (router === "GameMessagePush") {
			if (msg.type === BJLProto.STATUS_PUSH) {
				// let self = this;
				// this.scheduleOnce(function () {	// 重新请求服务器信息
				if (msg.data.gameStatus === BJLProto.STATUS_POUR) {
					let statusTime = msg.data.statusTime;
					if (!statusTime) {
						statusTime = msg.data.Statustime;
					}
					this.startPour(statusTime);
				} else if (msg.data.gameStatus === BJLProto.STATUS_RESOUT) {
					let statusTime = msg.data.statusTime;
					if (!statusTime) {
						statusTime = msg.data.Statustime;
					}
					this.startResout(statusTime);
				}
				// }, 1);
			}
		} else if (router === "ServerMessagePush") {
			cc.log("ServerMessagePush:" + JSON.stringify(msg));
		}
	},

	/*
	 * 开始下注倒计时
	 */
	startPour: function (pourTime) {
		pourTime = parseInt(pourTime);
		this.pourSprite.active = true;
		this.resoutSprite.active = false;
		this.serverStartSprite.active = false;
		this.unscheduleAllCallbacks();
		this.node.active = true;
		var tick = pourTime || BJLProto.POUR_TM;
		// cc.log("tick时间:" + tick);
		this.tickLabel.string = tick;
		var self = this;
		var callFunc = function () {
			--tick;
			if (tick <= 0) {
				self.node.active = false;
				self.unschedule(callFunc);
				return;
			}
			self.tickLabel.string = tick;
			if (tick <= 3) {
				AudioMgr.playSound('BaiJiaLe/Audio/countdown');
			}
		};
		this.schedule(callFunc, 1);
	},

	startResout: function (pourTime) {
		// this.node.active = false;

		pourTime = parseInt(pourTime);
		this.pourSprite.active = false;
		this.resoutSprite.active = true;
		this.serverStartSprite.active = false;
		this.unscheduleAllCallbacks();
		this.node.active = true;
		let tick = pourTime || BJLProto.POUR_TM;
		// cc.log("tick时间:" + tick);
		this.tickLabel.string = tick;
		let self = this;
		let callFunc = function () {
			--tick;
			if (tick <= 0) {
				self.node.active = false;
				self.unschedule(callFunc);
				return;
			}
			self.tickLabel.string = tick;
			// if (tick <= 3) {
			// 	AudioMgr.playSound('BaiJiaLe/Audio/countdown');
			// }
		};
		this.schedule(callFunc, 1);
	},

	waitStart: function (pourTime) {
		pourTime = parseInt(pourTime);
		this.pourSprite.active = false;
		this.resoutSprite.active = false;
		this.serverStartSprite.active = true;
		this.unscheduleAllCallbacks();
		this.node.active = true;
		let tick = pourTime || BJLProto.POUR_TM;
		// cc.log("tick时间:" + tick);
		this.tickLabel.string = tick;
		let self = this;
		let callFunc = function () {
			--tick;
			if (tick <= 0) {
				self.node.active = false;
				self.unschedule(callFunc);
				return;
			}
			self.tickLabel.string = tick;
		};
		this.schedule(callFunc, 1);
	}
});