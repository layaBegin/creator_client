/**
 * 切记 此文件导入方式只能是 
 * import("***").xxx;   ts 文件导入
 * typeof import("***");js 文件导入
 */
let Debug: import("./Debug/Debugger").Debugger
let ViewMgr: import("./Manager/ViewManager").ViewManager
let Tip: import("./Init/Toast").Toast
let Waiting: import("./Init/WaitingLayer").WaitingLayer
let Matching: import("./Init/Matching").Matching
let continueBtn: import("./Continue/Continue").Continue
let Confirm: import("./Init/ConfirmBox").ConfirmBox
let AssetMgr: import("./Models/AssetManager").AssetManager
let AssetReleaseMgr: import("./Models/AssetReleaseManager").AssetReleaseManager
let UIMgr: import("./Models/UIManager").UIManager
let Config: typeof import("./Models/Config").Config
let MessageMgr: import("./Manager/MessageManager").MessageManager
let GameConfig: import("./Models/GameConfig").GameConfig
let BroadcastModel: import("./Models/BroadcastModel").BroadcastModel
let AudioMgr: import("./Shared/AudioManager").AudioManager
let AudioConfig: import("./Models/SoundConfig").SoundConfig
let API: import("./NetWork/API").API;
let NetworkMgr: import("./Manager/NetworkManager").NetworkManager;

let subpackMgr: import("./HotUpdate/SubpackManager").default;

let pomelo: pomelo_creator;

let LockMgr: import("./Manager/LockManager").LockManager;


let OK: 0;
let FAIL: 1;

/**
 * 无法提示类中的 静态属性 
 */
declare module Global {

    let Constant: typeof import('./Shared/Constant')
    let MessageCallback: typeof import('./Shared/MessageCallback')
    let DialogManager: typeof import('./Shared/DialogManager')
    let AudioManager: typeof import('./Shared/AudioManager')
    let NetworkManager: typeof import('./Shared/NetworkManager_old')
    let CCHelper: typeof import('./Shared/CCHelper')
    let Utils: typeof import('./Shared/utils')
    let NetworkLogic: typeof import('./Shared/NetworkLogic')
    let Enum: typeof import('./Shared/enumeration')
    let Code: typeof import('./Shared/code')
    let API: typeof import('./Shared/Api_old')
    let SDK: typeof import('./Shared/SDK')
    let Animation: typeof import('./Shared/Animation')
    let Player: typeof import('./Models/Player')
    let PlayerWechat: typeof import('./Models/PlayerWechat')
    let VipConfig: typeof import('./Models/VipConfig')
    let Data: typeof import('./Models/Data')
    let AgentProfit: typeof import('./Models/AgentProfit')

    let AssetReleaseManager: import("./Models/AssetReleaseManager").AssetReleaseManager;
    let AssetManager: import("./Models/AssetManager").AssetManager;
    let Waiting: import("./Init/Waiting").WaitingLayer;
    let Matching: import("./Init/Matching").Matching;
    let UIManager: import("./Models/UIManager").UIManager;
    let isOpenSystemNotice: any;
}

interface BaseReturn {
    code: number;
    pushRouter: string;
    type: number;
    msg?: any;
    data?: any
    text?: string;
}
interface ViewUrl {
    viewUrl: string;
    prefabUrl?: string;
    isShowAction?: boolean;
    isWait?: boolean;
}