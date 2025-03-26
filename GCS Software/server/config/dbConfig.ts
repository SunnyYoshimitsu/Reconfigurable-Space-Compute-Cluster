import { Sequelize, DataTypes } from "sequelize";
import Cubesat from "../models/cubesat";

const db = new Sequelize(
    process.env.DB_NAME!,
    process.env.DB_USER!,
    process.env.DB_PASSWORD!,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql'
    }
);
 
export default db;