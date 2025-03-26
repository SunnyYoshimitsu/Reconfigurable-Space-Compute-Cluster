import WebSocket from "ws";
import { createCubesat, updateCubesat, getAllCubesats, deleteCubesat} from "../services/db";
import { Channel } from "amqplib";

export default function wsController(channel: Channel, queue: string, ws: WebSocket, message: string, params: string): void {

    /* CONTROLLER FUNCTIONS */

    /**
     * Sends message to RabbitMQ
     */
    const sendMessage = () => {
        try {
            console.log(params)
            // const MessageJSON: Message = JSON.parse(params); // MessageJSON['message']

            channel.sendToQueue(queue, Buffer.from(params));
            ws.send(JSON.stringify({ type: "success", message: "Message sent" }));
        } catch (err) {
            ws.send(JSON.stringify({ type: "failure", message: "Unable to send message" }));
        }
    }

    /**
     * DB request to get all cubesats
     */
    const getCubesats = async () => {
        const response = await getAllCubesats();
        const result = response;

        if(result.status === 'success') {
            ws.send(JSON.stringify({ type: "success", message: result.message, data: result.data}));
        } else if (result.status === 'failure') {
            ws.send(JSON.stringify({ type: "failure", message: result.message }));
        }
    }

    /**
     * DB request add cubesat
     */
    const addCubesat = async () => {
        const cubesatJson: Cubesat = JSON.parse(params);

        const response = await createCubesat(cubesatJson['drone_id'], cubesatJson['name']);
        const result = await response;

        if(result.status === 'success') {
            ws.send(JSON.stringify({ type: "success", message: result.message }));
        } else if (result.status === 'failure') {
            ws.send(JSON.stringify({ type: "failure", message: result.message }));
        }
    }

    /**
     * DB request update cubesat
     */
    const editCubesat = async () => {
        const cubesatJson: Cubesat = JSON.parse(params);

        const { id, drone_id, ...parameters } = cubesatJson;

        const response = await updateCubesat(drone_id, parameters);
        const result = await response;

        if(result.status === 'success') {
            ws.send(JSON.stringify({ type: "success", message: result.message }));
        } else if (result.status === 'failure') {
            ws.send(JSON.stringify({ type: "failure", message: result.message }));
        }
    }

    /**
    * DB request remove cubesat
    */
    const removeCubesat = async () => {
        const cubesatJson: Cubesat = JSON.parse(params);

        const response = await deleteCubesat(cubesatJson['drone_id']);
        const result = await response;

        if(result.status === 'success') {
            ws.send(JSON.stringify({ type: "success", message: result.message }));
        } else if (result.status === 'failure') {
            ws.send(JSON.stringify({ type: "failure", message: result.message }));
        }
    }

    /* ROUTING */

    if(message === 'send') {
        sendMessage();
    }
    else if(message === 'add') {
        addCubesat();
    }
    else if(message === 'update') {
        editCubesat();
    }
    else if(message === 'getAll') {
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