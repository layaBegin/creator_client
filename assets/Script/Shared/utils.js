/**
 * Created by cuilifeng on 2014/5/29.
 */


var utils = module.exports;

// control variable of func "myPrint"
var isPrintFlag = false;


/**
 * Check and invoke callback function
 */
utils.invokeCallback = function (cb) {
    if (!!cb && typeof cb === 'function') {
        cb.apply(null, Array.prototype.slice.call(arguments, 1));
    }
};

/**
 * clone an object
 */
utils.clone = function (origin) {
    if (!origin) {
        return;
    }

    var obj = {};
    for (var f in origin) {
        if (origin.hasOwnProperty(f)) {
            obj[f] = origin[f];
        }
    }
    return obj;
};

utils.size = function (obj) {
    if (!obj) {
        return 0;
    }

    var size = 0;
    for (var f in obj) {
        if (obj.hasOwnProperty(f)) {
            size++;
        }
    }

    return size;
};

// print the file name and the line number ~ begin
function getStack() {
    var orig = Error.prepareStackTrace;
    Error.prepareStackTrace = function (_, stack) {
        return stack;
    };
    var err = new Error();
    Error.captureStackTrace(err, arguments.callee);
    var stack = err.stack;
    Error.prepareStackTrace = orig;
    return stack;
}

function getFileName(stack) {
    return stack[1].getFileName();
}

function getLineNumber(stack) {
    return stack[1].getLineNumber();
}

utils.myPrint = function () {
    if (isPrintFlag) {
        var len = arguments.length;
        if (len <= 0) {
            return;
        }
        var stack = getStack();
        var aimStr = '\'' + getFileName(stack) + '\' @' + getLineNumber(stack) + ' :\n';
        for (var i = 0; i < len; ++i) {
            aimStr += arguments[i] + ' ';
        }
        console.log('\n' + aimStr);
    }
};
// print the file name and the line number ~ end

utils.getProperties = function (model, fields) {
    var result = {};
    fields.forEach(function (field) {
        if (model.hasOwnProperty(field)) {
            result[field] = model[field];
        }
    });
    return result;
};

utils.setProperties = function (model, properties) {
    for (var prop in properties) {
        model[prop] = properties[prop];
    }
};

utils.multiplyProperties = function (properties, multiplier) {
    var result = {};
    for (var k in properties) {
        result[k] = Math.floor(properties[k] * multiplier);
    }
    return result;
};

utils.addProperties = function (toProps, fromProps) {
    for (var k in fromProps) {
        if (toProps[k]) {
            toProps[k] += fromProps[k];
        } else {
            toProps[k] = fromProps[k];
        }
    }

};

utils.isEmptyObject = function (obj) {
    for (var name in obj) {
        return false;
    }
    return true;
};

utils.getLength = function (obj) {
    var total = 0;
    for (var k in obj) {
        total++;
    }
    return total;
}

utils.getDist = function (fromPos, toPos) {
    var dx = toPos.x - fromPos.x;
    var dy = toPos.y - fromPos.y;
    return Math.sqrt(dx * dx + dy * dy);
};

utils.isPositiveInteger = function (num) {
    var r = /^[1-9][0-9]*$/;
    return r.test(num);
};

utils.ipToInt = function (ip) {
    var parts = ip.split(".");

    if (parts.length != 4) {
        return 0;
    }
    return (parseInt(parts[0], 10) << 24 |
        parseInt(parts[1], 10) << 16 |
        parseInt(parts[2], 10) << 8 |
        parseInt(parts[3], 10)) >>> 0;
};

utils.getRandomNum = function (Min, Max) {
    var Range = Max - Min;
    var Rand = Math.random();
    return (Min + Math.round(Rand * Range));
};


utils.userId2Number = function (userId) {
    var hash = 5381,
        i = userId.length;

    while (i)
        hash = (hash * 33) ^ userId.charCodeAt(--i);

    /* JavaScript does bitwise operations (like XOR, above) on 32-bit signed
     * integers. Since we want the results to be always positive, convert the
     * signed int to an unsigned by doing an unsigned bitshift. */
    return Number(hash >>> 0);
};

utils.createJoinRoomID = function (serverID, roomID) {
    var id = parseInt(serverID.split('-')[1]);
    if (!!id) {
        return id * 1000 + roomID;
    }

    return 0;
};

utils.parseJoinRoomID = function (joinRoomID) {
    joinRoomID = parseInt(joinRoomID);
    if (!!joinRoomID) {
        return {
            gameServerID: 'game-' + Math.floor(joinRoomID / 1000),
            roomID: joinRoomID % 1000
        };
    }
    return null;
};

var DAY_MS = 24 * 60 * 60 * 1000;
utils.getIntervalDay = function (time1, time2) {
    return Math.abs((Math.floor(time1 / DAY_MS) - Math.floor(time2 / DAY_MS)));
};

//使数字保留num个小数位，默认保留2位，转换之后是数字
utils.numToFixed = function (number, count) {
    var count_ = count || 2;
    return parseFloat(parseFloat(number).toFixed(count_));
};

//时间戳转换成日期
Date.prototype.format = function (format) {
    var date = {
        "M+": this.getMonth() + 1,
        "d+": this.getDate(),
        "h+": this.getHours(),
        "m+": this.getMinutes(),
        "s+": this.getSeconds(),
        "q+": Math.floor((this.getMonth() + 3) / 3),
        "S+": this.getMilliseconds()
    };
    if (/(y+)/i.test(format)) {
        format = format.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
    }
    for (var k in date) {
        if (new RegExp("(" + k + ")").test(format)) {
            format = format.replace(RegExp.$1, RegExp.$1.length === 1 ?
                date[k] : ("00" + date[k]).substr(("" + date[k]).length));
        }
    }
    return format;
};

String.prototype.format = function (args) {
    var result = this;
    if (arguments.length > 0) {
        if (arguments.length === 1 && typeof (args) === "object") {
            for (var key in args) {
                if (args[key] !== undefined) {
                    var reg = new RegExp("({" + key + "})", "g");
                    result = result.replace(reg, args[key]);
                }
            }
        } else {
            for (var i = 0; i < arguments.length; i++) {
                if (arguments[i] !== undefined) {
                    var reg = new RegExp("({[" + i + "]})", "g");
                    result = result.replace(reg, arguments[i]);
                }
            }
        }
    }
    return result;
};

//生成随机字符串
utils.randomString = function (len) {
    len = len || 16;
    var chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678'; /****默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
    var maxPos = chars.length;
    var pwd = '';
    for (i = 0; i < len; i++) {
        pwd += chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return pwd;
};

// 获取单位向量
utils.getUnitVector = function (startPoint, endPoint) {
    let point = cc.v2(0, 0);
    let distance;
    distance = Math.pow((startPoint.x - endPoint.x), 2) + Math.pow((startPoint.y - endPoint.y), 2);
    distance = Math.sqrt(distance);
    if (distance === 0) return point;
    point.x = (endPoint.x - startPoint.x) / distance;
    point.y = (endPoint.y - startPoint.y) / distance;
    return point;
};

utils.stringFormat = function () {
    if (arguments.length === 0)
        return null;
    let str = arguments[0];
    for (let i = 1; i < arguments.length; i++) {
        let re = new RegExp('\\{' + (i - 1) + '\\}', 'gm');
        str = str.replace(re, arguments[i]);
    }
    return str;
};

// 截取英文字符的长度
utils.getStringByRealLength = function (str, length) {
    let realLength = 0;
    for (let i = 0; i < str.length; ++i) {
        let count = str.charCodeAt(i);
        if (count >= 0 && count <= 128) {
            ++realLength;
        } else {
            realLength += 2;
        }
        if (realLength >= length) {
            break;
        }
    }
    return str.substring(0, i + 1);
};
// 截取字符的长度超出显示。。。
utils.cutstr = function (str, len) {
    if (str.length > len) {
        return str.substr(0, len) + '...'
    } else {
        return str;
    }
};

utils.getStringRealLength = function (str) {
    let realLength = 0;
    for (let i = 0; i < str.length; ++i) {
        let count = str.charCodeAt(i);
        if (count >= 0 && count <= 128) {
            ++realLength;
        } else {
            realLength += 2;
        }
    }
    return realLength;
};


//小数位保留2位，向下取小数位
utils.formatNum2 = function (x) {
    // let m = Math.pow(10, 2);
    // return (Math.floor(num * m) / m).toFixed(2);
    var f_x = parseFloat(x);
    if (isNaN(f_x)) {
        return "0";
    }
    var f_x = Math.round(x * 100) / 100;
    var s_x = f_x.toString();
    var pos_decimal = s_x.indexOf('.');
    if (pos_decimal < 0) {
        pos_decimal = s_x.length;
        s_x += '.';
    }
    while (s_x.length <= pos_decimal + 2) {
        s_x += '0';
    }
    return Number(s_x).toFixed(2);
};
/**
 * 浮点数的四舍五入
 * @param {number} num 被操作数
 * @param {number} fixed 保留的小数位
 * @returns {number}
 */
utils.numberRound = function (num, fixed = 2) {
    let m = Math.pow(10, fixed);
    return Math.round(num * m) / m;
}
/**
 * 浮点数的四舍五入 并固定小数位
 * @param {number} num 被操作数
 * @param {number} fixed 保留的小数位
 * @returns {string}
 */
utils.numberToFixed = function (num, fixed = 2) {
    return utils.numberRound(num.fixed).toFixed(fixed);
}

utils.formatNumberToString = function (num, maxDecimalLength) {
    return parseFloat(num.toFixed(maxDecimalLength)).toString();
};

utils.keepNumberPoint = function (num, maxDecimalLength) {
    let base = 1;
    for (let i = 0; i < maxDecimalLength; ++i) {
        base *= 10;
    }
    return Math.floor(num * base) / base;
};


/**
 * 获得从m中取n的所有组合
 */
/**
 * 获得从m中取n的所有组合
 */
utils.getCombinationFlagArrs = function (m, n) {
    if (!n || n < 1 || m < n) {
        return [];
    }
    if (m === n) {
        return [
            [1, 1]
        ];
    }
    let resultArrs = [],
        flagArr = [],
        isEnd = false,
        i, j, leftCnt;


    for (i = 0; i < m; i++) {
        flagArr[i] = i < n ? 1 : 0;
    }


    resultArrs.push(flagArr.concat());


    while (!isEnd) {
        leftCnt = 0;
        for (i = 0; i < m - 1; i++) {
            if (flagArr[i] === 1 && flagArr[i + 1] === 0) {
                for (j = 0; j < i; j++) {
                    flagArr[j] = j < leftCnt ? 1 : 0;
                }
                flagArr[i] = 0;
                flagArr[i + 1] = 1;
                let aTmp = flagArr.concat();
                resultArrs.push(aTmp);
                if (aTmp.slice(-n).join("").indexOf('0') === -1) {
                    isEnd = true;
                }
                break;
            }
            flagArr[i] === 1 && leftCnt++;
        }
    }
    return resultArrs;
};

