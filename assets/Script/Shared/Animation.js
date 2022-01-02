var Animation = module.exports = {};


// 表情动画
Animation.getEmotionAnimalNode = function(index, scheduler) {
	var rootNode = new cc.Node();

	var getNodes = function(count, width, height) {
		var nodes = [];
		for(var i = 0; i < count; ++i) {
			var node = new cc.Node();
			node.active = false;
			node.parent = rootNode;
			nodes.push(node);
		}
		AssetMgr.loadResSync('Emotion/'+index, cc.SpriteFrame, function(err, spriteFrame) {
			for(var i = 0; i < count; ++i) {
				var rect = new cc.Rect(i*width, 0, width, height);
				var cloneSpriteFrame = spriteFrame.clone();
				cloneSpriteFrame.setRect(rect);
				var sprite = nodes[i].addComponent(cc.Sprite);
				sprite.spriteFrame = cloneSpriteFrame;
			}
		});
		return nodes;
	};

	var self = scheduler;
	cc.loader.load(cc.url.raw('resources/Emotion/'+index+'.json'), function (err, data) {
		if(! err) {
			var nodes = getNodes(data.count, data.width, data.height);
			var index = 0;
			var callback = function() {
				var preIndex = (index+data.count-1)%data.count;
				nodes[preIndex].active = false;
				var curIndex = index%data.count;
				nodes[curIndex].active = true;
				++ index;
				if(index >= data.turn*data.count) {
					self.unschedule(callback);
					rootNode.removeFromParent();
				}
			};
			self.schedule(callback, 0.04 * data.time);
		}
	});
	return rootNode;
};

/**
 * @param res 资源路径(不带后缀,带resources)
 * @param cb 异步创建，function(err, node)
 */
Animation.createFrameAnimationNode = function (res, cb) {
    AssetMgr.loadResSync(res + "_config", cc.JsonAsset, function (err, data) {
        if (!!err){
            cc.log("createFrameAnimation err: load file fail url=" + res + '.json');
            cb("load file fail");
        }else{
            data = data.json;
            let width = data["width"] || 0;
            let height = data["height"] || 0;
            let count = data["count"] || 0;
            let intervalTime = (data["intervalTime"] || 0);
            if (width <= 0 || height <= 0 || count <= 0 || intervalTime <= 0){
                cc.log("animation data err");
                cb("animation data err");
                return;
            }
            AssetMgr.loadResSync(res, cc.Texture2D, function (err, texture) {
                if (!!err){
                    cc.log("createFrameAnimation err: load file fail url=" + res + '.png');
                    cb("load file fail");
                }else{
                    let wCount = Math.floor(texture.width/width) || 1;
                    let hCount = Math.floor(texture.height/height) || 1;

                    let node = new cc.Node();
                    let sprite = node.addComponent(cc.Sprite);
                    sprite.spriteFrame = new cc.SpriteFrame(texture, new cc.Rect(0, 64, width, height));
                    /**
                     * @param loop 是否循环，默认false
                     * @param speed 播放速度，默认1
                     * @param completeCallback，每完成一次的回调
                     */
                    node.startAnimation = function (loop, speed, completeCallback) {
                        if (!speed || speed <= 0) speed = 1;
                        intervalTime = intervalTime/speed;
                        node.stopAllActions();
                        let index = 0;
                        function callback() {
                            let curIndex = index++ % data.count;
                            let rect = new cc.Rect((curIndex%wCount) * width, Math.floor(curIndex/hCount) * height, width, height);
                            sprite.spriteFrame = new cc.SpriteFrame(texture, rect);
                            if(!!completeCallback && (curIndex === (data.count - 1))){
                                completeCallback();
                            }
                        }
                        if (!!loop){
                            node.runAction(cc.repeatForever(cc.sequence([cc.delayTime(intervalTime), cc.callFunc(callback)])));
                        }else{
                            node.runAction(cc.repeat(cc.sequence([cc.delayTime(intervalTime), cc.callFunc(callback)]), data.count));
                        }
                    };
                    node.stopAnimation = function () {
                        node.stopAllActions();
                    };
                    cb(null, node);
                }
            })
        }
    });
};

