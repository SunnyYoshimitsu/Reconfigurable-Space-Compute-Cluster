"use strict";
// rabbitmq calls here
// https://www.rabbitmq.com/tutorials/tutorial-one-javascript
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChannel = void 0;
// global variable channel in server.ts
const callback_api_1 = __importDefault(require("amqplib/callback_api"));
const getChannel = (URL) => __awaiter(void 0, void 0, void 0, function* () {
    let rbmqChannel = undefined;
    const res = yield callback_api_1.default.connect(URL, (err, connection) => __awaiter(void 0, void 0, void 0, function* () {
        if (err) {
            console.error('Failed to connect to RabbitMQ', err);
            return;
        }
        yield connection.createChannel((err, ch) => {
            if (err) {
                console.error('Failed to create RabbitMQ channel', err);
                return;
            }
            rbmqChannel = ch;
            const queue = 'server_queue';
            rbmqChannel.assertQueue(queue, { durable: false });
            console.log('RabbitMQ connection established');
        });
    }));
    return rbmqChannel;
});
exports.getChannel = getChannel;
