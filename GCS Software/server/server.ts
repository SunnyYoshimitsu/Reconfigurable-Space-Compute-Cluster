import WebSocket from 'ws';
import wsController from './controllers/controller';
import db from './config/dbConfig';
import amqp, { Channel, Message } from 'amqplib'

const websocket_port = 8080

const username = process.env.RABBITMQ_USER;
const password = process.env.RABBITMQ_PASS;
const rbmqPort = process.env.RABBITMQ_PORT;
const RABBIT_URL = `amqp://${username}:${password}@rabbitmq:${rbmqPort}`;

const consumer_queue = 'server_queue';
const publisher_queue = 'serial_queue';

// const clients: Map<string, WebSocket> = new Map();
let websocket: WebSocket | null = null;
const wss = new WebSocket.Server({ port: websocket_port});

(async function startServer() {
    try {
        console.log("Starting Server...");

        syncWithDatabase();
        const channel = await connectRabbitMQ();
        startWebSocketServer(channel);

        console.log('Websocket Server Running');

        runRabbitMQConsumer(channel);

        console.log('Consumer Running');
    } catch(error) {
        console.log("Error occured during startup:", error)
    }
})();

/**
 * Sync database and establish connection
 */
async function syncWithDatabase() {
    try {
        db.sync({ force: false, logging: false });
        console.log('Database synced and connection established');
    } catch (error) {
        console.error('Unable to sync Database: ', error);
    }
}

/**
 *  Sync and connect with RabbitMQ server
 *
 * @returns {Promise<Channel>} - Returns a promise that resolves to the RabbitMQ channel
 */
async function connectRabbitMQ(): Promise<Channel> {
    const connection = await amqp.connect(RABBIT_URL);
    const channel = await connection.createChannel();

    await channel.assertQueue(consumer_queue, { durable: true });
    connection.on('close', () => {
        console.error('RabbitMQ connection closed unexpectedly');
    });
    console.log('RabbitMQ connection established');

    return channel;
}

/**
 * Start the WebSocket server and handle connections
 *
 * @param channel - RabbitMQ channel
 */
function startWebSocketServer(channel: Channel) {
    wss.on('connection', handleWebSocketConnection(channel));
}

/**
 * Run the RabbitMQ consumer to listen for messages from the Cubesat
 *
 * @param channel - RabbitMQ channel
 */
function runRabbitMQConsumer(channel: Channel) {
    channel.consume(consumer_queue, (msg: Message | null) => {
        handleCubesatResponse(channel, msg, websocket, publisher_queue);
    });
}

/**
 * Handle WebSocket connections and messages
 *
 * @param channel - RabbitMQ channel
 * @returns {(ws: WebSocket) => void} - Returns a function that handles WebSocket connections
 */
function handleWebSocketConnection(channel: Channel) {
    return (ws: WebSocket) => {
        ws.on('message', (message) => {
            console.log('Received Client: %s', message);

            const parsedMessage = JSON.parse(message.toString());

            /* if (parsedMessage.clientId) {
                clients.set(parsedMessage.clientId, ws);
            } */

            if (!websocket) {
                websocket = ws;
            }

            const controllerParams: [Channel, string, WebSocket, string, string] = [
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
function handleClientMessage(
    type: string,
    controllerParams: [Channel, string, WebSocket, string, string],
    ws: WebSocket
) {
    switch(type) {
        case "request":
            wsController(...controllerParams);
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
function handleCubesatResponse(
    channel: Channel,
    msg: Message | null,
    websocket: WebSocket | null,
    publisher_queue: string
) {
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
        if (ws && ws.readyState === WebSocket.OPEN) {
            const controllerParams: [Channel, string, WebSocket, string, string] = [
                channel,
                publisher_queue,
                ws,
                parsedMessage.message,
                JSON.stringify(parsedMessage.params)
            ];

            handleServerMessage(parsedMessage, controllerParams, channel, publisher_queue);
        }
    } catch (error) {
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
function handleServerMessage(
    parsedMessage: any,
    controllerParams: [Channel, string, WebSocket, string, string],
    channel: Channel,
    publisher_queue: string
) {
    switch (parsedMessage.type) {
        case "response":
            console.log("Sending to server");
            wsController(...controllerParams);
            break;

        case "ping":
            // channel.sendToQueue(publisher_queue, Buffer.from("Ping received by server"));
            wsController(...controllerParams);
            break;

        default:
            channel.sendToQueue(publisher_queue, Buffer.from("Invalid Message Type, rejecting message"));
            break;
    }
}
