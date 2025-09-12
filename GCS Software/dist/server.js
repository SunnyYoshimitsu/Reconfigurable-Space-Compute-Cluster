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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importDefault(require("ws"));
const controller_1 = __importDefault(require("./controllers/controller"));
const dbConfig_1 = __importDefault(require("./config/dbConfig"));
const amqplib_1 = __importDefault(require("amqplib"));
require("dotenv/config");
const websocket_port = 8080;
const username = process.env.RABBITMQ_USER;
const password = process.env.RABBITMQ_PASS;
const rbmqPort = process.env.RABBITMQ_PORT;
const RABBIT_URL = `amqp://${username}:${password}@rabbitmq:${rbmqPort}`;
const consumer_queue = 'server_queue';
const publisher_queue = 'serial_queue';
// const clients: Map<string, WebSocket> = new Map();
let websocket = null;
const wss = new ws_1.default.Server({ port: websocket_port });
(function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("Starting Server...");
            syncWithDatabase();
            const channel = yield connectRabbitMQ();
            startWebSocketServer(channel);
            console.log('Websocket Server Running');
            runRabbitMQConsumer(channel);
            console.log('Consumer Running');
        }
        catch (error) {
            console.log("Error occured during startup:", error);
        }
    });
})();
/**
 * Sync database and establish connection
 */
function syncWithDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            dbConfig_1.default.sync({ force: false, logging: false });
            console.log('Database synced and connection established');
        }
        catch (error) {
            console.error('Unable to sync Database: ', error);
        }
    });
}
/**
 *  Sync and connect with RabbitMQ server
 *
 * @returns {Promise<Channel>} - Returns a promise that resolves to the RabbitMQ channel
 */
function connectRabbitMQ() {
    return __awaiter(this, void 0, void 0, function* () {
        const connection = yield amqplib_1.default.connect(RABBIT_URL);
        const channel = yield connection.createChannel();
        yield channel.assertQueue(consumer_queue, { durable: true });
        connection.on('close', () => {
            console.error('RabbitMQ connection closed unexpectedly');
        });
        console.log('RabbitMQ connection established');
        return channel;
    });
}
/**
 * Start the WebSocket server and handle connections
 *
 * @param channel - RabbitMQ channel
 */
function startWebSocketServer(channel) {
    wss.on('connection', handleWebSocketConnection(channel));
}
/**
 * Run the RabbitMQ consumer to listen for messages from the Cubesat
 *
 * @param channel - RabbitMQ channel
 */
function runRabbitMQConsumer(channel) {
    channel.consume(consumer_queue, (msg) => {
        handleCubesatResponse(channel, msg, websocket, publisher_queue);
    });
}
/**
 * Handle WebSocket connections and messages
 *
 * @param channel - RabbitMQ channel
 * @returns {(ws: WebSocket) => void} - Returns a function that handles WebSocket connections
 */
function handleWebSocketConnection(channel) {
    return (ws) => {
        ws.on('message', (message) => {
            console.log('Received Client: %s', message);
            const parsedMessage = JSON.parse(message.toString());
            /* if (parsedMessage.clientId) {
                clients.set(parsedMessage.clientId, ws);
            } */
            if (!websocket) {
                websocket = ws;
            }
            const controllerParams = [
                channel,
                publisher_queue,
                ws,
                parsedMessage.message,
                JSON.stringify(parsedMessage.params)
            ];
            handleClientMessage(parsedMessage.type, controllerParams, ws);
        });
        ws.on('close', () => {
            console.log("WebSocket Disconnected");
        });
    };
}
/**
 * Handle messages received from the client
 *
 * @param type - message type
 * @param controllerParams - parameters for the controller
 * @param ws - WebSocket instance
 */
function handleClientMessage(type, controllerParams, ws) {
    switch (type) {
        case "request":
            (0, controller_1.default)(...controllerParams);
            break;
        case "ping":
            ws.send(JSON.stringify({ type: "ping", message: "Hello Client" }));
            break;
        default:
            ws.send(JSON.stringify({ type: "error", message: "Unknown message type" }));
            break;
    }
}
/**
 * Handle responses from the Cubesat via RabbitMQ and forward them to the appropriate WebSocket client
 *
 * @param channel
 * @param msg
 * @param websocket
 * @param publisher_queue
 */
function handleCubesatResponse(channel, msg, websocket, publisher_queue) {
    try {
        if (msg == null) {
            console.log('Message is null, Consumer cancelled by server');
            return;
        }
        channel.ack(msg);
        const parsedMessage = JSON.parse(msg.content.toString());
        console.log('Received Rabbitmq:', parsedMessage);
        if (!websocket) {
            console.warn("No matching WebSocket client found for message:", parsedMessage);
            return;
        }
        const ws = websocket;
        if (ws && ws.readyState === ws_1.default.OPEN) {
            const controllerParams = [
                channel,
                publisher_queue,
                ws,
                parsedMessage.message,
                JSON.stringify(parsedMessage.params)
            ];
            handleServerMessage(parsedMessage, controllerParams, channel, publisher_queue);
        }
    }
    catch (error) {
        console.error('Error while handling message: ', error);
    }
}
/**
 * Handle messages received from the Cubesat
 *
 * @param parsedMessage
 * @param controllerParams
 * @param channel
 * @param publisher_queue
 */
function handleServerMessage(parsedMessage, controllerParams, channel, publisher_queue) {
    switch (parsedMessage.type) {
        case "response":
            console.log("Sending to server");
            (0, controller_1.default)(...controllerParams);
            break;
        case "ping":
            // channel.sendToQueue(publisher_queue, Buffer.from("Ping received by server"));
            (0, controller_1.default)(...controllerParams);
            break;
        default:
            channel.sendToQueue(publisher_queue, Buffer.from("Invalid Message Type, rejecting message"));
            break;
    }
}
