"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const dbConfig_1 = __importDefault(require("../config/dbConfig"));
const Cubesat = dbConfig_1.default.define("cubesat", {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    drone_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    active: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: true,
    },
    x: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: true,
    },
    y: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: true,
    },
    z: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: true,
    },
    sun_location: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    health: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: true,
    },
    temperature: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: true,
    },
    voltage: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: true,
    },
    current: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: true,
    },
    battery: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: true,
    },
});
exports.default = Cubesat;
