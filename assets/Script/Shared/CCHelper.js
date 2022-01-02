let utils = require("./utils");
let code = require("./code");

var exp = module.exports = {};

/**
 * @param res 资源路径(不带后缀,带resources)
 * @param cb 异步创建，function(err, node)
 */
exp.createFrameAnimationNode = function (res, cb) {
    AssetMgr.loadResSync(res + "_config", cc.JsonAsset, function (err, data) {
        if (!!err) {
            cc.error("createFrameAnimation err: load file fail url=" + res + '.json');
            cb("load file fail");
        } else {
            data = data.json;
            let width = data["width"] || 0;
            let height = data["height"] || 0;
            let count = data["count"] || 0;
            let intervalTime = (data["intervalTime"] || 0);
            if (width <= 0 || height <= 0 || count <= 0 || intervalTime <= 0) {
                cc.error("animation data err");
                cb("animation data err");
                return;
            }
            AssetMgr.loadResSync(cc.url.raw(res + '.png'), function (err, texture) {
                if (!!err) {
                    cc.error("createFrameAnimation err: load file fail url=" + res + '.png');
                    cb("load file fail");
                } else {
                    let wCount = Math.floor(texture.width / width) || 1;
                    let hCount = Math.floor(texture.height / height) || 1;

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
                        intervalTime = intervalTime / speed;
                        node.stopAllActions();
                        let index = 0;

                        function callback() {
                            let curIndex = index++ % data.count;
                            let rect = new cc.Rect((curIndex % wCount) * width, Math.floor(curIndex / hCount) * height, width, height);
                            sprite.spriteFrame = new cc.SpriteFrame(texture, rect);
                            if (!!completeCallback && (curIndex === (data.count - 1))) {
                                completeCallback();
                            }
                        }
                        if (!!loop) {
                            node.runAction(cc.repeatForever(cc.sequence([cc.delayTime(intervalTime), cc.callFunc(callback)])));
                        } else {
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

// 获取单位向量
exp.getUnitVector = function (startPoint, endPoint) {
    let point = cc.v2(0, 0);
    let distance;
    distance = Math.pow((startPoint.x - endPoint.x), 2) + Math.pow((startPoint.y - endPoint.y), 2);
    distance = Math.sqrt(distance);
    if (distance === 0) return point;
    point.x = (endPoint.x - startPoint.x) / distance;
    point.y = (endPoint.y - startPoint.y) / distance;
    return point;
};

exp.getRelativePosition = function (childNode, parentNode) {
    return parentNode.convertToNodeSpace(childNode.parent.convertToWorldSpace(childNode.position));
};

//检查是不是微信浏览器
exp.isWechatBrowser = function () {
    //安卓的微信webview由qq浏览器x5内核提供技术支持，所以加BROWSER_TYPE_MOBILE_QQ
    return false;
    //return (cc.sys.browserType === cc.sys.BROWSER_TYPE_WECHAT || cc.sys.browserType === cc.sys.BROWSER_TYPE_MOBILE_QQ);
};

exp.setPageTitle = function (titleText) {
    if (!cc.sys.isBrowser) return;
    document.title = titleText;
};

//跨域图片或者本地图片
exp.updateSpriteFrame = function (imgUrl, target_, cb) {
    let target = target_;
    if (target_ instanceof cc.Node) {
        target = target_.getComponent(cc.Sprite);
    }
    if ((imgUrl && imgUrl.indexOf('http') >= 0)) {
        cc.loader.load({ // 此处存在一个内存泄露，没有管理远程加载资源的释放
            url: imgUrl,
            type: "png"
        }, function (err, texture) {
            if (!!err) {
                cc.error(err, imgUrl);
                utils.invokeCallback(cb, err);
            } else {
                if (cc.isValid(target)) {
                    target.spriteFrame = new cc.SpriteFrame(texture);
                    utils.invokeCallback(cb);
                }
            }
        });
        //加载本地图片
    } else {
        // AssetMgr.loadResSync(imgUrl, cc.SpriteFrame, function (err, spriteFrame) {
        AssetMgr.loadResSync(imgUrl, cc.SpriteFrame, function (err, spriteFrame) {
            if (!!err) {
                cc.error(err, imgUrl);
                utils.invokeCallback(cb, err);
            } else {
                if (cc.isValid(target)) {
                    target.spriteFrame = spriteFrame;
                    utils.invokeCallback(cb);
                }
            }
        });
    }
};

exp.loadRes = function (dirArr, cb) {
    console.error("CCHelper.loadRes 已经废弃,请使用 AssetMgr 相关API")
    return;
};

exp.createSpriteNode = function (src, isCustom = false) {
    let node = new cc.Node();
    let sprite = node.addComponent(cc.Sprite);
    if (isCustom) {
        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;    // 
    }
    sprite.spriteFrame = new cc.SpriteFrame();
    exp.updateSpriteFrame(src, sprite);
    return node;
};

/**
 * http请求
 * @param params = {
 *      url： 请求地址
 *      method: GET,POST 默认 GET
 *      async: 是否异步，默认异步
 *      data：请求数据
 *      withCredentials: 默认false
 *      responseType: 默认false
 *      cb：请求回调
 * }
 */
exp.httpRequest = function (params) {
    cc.log('请求url:', params.url);
    cc.log('请求数据:', JSON.stringify(params.data));
    let urlStr = params.url;
    let methodStr = params.method || 'GET';
    let responseType = params.responseType || 'json';
    //let withCredentials = params.withCredentials || false;

    let xhr = new XMLHttpRequest();
    xhr.responseType = responseType;
    xhr.onload = function () {
        cc.log('收到数据:', JSON.stringify(xhr.response));
        if (xhr.status === 200) {
            utils.invokeCallback(params.cb, null, xhr.response);
        } else {
            cc.error("请求失败：status=" + xhr.status);
            utils.invokeCallback(params.cb, "请求失败");
        }
    };
    xhr.timeout = 20000;
    xhr.ontimeout = function (e) {
        // XMLHttpRequest 超时。在此做某事。
        cc.error("请求超时:", JSON.stringify(xhr.response));
        if (typeof params.cb == "function") {
            utils.invokeCallback(params.cb, "请求超时");
        } else {
            Waiting.hide();
        }
    };
    xhr.onerror = function (e) {
        cc.error("请求错误", e);
        if (typeof params.cb == "function") {
            utils.invokeCallback(params.cb, Global.Code.FAIL);
        } else {
            Waiting.hide();
        }
    };
    xhr.open(methodStr, urlStr, true);
    xhr.setRequestHeader("CONTENT-TYPE", "application/x-www-form-urlencoded");
    //xhr.withCredentials = withCredentials;
    if (!!params.data) {
        let data = "";
        for (let key in params.data) {
            if (params.data.hasOwnProperty(key)) {
                if (data.length > 0) {
                    data += "&";
                }
                data += (key + "=" + params.data[key]);
            }
        }
        if (data.length > 0) {
            xhr.send(data);
        } else {
            xhr.send();
        }
    } else {
        xhr.send();
    }
};

exp.screenShoot = function (cb) {
    if (!cc.sys.isNative) return;
    if (CC_JSB) {
        let dirpath = jsb.fileUtils.getWritablePath() + 'ScreenShoot/';
        if (!jsb.fileUtils.isDirectoryExist(dirpath)) {
            jsb.fileUtils.createDirectory(dirpath);
        }
        let name = 'ScreenShoot-' + (new Date()).valueOf() + '.png';
        let filepath = dirpath + name;
        let size = cc.visibleRect;
        let rt = cc.RenderTexture.create(size.width, size.height);
        cc.director.getScene()._sgNode.addChild(rt);
        rt.setVisible(false);
        rt.begin();
        cc.director.getScene()._sgNode.visit();
        rt.end();
        rt.saveToFile('ScreenShoot/' + name, cc.ImageFormat.PNG, true, function () {
            cc.log('save succ');
            rt.removeFromParent(true);
            utils.invokeCallback(cb, null, filepath);
        });
    }
};

// 截屏
// exp.capScreen = function (node) {
//     if (CC_JSB) {
//         let width = cc.visibleRect.width;
//         let height = cc.visibleRect.height;
//         let renderTexture = cc.RenderTexture.create(width, height);
//         node.parent._sgNode.addChild(renderTexture);

//         renderTexture.begin();
//         node._sgNode.visit();
//         renderTexture.end();
//         let url = Date.now() + ".png";
//         renderTexture.saveToFile(url, cc.ImageFormat.PNG, true, function () {
//             node.parent._sgNode.removeChild(renderTexture);
//         });
//     }
// };



//截图
exp.capScreen = function (node) {
    if (CC_JSB) {
        // node.parent = cc.director.getScene();
        let camera = node.addComponent(cc.Camera);

        // 设置你想要的截图内容的 cullingMask
        camera.cullingMask = 0xffffffff;

        // 新建一个 RenderTexture，并且设置 camera 的 targetTexture 为新建的 RenderTexture，这样        camera 的内容将会渲染到新建的 RenderTexture 中。
        let texture = new cc.RenderTexture();
        this.texture = texture;
        let gl = cc.game._renderContext;

        // 如果截图内容中不包含 Mask 组件，可以不用传递第三个参数
        texture.initWithSize(node.width, node.height, gl.STENCIL_INDEX8);
        camera.targetTexture = texture;

        // 渲染一次摄像机，即更新一次内容到 RenderTexture 中
        camera.render();
        node.removeComponent(cc.Camera)
        // 这样我们就能从 RenderTexture 中获取到数据了
        let data = texture.readPixels();

        //翻转图片数据
        let picData = new Uint8Array(texture.width * texture.height * 4);
        let rowBytes = texture.width * 4;
        for (let row = 0; row < texture.height; row++) {
            let srow = texture.height - 1 - row;
            let start = srow * texture.width * 4;
            let reStart = row * texture.width * 4;
            // save the piexls data
            for (let i = 0; i < rowBytes; i++) {
                picData[reStart + i] = data[start + i];
            }
        }

        let filePath = jsb.fileUtils.getWritablePath() + "ScreenShotShare.png"
        console.log("保存路径::" + filePath);
        let success = jsb.saveImageData(picData, texture.width, texture.height, filePath)
        if (success) {
            console.log("save image data success, file: " + filePath);
            Global.SDK.saveToPhotos(filePath);
        }
    }
};

// 刷新对齐
exp.updateNodeAlignment = function (node) {
    let widget = node.getComponent(cc.Widget);
    if (!!widget) {
        widget.updateAlignment();
    }
    for (let i = 0; i < node.children.length; ++i) {
        exp.updateNodeAlignment(node.children[i]);
    }
};

// 屏幕适配
exp.screenAdaptation = function (baseSize, canvas) {
    let size = new cc.size(baseSize.width, baseSize.height);
    let frameSize = cc.view.getFrameSize();
    if (size.height / size.width < frameSize.height / frameSize.width) {
        size.height = size.width * (frameSize.height / frameSize.width);
    } else {
        size.width = size.height * (frameSize.width / frameSize.height);
    }
    canvas.designResolution = size;

    canvas.node.width = size.width;
    canvas.node.height = size.height;

    if (cc.sys.isNative) return;
    cc.view.setResizeCallback(function () {
        size = new cc.size(baseSize.width, baseSize.height);
        frameSize = cc.view.getFrameSize();
        if (size.height / size.width < frameSize.height / frameSize.width) {
            size.height = size.width * (frameSize.height / frameSize.width);
        } else {
            size.width = size.height * (frameSize.width / frameSize.height);
        }
        canvas.designResolution = size;
        canvas.node.width = size.width;
        canvas.node.height = size.height;

        Global.MessageCallback.emitMessage("DesignResolutionChanged", size);

        exp.updateNodeAlignment(canvas.node);
    });
};

exp.playPreSound = function () {
    AssetMgr.loadResSync('Hall/Sound/button', function (err, clip) {
        if (!!err) { } else {
            cc.audioEngine.play(clip, false, parseFloat(cc.sys.localStorage.getItem('SoundVolume')));
        }
    });
};

//16进制
exp.getCardUrl = function (cardValue) {
    let cardUrl = "GameCommon/Cards/value_";
    let num = cardValue % 16;
    let color = Math.floor(cardValue / 16);
    cardUrl += num + "_" + color;
    return cardUrl;
}

//0-51牌值
exp.get10CardUrl = function (cardValue) {
    let cardUrl = "GameCommon/Cards/value_";
    let num = cardValue % 13 + 1;
    let color = Math.floor(cardValue / 13);
    cardUrl += num + "_" + color;
    return cardUrl;
}

exp.releaseRes = function (dirArr) {
    for (let i = 0; i < dirArr.length; i++) {
        cc.loader.releaseResDir(dirArr[i]);
    }
};

exp.getAccount = function () {
    let data = undefined;
    let account = cc.sys.localStorage.getItem('account');
    let password = cc.sys.localStorage.getItem('password');

    let guestAccount = cc.sys.localStorage.getItem('guestAccount');
    let guestPassword = cc.sys.localStorage.getItem('guestPassword');

    let isGuest = cc.sys.localStorage.getItem('isGuest');

    if (isGuest == true || isGuest == "true") {
        if (guestAccount && guestPassword) {
            data = {
                account: guestAccount,
                password: guestPassword,
                isGuest: true,
            }
        }
    } else {
        if (account && password) {
            data = {
                account: account,
                password: password,
                isGuest: false,
            }
        }
    }
    return data
}

exp.isIphoneX = function () {
    var frameSize = cc.view.getFrameSize();
    if (cc.sys.os == cc.sys.OS_IOS) {
        var size = frameSize.width * frameSize.height; //无视横竖屏
        if (size == 2436 * 1125) { //X 和 XS
            return true;
        } else if (size == 1792 * 828) {
            return true;
        } else if (size == 2688 * 1242) {
            return true;
        }
    }
    return false;
};

/**
 * @param state 0:normal,1:gray
 */
exp.changeToGray = function(node, state) {
    if (!node) return;
    node = node.getComponent(cc.Sprite);
    node.setState(state);
    return node;
};
