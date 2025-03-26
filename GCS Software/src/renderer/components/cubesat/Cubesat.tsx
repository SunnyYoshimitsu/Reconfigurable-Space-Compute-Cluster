import React, { useState } from "react";
import './Cubesat.css';

interface CubesatProps extends Cubesat {
    onDelete: (id: number) => void;
}
    
const Cubesat: React.FC<CubesatProps> = (props) => {

    // edit name or id feature with input elements
    // get rid of created and make time since last updated

    const [popupVisible, setPopupVisible] = useState<boolean>(false)

    const handleDelete = (event: React.MouseEvent<HTMLButtonElement>) => {
        setPopupVisible(!popupVisible)
    }

    const handleConfirmDelete = (event: React.MouseEvent<HTMLButtonElement>) => {
        props.onDelete(props.drone_id);
        setPopupVisible(!popupVisible)
    }

    const ignoredProps = ["id", "drone_id", "active", "name", "createdAt", "updatedAt", "onDelete"];

    return (
        <div id={`${props.id}`} className="cubesat">
            <button className="delete" onClick={handleDelete}>X</button>

            <div className="description">
                <h1 className="title">{props.name}</h1>
                <p className="id">Id: {props.drone_id}</p>
                <img className="cubesatImage" src="/img/cubesat.png" alt="Cubesat" />
                <p className="attribute_text">
                    Active: {String(props.active)}
                </p>
            </div>

            <div className="attributesGrid">
                {Object.entries(props).filter(([key, _]) => !ignoredProps.includes(key))
                .map(([key, value]) => (
                    <div className="attribute" key={key}>
                        <p className="attribute_text">
                            {key}: {String(value)}
                        </p>
                    </div>
                ))}
            </div>
            <button className="removeCubesatPopup" onClick={handleConfirmDelete} style={{ display: popupVisible ? "block": "none" }}>Confirm Delete</button>
        </div>
    )
}

export default Cubesat;