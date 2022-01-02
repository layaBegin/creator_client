import { Actions } from "../../Actions";
import { TGPD2Config } from "./TGPD2Config";
import { Utiles } from "../../Models/Utiles";

function isValidGem(gem: number) {
    return gem != undefined && gem != 242 && gem != 0 && gem != -1;
}
function indexOf(line: cc.Vec2[], point: cc.Vec2) {
    for (let i = 0; i < line.length; i++) {
        if (line[i].x == point.x && line[i].y == point.y) {
            return i;
        }
    }
    return -1;
}
function getBaseIndex(level: number) { return Number("2" + level + "0") }

/**
 * 游戏核心算法及数据存储
 * 1.将服务端 长度为64的一维数组转成 二维整列 
 */
export class TGPD2GameCore {
    /**
     * 关卡
     * 0 龙珠夺宝
     * 1 2 3 钻石夺宝
     */
    level: 1 | 2 | 3 | 4 = 1;
    getLevel() {
        // if (this.brickData == 0) return 4;
        return <1 | 2 | 3 | 4>Math.ceil((45 - this.brickData + 1) / 15);
    }
    /**
     * 宝石阵列大小
     * 第一关 4*4
     * 第二关 5*5
     * 第三关 6*6
     */
    border: 4 | 5 | 6 | 7 = 4;
    getBorder() { return <4 | 5 | 6 | 7>(this.level + 3) };
    /**
     * 当前砖块数量
     * 砖块消除顺序 右->左->下, 每个方向 15 个 固定一共 45 个
     * 如果有关卡保存功能,这个数值应该同步服务端数据
     */
    brickData: number = 45; // 当前砖块数量
    /**
     * 宝石阵列
     * 第一维 列
     * 第二维 行
     */
    gemMatrixData: number[][] = [];
    /**
     * 界面数据
     */
    viewArray: TGPD2View[] = [];
    /**
     * 初始化核心数据
     */
    init() {
        this.gemMatrixData = [[], [], [], [], [], []];
        this.viewArray = [];
        this.brickData = 45;
        console.warn("debug::清除数据")
    }
    /**
     * 服务端宝石数据转本地数据
     */
    getGemArray(gemData: string[]/* 服务端宝石数据 长度 64 类型 string 数组*/) {
        let baseIndex = getBaseIndex(this.level);
        let temp: number[] = [];
        for (let i = 0; i < gemData.length; i++) {
            temp[i] = Number(gemData[i]) + baseIndex;
        }
        return temp;
    }
    // 初始化
    initResultData(data: StartResultData/* 服务端数据 */) {
        // console.log(JSON.stringify(data));
        // 宝石阵列调试数据
        // data = JSON.parse('{"userData":{"isAddDrillBit":true,"indexOfDrillBit":8,"totalBrick":43,"bet":10,"score":-10,"currentScore":10},"gemArray":[2,3,2,1,1,3,1,5,4,1,5,5,4,4,5,2,5,2,2,2,5,1,5,2,5,5,4,4,2,3,1,1,5,1,5,1,5,4,5,2,2,5,5,3,3,5,5,2,4,4,1,3,3,5,1,1,2,4,1,4,2,4,4,1]}')
        this.init();
        this.brickData = data.userData.totalBrick;
        // 关卡调试代码
        // if (CC_DEV /* && this.brickData == 44 */) {
        //     this.brickData = 0;
        // }

        if (data.userData.isAddDrillBit) {
            this.brickData++;   // 先恢复钻头数量 在界面消除钻头时更新这个数据
        }
        // 计算当前关卡 宝石阵列大小
        let level = this.level = this.getLevel();
        this.border = this.getBorder();
        // 先将服务端一维宝石阵列转成二维宝石阵列
        this.initGemMatrixData(data.gemArray);
        // 向二维宝石阵列中添加钻头
        // if (data.userData.drillBitNum) {
        //     let pos = this.getArrayPos(data.userData.indexOfDrillBit);
        //     if (level == 1) {
        //         this.gemMatrixData[pos.x].splice(pos.y, 0, 216);    // 是添加不是替换
        //     } else if (level == 2) {
        //         this.gemMatrixData[pos.x].splice(pos.y, 0, 226);    // 是添加不是替换
        //     } else if (level == 3) {
        //         this.gemMatrixData[pos.x].splice(pos.y, 0, 236);    // 是添加不是替换
        //     }
        // }

        // 补全阵列为 6*6
        if (level == 1) {
            // 第一列(左边)和最后一列(右边)为空
            this.gemMatrixData.splice(0, 0, []);
            this.gemMatrixData.push([]);
        }
        else if (level == 2) {
            // 第一列为空(左边)为空
            this.gemMatrixData.splice(0, 0, []);
        }

        this.printMatrix(this.gemMatrixData);

        this.getViewData(data.userData.bet, data.userData.isAddDrillBit, data.userData.indexOfDrillBit);
        if (CC_DEV && this.viewArray.length == 0) {
            debugger;
        }
        console.log("剩余宝石::");
        this.printMatrix(this.gemMatrixData);

        if (CC_DEV && this.viewArray.length > 4) {
            console.warn("消除次数超过了三次");
        }
    }
    /**
     * 初始化宝石阵列
     * 将长度64的一维数组转成竖直的二维数组
     * 第一维是列 第二维是行
     */
    initGemMatrixData(gemData: string[]/* 服务端宝石数据 长度 64 类型 string */) {
        let border = this.border;
        let gemArray: number[] = this.getGemArray(gemData);
        this.gemMatrixData = [];
        for (let i = 0; i < border; i++) {
            this.gemMatrixData[i] = [];
        }
        for (let i = 0; i < gemArray.length; i++) {
            this.gemMatrixData[i % border].push(gemArray[i])
        }
        return this.gemMatrixData;
    }
    getViewData(betNum: number, isAddDrillBit?: boolean, indexOfDrillBit?: number) {
        if (this.getFirstViewData(betNum, isAddDrillBit, indexOfDrillBit)) {
            let nextView: TGPD2View;
            do {
                let lastView: TGPD2View = this.viewArray[this.viewArray.length - 1];
                this.printView(lastView);

                nextView = lastView.getNextView();
                if (nextView) {
                    this.viewArray.push(nextView);
                }
                else {
                    break;
                }
            } while (true);
        }
    }
    /**
     * 获取第一屏信息
     */
    getFirstViewData(betNum: number, isAddDrillBit?: boolean, indexOfDrillBit?: number) {
        let border = this.border;
        let view = new TGPD2View(border, this.gemMatrixData, betNum, true);
        this.viewArray.push(view);

        // 计算当前屏的连线和分数
        if (false && isAddDrillBit) {
            let arrPos = this.getArrayPos(indexOfDrillBit);
            if (this.border == 4 || this.border == 5) {
                arrPos.x += 1;
            }
            let kind = 0
            if (this.level == 1) {
                kind = 216
            } else if (this.level == 2) {
                kind = 226
            }
            else if (this.level == 3) {
                kind = 236
            }
            let data = {
                line: [arrPos],
                kind: kind
            }
            view.destroyData.push(data)
            view.score.push(0); // 钻头没有分数
            view.addMatrix[arrPos.x] = [this.gemMatrixData[arrPos.x].shift()];
            return true;
        }
        else {
            let hasDestory = view.generateDestoryData();
            if (hasDestory) {
                view.generateAddMatrix();
            }
            return hasDestory;
        }
    }
    /**
     * 动态添加钻头
     * @param drillBitNum 钻头数量
     */
    addDrillBit(drillBitNum: number) {
        let viewNum = this.viewArray.length;
        // 当前总屏数 总钻头数
        let drillBitConfig = [];
        let drillBitId = this.getDrillBitKindId(this.level);
        for (let i = 0; i < drillBitNum; i++) {
            let index = Utiles.randomNum(0, viewNum - 1 - 1);
            let config = drillBitConfig[index] || {
                viewIndex: index,
                arrPos: [],
                drillBitNum: 0
            }
            if (index == 0) {   // 在第一屏添加钻头时顺便随机一下坐标位置
                let min = ([1, 1, 0])[this.level];
                let max = ([4, 5, 5])[this.level];
                config.arrPos.push(cc.v2(Utiles.randomNum(min, max), Utiles.randomNum(0, this.border - 1)));
            }
            config.drillBitNum++;
            drillBitConfig[index] = config;
        }
        // 开始添加钻头
        for (let i = 0; i < drillBitConfig.length; i++) {
            let config = drillBitConfig[i];
            let view = new TGPD2View(this.border, [], 0);
            let viewOld: TGPD2View;
            viewOld = this.viewArray[i + i];
            // 生成数据
            let viewMatrix = view.viewMatrix = JSON.parse(JSON.stringify(viewOld.viewMatrix));
            let destroyData = view.destroyData = JSON.parse(JSON.stringify(viewOld.destroyData));
            let addMatrix = view.addMatrix = [[], [], [], [], [], []];
            let topView = view.topView = JSON.parse(JSON.stringify(viewOld.topView));
            // 设置消除数据
            destroyData.kind = drillBitId;
            destroyData.line = config.arrPos;
            // 设置分数
            view.score = [0];
            if (i == 0) {
                for (let j = 0; j < config.drillBitNum; j++) {
                    let arrPos = config.arrPos[j];
                    let col = viewMatrix[arrPos.x];
                    col.splice(arrPos.y, 0, drillBitId);    // 添加钻头
                    // 设置补全数据 移除最后一个宝石作为补全数据
                    let kind = col.pop();
                    addMatrix[arrPos.x].push(kind);
                    // 修改顶部宝石数据
                    topView[arrPos.x] = kind;
                }
                this.viewArray.unshift(view);   // 将最新的第一屏数据添加到数组中
            }
            else {
                // 从上一屏的补全列中随机一列作为添加钻头的列
                let preView = this.viewArray[i + i - 1];
                let preTopView = preView.topView;
                let temp = [];
                for (let i = 0; i < preTopView.length; i++) {
                    if (preTopView[i], length) {
                        temp.push(i);
                    }
                }
                // 规定钻头优先下落
                for (let j = 0; j < config.drillBitNum; j++) {
                    let colIndex = Utiles.randomNum(0, temp.length - 1);
                    let col = preView.addMatrix[colIndex];
                    let rowIndex = Utiles.randomNum(0, col.length - 1 - 1);
                    col.unshift(drillBitId);    // 向上一屏的补全数据中添加钻头
                    let kind = col.pop();
                    // 修改上一屏的顶部糖果
                    preView.topView[colIndex] = drillBitId;

                    addMatrix[colIndex].push(kind); // 溢出的糖果添加到当前屏的补全数据中

                }
            }
        }


    }
    /**
     * 宝石下落动画
     */
    async gemFalling(gemNode: cc.Node, delay: number, duration: number, endPos: cc.Vec2) {
        let tween = cc.tween()
            .delay(delay)
            .to(duration, { position: endPos })
        return Actions.runActionSync(gemNode, tween);
    }
    /**
     * 将一维数组下标转二维数组下标
     * x 列
     * y 行
     */
    getArrayPos(index: number, border?: number/* 二维数组的大小 */) {
        border = border ? border : this.border;
        return cc.v2(index % border, Math.floor(index / border));
    }
    getArrayIndex(col: number, row: number, border: number) {
        border = border ? border : this.border;
        return col + row * border;
    }
    getDrillBitKindId(level: number = 1) {
        return [242, 216, 226, 236, 242][level];
    }
    //////////////// 调试工具
    printMatrix(viewMatrix: number[][]) {
        let border = Math.max(viewMatrix[0].length, viewMatrix[1].length, viewMatrix[2].length, viewMatrix[3].length, viewMatrix[4].length, viewMatrix[5].length);
        console.log("//////////////////////////////");
        for (let j = border - 1; j >= 0; j--) {
            let row = "";
            for (let i = 0; i < 6; i++) {
                let kind: number | string = viewMatrix[i][j]
                if (!kind) {
                    kind = "000"
                }
                row += kind + " ";
            }
            console.log(row);
        }
        console.log("//////////////////////////////");
    }
    printView({ viewMatrix, topView = [], destroyData, addMatrix }: TGPD2View) {
        console.log("//////////////////////////////");
        let border = this.border;
        let row = "";
        for (let i = 0; i < topView.length; i++) {
            row += topView[i] + " ";
        }

        console.log(row + " \n\n");
        for (let j = border - 1; j >= 0; j--) {
            let row = "";
            for (let i = 0; i < 6; i++) {
                let kind: number | string = viewMatrix[i][j]
                if (!kind) {
                    kind = "000"
                }
                row += kind + " ";
            }
            console.log(row);
        }
        console.log("消除信息::", destroyData);
        console.log("添加信息::", addMatrix);
        console.log("//////////////////////////////");
    }
    initGemMatrix(data: number[][]) {
        this.gemMatrixData = data;
    }

}
export class TGPD2View {
    viewMatrix: number[][] = [[], [], [], [], [], []];
    addMatrix: number[][] = [[], [], [], [], [], []];
    topView: number[] = []// 6;
    destroyData: { kind: number, line: cc.Vec2[] }[] = []
    score: number[] = [];
    border: number = 0;
    private _nextView: TGPD2View = undefined;    // 下一屏
    _desCountList: number[] = [];
    _gemMatrix: number[][] = [];
    // 计算分数相关属性
    level: number = 1;
    betNum: number = 0; // 服务端返回的下注值

    constructor(border: number, gemMatrix: number[][]/* 外部剩余宝石数据 */, betNum: number, isFirstView: boolean = false) {
        this.border = border;
        this.level = border - 3;
        this._gemMatrix = gemMatrix;
        this.betNum = betNum;
        if (isFirstView) {
            // 先截取第一屏阵列 和顶部宝石
            for (let i = 0, len = 6; i < len; i++) {
                this.viewMatrix[i] = this._gemMatrix[i].splice(0, border);
                this.topView[i] = this._gemMatrix[i][0] || 242;
            }
        }
    }
    /**
     * 生成消除数据
     */
    generateDestoryData() {
        if (this.hasDestory()) {
            return true;
        }

        let border = this.border;
        let viewMatrix = this.viewMatrix;

        let getDestoryGroup = (col: number, row: number, line: cc.Vec2[]) => {
            let point = cc.v2(col, row);
            line.push(point);
            let aroundGem = this.getAroundGem(viewMatrix, col, row);
            let currGem = aroundGem.currGem;
            if (indexOf(line, cc.v2(col + 1, row)) == -1 && isValidGem(aroundGem.rightGem) && currGem == aroundGem.rightGem) {
                getDestoryGroup(col + 1, row, line);
            }
            if (indexOf(line, cc.v2(col - 1, row)) == -1 && isValidGem(aroundGem.leftGem) && currGem == aroundGem.leftGem) {
                getDestoryGroup(col - 1, row, line);
            }
            if (indexOf(line, cc.v2(col, row - 1)) == -1 && isValidGem(aroundGem.bottomGem) && currGem == aroundGem.bottomGem) {
                getDestoryGroup(col, row - 1, line);
            }
            if (indexOf(line, cc.v2(col, row + 1)) == -1 && isValidGem(aroundGem.topGem) && currGem == aroundGem.topGem) {
                getDestoryGroup(col, row + 1, line);
            }
        }
        for (let j = 0; j < border; j++) {// 先循环行 从底部行开始检测
            for (let i = 0; i < 6; i++) {   // 列
                let currGem = viewMatrix[i][j];
                let bool = false
                for (let k = 0; k < this.destroyData.length; k++) {
                    if (indexOf(this.destroyData[k].line, cc.v2(i, j)) >= 0) {
                        bool = true
                        break
                    }
                }
                if (bool) continue

                if (isValidGem(currGem)) {
                    let line = [];
                    getDestoryGroup(i, j, line);
                    // console.log(i, j, line);

                    if (line.length >= border) {
                        let data = {
                            line: line,
                            kind: currGem
                        }
                        this.destroyData.push(data)
                        // return true;
                    }
                }
            }
        }
        // 获取分数 
        this.calculateScore();
        return this.hasDestory();
    }
    /**
     * 生成补全数据
     */
    generateAddMatrix() {
        if (this.hasDestory() == false) {
            this.addMatrix = [[], [], [], [], [], []];
            return;
        }
        let gemMatrix = this._gemMatrix;

        let desCol = [0, 0, 0, 0, 0, 0];    // 统计每一列的消除数量
        for (let i = 0; i < this.destroyData.length; i++) {
            let line = this.destroyData[i].line;
            for (let i = 0; i < line.length; i++) {
                desCol[line[i].x]++;
            }
        }

        // 提取补全数据
        for (let i = 0; i < desCol.length; i++) {
            this.addMatrix[i] = gemMatrix[i].splice(0, desCol[i]);
        }
    }
    /**
     * 计算分数
     */
    calculateScore() {
        if (this.hasDestory() == false) {
            this.score.push(0);
            return
        }

        // 钻头没有分
        for (let i = 0; i < this.destroyData.length; i++) {
            if (this.destroyData[i].kind == 216 || this.destroyData[i].kind == 226 || this.destroyData[i].kind == 236) {
                this.score.push(0);
                return
            }

            // 统计分数
            let lineLen = this.destroyData[i].line.length;
            let bonusIndex = lineLen - this.border;
            if (bonusIndex > 11) {
                console.error("爆奖错误，连线数据超过预期值。", JSON.stringify(this.destroyData) + "   ||| border=" + this.border);
                bonusIndex = 11;
            }
            let level = this.level, kind = this.destroyData[i].kind, baseIndex = getBaseIndex(level);
            let score = TGPD2Config.coreConfig.BonusConfig[level - 1][bonusIndex][kind - baseIndex - 1];
            this.score.push(score * this.betNum);
            console.log(`当前分数:: ${score} * ${this.betNum} = ${this.score}`);

        }


    }
    /** 
     * 获取下一屏
     */
    getNextView() {
        if (this._nextView) {
            return this._nextView;
        }
        if (this.hasDestory() == false) {   // 当前屏如果没有消除数据，肯定没有下一屏
            return this._nextView = undefined;
        }
        let nextView = this._nextView = new TGPD2View(this.border, this._gemMatrix, this.betNum);
        let viewMatrix = JSON.parse(JSON.stringify(this.viewMatrix));
        nextView.viewMatrix = viewMatrix;
        for (let x = 0; x < 6; x++) {
            let len = this.addMatrix[x].length;
            if (len) {
                let desCount = 0;
                // 重置消除的宝石
                for (let y = 0; y < this.border; y++) {
                    for (let i = 0; i < this.destroyData.length; i++) {
                        if (indexOf(this.destroyData[i].line, cc.v2(x, y)) >= 0) {
                            desCount++;
                        }
                        else if (desCount) {
                            viewMatrix[x][y - desCount] = viewMatrix[x][y];
                        }
                    }

                }
                // 补全宝石阵列
                for (let y = 0; y < len; y++) {
                    viewMatrix[x][this.border - len + y] = this.addMatrix[x][y];
                }
            }
        }
        // 生成顶部宝石
        for (let i = 0, len = 6; i < len; i++) {
            nextView.topView[i] = this._gemMatrix[i][0] || 242;
        }

        // 生成消除信息 分数 和补全数组
        nextView.generateDestoryData();
        nextView.generateAddMatrix();
        // nextView.calculateScore();

        return nextView;
    }
    /**
     * 获取当前行列周围的所有点
     */
    getAroundGem(viewMatrix: number[][], col: number, row: number) {
        let border = this.border;
        let leftGem: number = 242, rightGem: number = 242, topGem: number = 242, bottomGem: number = 242;
        if (col > 0) {
            leftGem = viewMatrix[col - 1][row];
        }
        if (col < 6 - 1) {
            rightGem = viewMatrix[col + 1][row];
        }
        if (row > 0) {
            bottomGem = viewMatrix[col][row - 1];
        }
        if (row < border - 1) {
            topGem = viewMatrix[col][row + 1];
        }
        let currGem = viewMatrix[col][row];
        return {
            currGem: currGem,
            leftGem: leftGem,
            rightGem: rightGem,
            topGem: topGem,
            bottomGem: bottomGem
        }
    }

    /**
     * 是否存在消除数据
     */
    hasDestory() {
        if (!this.destroyData || this.destroyData.length == 0) {
            return false
        }
        if (this.destroyData.length == 1) {
            if ([216, 226, 236].indexOf(this.destroyData[0].kind) >= 0) {
                return true;
            }
            else if (this.destroyData[0].line.length >= this.border) {
                return true;
            }
        }
        else if (this.destroyData.length > 1) {
            return true;
        }
        return false;
    }
}

interface StartResultData {
    userData: {
        /* 当前下注值 */
        bet: number
        /* 当前评分 */
        currentScore: number
        indexOfDrillBit?: number
        isAddDrillBit?: boolean
        /* 钻头数量 */
        drillBitNum: number
        /* 当前消除总得分 */
        score: number
        /* 当前砖块数量 */
        totalBrick: number
    }
    gemArray: string[];
}