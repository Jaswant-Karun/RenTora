"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDBStatus = exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rentora';
    try {
        mongoose_1.default.set('strictQuery', false);
        const conn = await mongoose_1.default.connect(uri, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log(`[RENTORA MongoDB] Connected successfully: ${conn.connection.host}`);
        return true;
    }
    catch (error) {
        console.error(`[RENTORA MongoDB Connection Error]: ${error.message}`);
        console.warn(`[RENTORA Info] Please make sure MongoDB is running locally or specify a valid MONGODB_URI in server/.env`);
        return false;
    }
};
exports.connectDB = connectDB;
const getDBStatus = () => {
    const state = mongoose_1.default.connection.readyState;
    const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
    };
    return {
        state: states[state] || 'unknown',
        readyState: state,
        host: mongoose_1.default.connection.host || null,
        name: mongoose_1.default.connection.name || null,
    };
};
exports.getDBStatus = getDBStatus;
