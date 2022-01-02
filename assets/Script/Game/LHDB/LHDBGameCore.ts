import { Actions } from "../../Actions";
import { LHDBConfig } from "./LHDBConfig";

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
export class LHDBGameCore {
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
    viewArray: LHDBView[] = [];
    /**
     * 初始化核心数据
     */
    init() {
        this.gemMatrixData = [[], [], [], [], [], []];
        this.viewArray = [];
        this.brickData = 45;
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
        console.log(JSON.stringify(data));
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
        if (data.userData.isAddDrillBit) {
            let pos = this.getArrayPos(data.userData.indexOfDrillBit);
            this.gemMatrixData[pos.x].splice(pos.y, 0, 241);    // 是添加不是替换
        }
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
        console.log("剩余宝石::");
        this.printMatrix(this.gemMatrixData);

        if (CC_DEV && this.viewArray.length > 3) {
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
            let nextView: LHDBView;
            do {
                let lastView: LHDBView = this.viewArray[this.viewArray.length - 1];
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
        let view = new LHDBView(border, this.gemMatrixData, betNum, true);
        this.viewArray.push(view);

        // 计算当前屏的连线和分数
        if (isAddDrillBit) {
            let arrPos = this.getArrayPos(indexOfDrillBit);
            if (this.border == 4 || this.border == 5) {
                arrPos.x += 1;
            }
            view.destroyData.line = [arrPos];
            view.destroyData.kind = 241;
            view.score = 0; // 钻头没有分数
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
    printView({ viewMatrix, topView = [], destroyData, addMatrix }: LHDBView) {
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
export class LHDBView {
    viewMatrix: number[][] = [[], [], [], [], [], []];
    addMatrix: number[][] = [[], [], [], [], [], []];
    topView: number[] = []// 6;
    destroyData: { kind: number, line: cc.Vec2[] } = {
        kind: 242,
        line: []
    };
    score: number = 0;
    border: number = 0;
    private _nextView: LHDBView = undefined;    // 下一屏
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
                if (isValidGem(currGem)) {
                    let line = [];
                    getDestoryGroup(i, j, line);
                    // console.log(i, j, line);
                    if (line.length >= border) {
                        this.destroyData.line = line;
                        this.destroyData.kind = currGem;
                        // 获取分数 
                        this.calculateScore();
                        return true;
                    }
                }
            }
        }
        return false;
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
        let line = this.destroyData.line;
        let desCol = [0, 0, 0, 0, 0, 0];    // 统计每一列的消除数量
        for (let i = 0; i < line.length; i++) {
            desCol[line[i].x]++;
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
        if (this.hasDestory() == false || this.destroyData.kind == 241) {   // 钻头没有分
            this.score = 0;
            return
        }
        // 统计分数
        let lineLen = this.destroyData.line.length;
        let bonusIndex = lineLen - this.border;
        if (bonusIndex > 11) {
            console.error("爆奖错误，连线数据超过预期值。", JSON.stringify(this.destroyData) + "   ||| border=" + this.border);
            bonusIndex = 11;
        }
        let level = this.level, kind = this.destroyData.kind, baseIndex = getBaseIndex(level);

        let score = LHDBConfig.coreConfig.BonusConfig[level - 1][bonusIndex][kind - baseIndex - 1];
        this.score = Global.Utils.numberRound(score * this.betNum);
        console.log(`当前分数:: ${score} * ${this.betNum} = ${this.score}`);
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
        let nextView = this._nextView = new LHDBView(this.border, this._gemMatrix, this.betNum);
        let viewMatrix = JSON.parse(JSON.stringify(this.viewMatrix));
        nextView.viewMatrix = viewMatrix;
        for (let x = 0; x < 6; x++) {
            let len = this.addMatrix[x].length;
            if (len) {
                let desCount = 0;
                // 重置消除的宝石
                for (let y = 0; y < this.border; y++) {
                    if (indexOf(this.destroyData.line, cc.v2(x, y)) >= 0) {
                        desCount++;
                    }
                    else if (desCount) {
                        viewMatrix[x][y - desCount] = viewMatrix[x][y];
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
        nextView.calculateScore();

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
        if (!this.destroyData.kind || this.destroyData.kind == 242) {
            return false;
        }
        if (this.destroyData.kind != 241 && this.destroyData.line.length < this.border) {
            return false;
        }

        return true;
    }
}

interface StartResultData {
    userData: {
        bet: number
        currentScore: number
        indexOfDrillBit: number
        isAddDrillBit: boolean
        score: number
        totalBrick: number
    }
    gemArray: string[];
}