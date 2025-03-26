import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect, useContext, useReducer, useRef } from 'react';
import { WebsocketContext, WebsocketProvider } from './WebsocketProvider';
import { Cubesat} from "./components";
import './App.css';

function Main() {

	/* VARIABLES*/

	const ws = useContext(WebsocketContext);

	const [, forceUpdate] = useReducer((x) => x + 1, 0);

	const [cubesats, setCubesats] = useState<Cubesat[]>([]);
	const [waiting, setWaiting] = useState<boolean>(false);
	const [popupVisible, setPopupVisible] = useState<boolean>(false)

	const nameRef = useRef<HTMLInputElement>(null);
	const idRef = useRef<HTMLInputElement>(null);
	
	/* FUNCTIONS */

	const sendWSRequest = (message: string, params?: {}) => {
		setWaiting(true);
		if (params) {
			ws.send(JSON.stringify({type: 'request', message: message, params: params}));
		} else {
			ws.send(JSON.stringify({type: 'request', message: message}));
		}
	}

	/* USE EFFECTS */

	useEffect(() => {
		const interval = setInterval(() => {
			if(!waiting) sendWSRequest('getAll');
		}, 2000)

		if (ws.ready) {
			//ws.send(JSON.stringify({type: 'ping', message: 'Hello, server!'}));
			sendWSRequest('getAll');

			// autoscan
		}

		return () => clearInterval(interval);
	}, [ws.ready]);

	useEffect(() => {
		if (waiting && ws.value) {
			setWaiting(false);
			const response = JSON.parse(ws.value!);

			if(response.message === "All Cubesats returned successfully") {
				setCubesats(response.data);
			} else if (response.type === "failure") {
				console.log("Request Failure: " + response.message)
			} else {
				sendWSRequest('getAll');
			}
			
		}
	}, [ws.value]);

	/* EVENT HANDLERS */

	const addButtonHandler = (event: React.MouseEvent<HTMLButtonElement>) => {
		setPopupVisible(!popupVisible)
	}

	/* const updateButtonHandler = (event: React.MouseEvent<HTMLButtonElement>) => {
		const parameters = {
			id: 0,
			active: true,
			x: Math.floor(Math.random() * (100 - 1 + 1)) + 1
		}
		sendWSRequest('update', parameters);
	} */

	const activeButtonHandler = (event: React.MouseEvent<HTMLButtonElement>) => {
		// Deactive all cubesats and re-ping
		// NOTE: Is not able to add new, undetected cubesats
		cubesats.map((cubesat) => {
			const parameters = { drone_id: cubesat.drone_id, active: false };
			sendWSRequest('update', parameters);

			const message = JSON.stringify({ message: 'ping', params: { 'id': cubesat.drone_id }});
			sendWSRequest('send', message);
		})
	}

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();

		const id = idRef.current?.value;
		const name = nameRef.current?.value;

		sendWSRequest('add', {
			drone_id: id,
			name: name,
			active: false
		});

		if (nameRef.current) nameRef.current.value = "";
  		if (idRef.current) idRef.current.value = "";

		setPopupVisible(!popupVisible)
	}

	const removeCubesat = (drone_id: number) => {
		sendWSRequest('remove', { drone_id: drone_id })
	};

	/* CONTENT */

	return (
		<div>
			<div className='navbar'>
				<div className="buttons">
					<button onClick={addButtonHandler} className="addCubesat">
						Add Cubesat
					</button>
					{/* <button onClick={updateButtonHandler} className="updateCubesat">
						Update Cubesat
					</button> */}
					<button onClick={activeButtonHandler} className="findActive">
						Find Active
					</button>
				</div>
			</div>
			<div className="cubesats">
				{cubesats.map((cubesat, index) => {
					return (<Cubesat key={cubesat.drone_id} onDelete={removeCubesat} {...cubesat}/>);
				})}
			</div>
			<div className="addCubesatPopup" style={{ display: popupVisible ? "block": "none" }}>
				<button onClick={addButtonHandler}>Close</button>
				<form onSubmit={handleSubmit}>
					<div>
						<label>Id:</label>
						<input type="text" ref={idRef} required/>
					</div>
					<div>
						<label>Name:</label>
						<input type="text" ref={nameRef} required/>
					</div>
					<button type="submit">Submit</button>
				</form>
			</div>
		</div>
	);
}

export default function App() {
	return (
		<Router>
		<Routes>
			<Route path="/" element={
			<WebsocketProvider>
				<Main />
			</WebsocketProvider>
			} />
		</Routes>
		</Router>
	);
}
