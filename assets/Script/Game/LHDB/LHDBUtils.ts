/**
 * Created by grape on 2017/7/6.
 */
var GemUtill = {};
export namespace LHDBUtils {

    //合并同类项目
    export function arrayUnique(arrs) {
        let newArrays = [];
        let hash = {};
        if (arrs.length > 0) {
            for (let i = 0, ilen = arrs.length; i < ilen; i += 1) {
                if (!hash[arrs[i]] && arrs[i] !== null) {
                    hash[arrs[i]] = 1;
                    newArrays.push(arrs[i]);
                }
            }
        }
        return newArrays;
    };
    //打印数组
    export function logGemArray(gemsArray, border) {
        for (let i = gemsArray.length / border - 1; i >= 0; i--) {
            let test = "";
            for (let j = 0; j < border; j++) {
                test = test + String(gemsArray[i * border + j]) + ","
            }
            console.log(test)
        }
        console.log("----------------------------")
    };
    //获取坐标
    export function getPos(index, border) {
        return { x: index % border, y: Math.floor(index / border) };
    };
    //获取索引
    export function getIndex(ccp, border) {
        border = border || 6;
        return ccp[0] + ccp[1] * border;
    };
    /* demo
     var arr = ["apple","orange","apple","orange","pear","orange"];
    
     function getWordCnt(){
     return arr.reduce(function(prev,next){
     prev[next] = (prev[next] + 1) || 1;
     return prev;
     },{});
     }
     */
    //统计个数
    export function getWordCnt(arr) {
        return arr.reduce(function (prev, next) {
            prev[next] = (prev[next] + 1) || 1;
            return (function (prev) {
                let count = 0;
                for (let i in prev) {
                    count++;
                }
                return count;
            })();
        }, {});
    };
    export function countArray(array, length, border) {
        // var haveChoses = []
        let getSelects = function (index, select) {
            // console.log(index, select.length)
            if (index >= 0 && index < Math.pow(border, 2)) {
                select.push(index);
                let ps = this.getPos(index, border);
                //二个方向出现结果错误
                if (ps.y >= 0 && select.indexOf(index - border) < 0 && array[index - border] === array[index] && array[index - border] !== 0) {
                    getSelects(index - border, select);
                }
                if (ps.y < border && select.indexOf(index + border) < 0 && array[index + border] === array[index] && array[index + border] !== 0) {
                    getSelects(index + border, select);
                }
                if (ps.x >= 0 && ps.y === this.getPos(index - 1, border).y && select.indexOf(index - 1) < 0 && array[index - 1] === array[index] && array[index - 1] !== 0) {
                    getSelects(index - 1, select);
                }
                if (ps.x < border && ps.y === this.getPos(index + 1, border).y && select.indexOf(index + 1) < 0 && array[index + 1] === array[index] && array[index + 1] !== 0) {
                    getSelects(index + 1, select);
                }
            }
        }.bind(this);


        //获取每个相连
        let selects = [];
        for (let i = 0; i < Math.pow(border, 2); i++) {
            // if(haveChoses.indexOf(i)<0){
            selects[i] = [];
            getSelects(i, selects[i], array);
            selects[i].sort();
            // }
        }
        // 合并同类项
        selects = this.arrayUnique(selects);
        // console.log("------asdsd---", selects);
        let result = [];
        for (let i = 0; i < selects.length; i++) {
            let item = selects[i];
            if (item.length >= length) {
                let temp = { kind: array[item[0]], values: item };
                result.push(temp);
            }
        }
        return result;
    };

    export function checkArray(array, border) {
        let dsrtArrays = [];
        let count = 0;
        let creatGroup = function (count) {
            let dsrtArray = this.countArray(array, border, border);
            count++;
            if (dsrtArray.length === 1 && count > 3)
                return false;
            else if (dsrtArray.length === 1) {
                dsrtArrays.push(dsrtArray[0]);
                array = this.moveDownArray(array, dsrtArray[0].values, border);
                return creatGroup(count)
            }
            else if (dsrtArray.length > 1)
                return false;
            return dsrtArrays;
        }.bind(this);

        return creatGroup(count);
    };
    export function moveDownArray(array, dstrArray, border) {
        for (let i = 0; i < dstrArray.length; i++)
            array[dstrArray[i]] = 0;
        let dstrCol = 0;
        for (let i = 0; i < border; i++)// 循环最下面一行的10列
        {
            dstrCol = 0;// 每列被消去的星星数量
            for (let j = 0; j < Math.pow(border, 2) * 4; j += border) // 循环每列的10个星星
            {
                if (array[j + i] === 0) { dstrCol++; }
                else if (dstrCol) {
                    array[j + i - dstrCol * border] = array[j + i];//重置移动后的星星数组值
                    array[j + i] = 0;
                }
            }
        }
        return array;
    };
    export function getArrayInfo(gemArray, level) {
        level = level || 1;
        let border = level + 3;
        let temp = this.checkArray(gemArray, border);

        return temp;
    };

    //转换成竖直二维数组
    export function conversionArray(gemArray, level) {
        let border = level + 3;
        let temp = [];

        for (let i = 0; i < border; i++) {
            temp[i] = [];
        }
        for (let i = 0; i < gemArray.length; i++) {
            temp[i % border].push(gemArray[i])
        }
        return temp;
    };
    //添加钻头
    export function addDrillBit(gemArray, border) {
        let index = this.getDrillBitPosition(border);
        let pos = getPos(index, border);

        gemArray[pos.y].splice(pos.x, 0, 0);
        return index;
    };
    export function formatGoldNumber(number, digit) {
        let result = number;
        // if(number >= Math.pow(10,digit)) {
        //     result = (number / Math.pow(10, 4)).toFixed(1) + "/";
        // }
        return +(+result).toFixed(2);
    };
}