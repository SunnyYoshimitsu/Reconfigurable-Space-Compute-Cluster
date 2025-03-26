interface Cubesat {
    id: number;
    drone_id: number;
    name: string;
    active: boolean;
    x: number;
    y: number;
    z: number;
    sun_location: string;
    health: number;
    temperature: number;
    voltage: number;
    current: number;
    battery: number;
}

interface Message {
    message: string
}