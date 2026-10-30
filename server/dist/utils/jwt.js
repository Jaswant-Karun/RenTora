"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.signToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const signToken = (payload) => {
    const secret = process.env.JWT_SECRET || 'rentora_dev_jwt_secret_token_key_778899_xyz';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn: expiresIn });
};
exports.signToken = signToken;
const verifyToken = (token) => {
    const secret = process.env.JWT_SECRET || 'rentora_dev_jwt_secret_token_key_778899_xyz';
    return jsonwebtoken_1.default.verify(token, secret);
};
exports.verifyToken = verifyToken;
