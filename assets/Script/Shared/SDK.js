let exp = module.exports = {};
let openinstall = require("../Lib/OpenInstall");
exp.openinstall = openinstall;

let ANDROID_API = "org/cocos2dx/javascript/CommonAPI";
let IOS_API = "JsCall";

exp.getDeviceId = function () {
    let deviceId = "123456";
    if (cc.sys.isNative) {
        if (cc.sys.os === cc.sys.OS_ANDROID) {
            deviceId = jsb.reflection.callStaticMethod(ANDROID_API, "getDeviceUniqID", "()Ljava/lang/String;");
        } else if (cc.sys.os === cc.sys.OS_IOS) {
            deviceId = jsb.reflection.callStaticMethod(IOS_API, "getDeviceUniqID");
        }
    }

    if (deviceId && typeof deviceId == "string") {
        cc.sys.localStorage.setItem("deviceID", deviceId);
    }
    else {
        deviceId = cc.sys.localStorage.getItem("deviceID");
        if (!deviceId) {
            console.error("获取不到当前设备的设备号");
            return "123456";
        }
    }
    return deviceId;
}

exp.copyText = function (text) {
    if (cc.sys.isNative) {
        if (cc.sys.os === cc.sys.OS_ANDROID) {
            jsb.reflection.callStaticMethod(ANDROID_API, "copyText", "(Ljava/lang/String;)V", text);
        } else if (cc.sys.os === cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod(IOS_API, "copyText:", text);
            Tip.makeText("复制成功");
        }
    } else {
        var textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            Tip.makeText('复制成功');
        } catch (err) {
            console.error("copyTextToClipboard " + err);
            alert('Oops, unable to copy');
        }
        document.body.removeChild(textArea);
    }
};

exp.openAppByUrl = function (url) {
    if (cc.sys.isNative) {
        if (cc.sys.os === cc.sys.OS_ANDROID) {
            jsb.reflection.callStaticMethod(ANDROID_API, "openAppByUrl", "(Ljava/lang/String;)V", url);
        } else if (cc.sys.os === cc.sys.OS_IOS) {
            jsb.reflection.callStaticMethod(IOS_API, "openAppByUrl:", url);
        }
    }
};


exp.saveToPhotos = function (filePath) {
    if (cc.sys.isNative) {
        if (cc.sys.os === cc.sys.OS_ANDROID) {
            let ret = jsb.reflection.callStaticMethod(ANDROID_API, "saveToPhotos", "(Ljava/lang/String;)Z", filePath);
            if (!ret) {
                Confirm.show("保存失败,请检查App是否有存储权限");
            } else {
                Tip.makeText("保存成功");
            }
        } else if (cc.sys.os === cc.sys.OS_IOS) {
            Global.SDK.saveToPhotos.callback = function (ret) {
                if (ret == "保存成功") {
                    Tip.makeText("保存成功");
                }
                else {
                    Confirm.show("保存失败,请检查App是否有相册和存储权限");
                }
            }
            let ret = jsb.reflection.callStaticMethod(IOS_API, "saveToPhotos:", filePath);
            if (ret) {
                if (!ret) {
                    // Privacy - Photo Library Additions Usage Description
                    // Privacy - Photo Library Usage Description
                    Confirm.show("保存失败,请检查App是否有相册和存储权限");
                }
            }
        }
    }

}