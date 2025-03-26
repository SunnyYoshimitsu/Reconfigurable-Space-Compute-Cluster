"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = wsController;
const db_1 = require("../services/db");
function wsController(channel, queue, ws, message, params) {
    /* CONTROLLER FUNCTIONS */
    /**
     * Sends message to RabbitMQ
     */
    const sendMessage = () => {
        try {
            console.log(params);
            // const MessageJSON: Message = JSON.parse(params); // MessageJSON['message']
            channel.sendToQueue(queue, Buffer.from(params));
            ws.send(JSON.stringify({ type: "success", message: "Message sent" }));
        }
        catch (err) {
            ws.send(JSON.stringify({ type: "failure", message: "Unable to send message" }));
        }
    };
    /**
     * DB request to get all cubesats
     */
    const getCubesats = () => __awaiter(this, void 0, void 0, function* () {
        const response = yield (0, db_1.getAllCubesats)();
        const result = response;
        if (result.status === 'success') {
            ws.send(JSON.stringify({ type: "success", message: result.message, data: result.data }));
        }
        else if (result.status === 'failure') {
            ws.send(JSON.stringify({ type: "failure", message: result.message }));
        }
    });
    /**
     * DB request add cubesat
     */
    const addCubesat = () => __awaiter(this, void 0, void 0, function* () {
        const cubesatJson = JSON.parse(params);
        const response = yield (0, db_1.createCubesat)(cubesatJson['drone_id'], cubesatJson['name']);
        const result = yield response;
        if (result.status === 'success') {
            ws.send(JSON.stringify({ type: "success", message: result.message }));
        }
        else if (result.status === 'failure') {
            ws.send(JSON.stringify({ type: "failure", message: result.message }));
        }
    });
    /**
     * DB request update cubesat
     */
    const editCubesat = () => __awaiter(this, void 0, void 0, function* () {
        const cubesatJson = JSON.parse(params);
        const { id, drone_id } = cubesatJson, parameters = __rest(cubesatJson, ["id", "drone_id"]);
        const response = yield (0, db_1.updateCubesat)(drone_id, parameters);
        const result = yield response;
        if (result.status === 'success') {
            ws.send(JSON.stringify({ type: "success", message: result.message }));
        }
        else if (result.status === 'failure') {
            ws.send(JSON.stringify({ type: "failure", message: result.message }));
        }
    });
    /**
    * DB request remove cubesat
    */
    const removeCubesat = () => __awaiter(this, void 0, void 0, function* () {
        const cubesatJson = JSON.parse(params);
        const response = yield (0, db_1.deleteCubesat)(cubesatJson['drone_id']);
        const result = yield response;
        if (result.status === 'success') {
            ws.send(JSON.stringify({ type: "success", message: result.message }));
        }
        else if (result.status === 'failure') {
            ws.send(JSON.stringify({ type: "failure", message: result.message }));
        }
    });
    /* ROUTING */
    if (message === 'send') {
        sendMessage();
    }
    else if (message === 'add') {
        addCubesat();
    }
    else if (message === 'update') {
        editCubesat();
    }
    else if (message === 'getAll') {
        getCubesats();
    }
    else if (message === 'remove') {
        removeCubesat();
        ws.send(JSON.stringify({ type: "success", message: "Removed Cubesat" }));
    }
    else { // message unknown
        ws.send(JSON.stringify({ type: "failure", message: "Unknown request" }));
    }
}
