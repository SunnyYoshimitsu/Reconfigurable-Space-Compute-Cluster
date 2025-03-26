import { createContext, ReactNode, useEffect, useRef, useState } from "react";

interface ContextType {
    ready: boolean;
    value: string | null;
    send: (name: string) => void;
}

export const WebsocketContext = createContext<ContextType>({ready: false,
                                                            value: null,
                                                            send: () => {}});

const URL = 'ws://127.0.0.1:8080'

interface Props {
    children?: ReactNode
}

export const WebsocketProvider = ({children} : Props ) => {
    const [isReady, setIsReady] = useState(false);
    const [val, setVal] = useState(null);
    const [tick, setTick] = useState(0);

    const ws = useRef<WebSocket | null>(null);
    const send = ws.current ? ws.current.send.bind(ws.current) : () => {};

    useEffect(() => {
        const socket = new WebSocket(URL);

        socket.onopen = () => setIsReady(true);
        socket.onclose = () => setIsReady(false);
        socket.onmessage = (event) => {
            setVal(event.data);
            setTick(tick+1);
        };

        ws.current = socket;

        return () => {
            socket.close();
        }
    }, [])

    const ret = {
        ready: isReady,
        value: val,
        send: send
    };
    
    return (
        <WebsocketContext.Provider value={ret}>
          {children}
        </WebsocketContext.Provider>
    );
}