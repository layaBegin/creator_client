import { HallAPI_new } from "../NetWork/HallAPI_new";
// import account = require('./AccountAPI');
// import room = require('./RoomAPI');
// import http = require('./HttpAPI');
import roomProto = require('../API/RoomProto');
import { HttpAPI_new } from "../NetWork/HttpAPI_new";
import { RoomAPI_new } from "../NetWork/RoomAPI_new";

export class API {
    hall: HallAPI_new = undefined;
    room: RoomAPI_new = undefined;
    http: HttpAPI_new = undefined;
    roomProto = undefined;

    constructor() {
        this.hall = HallAPI_new.getInstance();
        this.room = new RoomAPI_new();
        this.http = new HttpAPI_new();
        this.roomProto = roomProto;
    }
}

