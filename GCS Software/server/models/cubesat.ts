
import { DataTypes } from "sequelize";
import db from "../config/dbConfig";

const Cubesat = db.define("cubesat", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    drone_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
    },
    x: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    y: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    z: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    sun_location: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    health: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    temperature: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    voltage: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    current: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    battery: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
});

export default Cubesat;