
interface GameItem {
    kindID: number
    kindName: string
    /**
     * 游戏状态
     * 1 开启
     * 2 不知道
     * 3 关闭
     */
    status: number
    sort: number
    hot: boolean
    groupID: number
}
interface RoomItem {
    baseScore: number
    expenses: number
    gameTypeID: string
    goldLowerLimit: number
    goldUpper: number
    kind: number
    level: number
    maxPlayerCount: number
    minPlayerCount: number
}

export class GameConfig {
    // private _roomList: RoomItem[] = undefined;
    gameList: GameItem[] = [];
    roomList: { [key: string]: RoomItem[] } = Object.create(null);
    gameConfig: any;

    constructor() { }

    sortRooms(roomList: RoomItem[]) {
        this.roomList = Object.create(null);
        for (let i = 0; i < roomList.length; i++) {
            (this.roomList[roomList[i].kind] = this.roomList[roomList[i].kind] || []).push(roomList[i]);
        }
        // 对所有选场进行 小 到 大 排序
        for (const kindID in this.roomList) {
            let levels = this.roomList[kindID];
            levels.sort(function (a: RoomItem, b: RoomItem) {
                return a.level - b.level;
            })
        }
    }

    sortGame(gameList) {
        gameList.sort((a: GameItem, b: GameItem) => {
            return b.sort - a.sort;
        })
    }

    // init(roomList: RoomItem[], gameList: GameItem[], gameConfig) {
    init(gameList: GameItem[], gameConfig) {
        // this._roomList = roomList;
        // if (!Array.isArray(roomList)) {
        //     roomList = [];
        //     cc.error("断线重连时收到服务器发送的房间列表为空", roomList);
        // }
        if (!Array.isArray(gameList)) {
            gameList = [];
            cc.error("断线重连时收到服务器发送的游戏列表为空", gameList);
        }
        // this.sortRooms(roomList);
        this.sortGame(gameList);
        this.gameList = gameList
        this.gameConfig = gameConfig
    }
    /**
     * 获得游戏选场数据
     * @param kindID 游戏ID
     */
    getGameLevels(kindID: number | string) {
        return this.roomList[kindID] || [];
    }
    /**
     * 获得房间配置信息
     * @param gameTypeID 场次ID
     */
    getRoomConfig(gameTypeID: string, kindID?: number | string) {
        if (kindID != undefined) {
            let levels = this.roomList[kindID] || [];
            for (let i = 0; i < levels.length; i++) {
                if (levels[i].gameTypeID == gameTypeID) {
                    return levels[i];
                }
            }
        }
        for (const kindID in this.roomList) {
            let levels = this.roomList[kindID] || [];
            for (let i = 0; i < levels.length; i++) {
                if (levels[i].gameTypeID == gameTypeID) {
                    return levels[i];
                }
            }
        }
        CC_DEBUG && Debug.assert(true, "找不到房间配置信息::gameTypeID=%s kindID=%s", gameTypeID, kindID || "");
        return undefined;
    }
    getRoomConfigByKindAndLevel(kindID: number, level: number) {
        let levels = this.roomList[kindID] || [];
        for (let i = 0; i < levels.length; i++) {
            if (levels[i].level == level) {
                return levels[i]
            }
        }
        CC_DEBUG && Debug.assert(true, "找不到房间配置信息::kindID=%d level=%s", kindID, level);
        return undefined;
    }

    initGameRooms(roomList: RoomItem[]) {
        this.sortRooms(roomList);
    }
}