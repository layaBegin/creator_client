export namespace TGPD2Proto {

    export enum Type {
        START_NOTIFY = 301,         // 游戏开始发送
        START_PUSH = 401,           // 游戏开始返回
        END_NOTIFY = 302,           // 游戏结束发送
        END_PUSH = 402,             // 游戏结束返回


        // 服务端主动推送
        UPDATE_PRIZE_POOL_PUSH = 405,// 更新奖池
        ROB_USER_SCORE_PUSH = 406,   // 301请求发送错误返回 :金币不足 参数非法

    }

    export function gameStartNotify(bet: number) {
        API.room.gameMessageNotify({
            type: Type.START_NOTIFY,
            data: {
                bet: bet
            }
        })
    }
    export function gemeEndNotify() {
        API.room.gameMessageNotify({
            type: Type.END_NOTIFY,
            data: {}
        })
    }



}