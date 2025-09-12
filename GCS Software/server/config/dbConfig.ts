import { Sequelize, DataTypes } from "sequelize";
import Cubesat from "../models/cubesat";
import 'dotenv/config';

const db = new Sequelize(
    process.env.MYSQL_DATABASE!,
    process.env.MYSQL_USER!,
    process.env.MYSQL_PASSWORD!,
    {
        host: process.env.MYSQL_HOST,
        dialect: 'mysql'
    }
);

export default db;
