"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const db_js_1 = require("../config/db.js");
const user_model_js_1 = require("../models/user.model.js");
dotenv_1.default.config();
const demoUsers = [
    {
        name: 'Arun Kumar',
        email: 'student@rentora.edu',
        password: 'Password123!',
        role: 'student',
        institution: 'National Institute of Technology',
        department: 'Computer Science & Engineering',
        phone: '+91 98765 43210',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        isVerified: true,
    },
    {
        name: 'Dr. Meera Raman',
        email: 'owner@rentora.edu',
        password: 'Password123!',
        role: 'owner',
        institution: 'National Institute of Technology',
        department: 'Robotics & Advanced Automation Lab',
        phone: '+91 98765 43211',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
        isVerified: true,
    },
    {
        name: 'Prof. Suresh Nair',
        email: 'manager@rentora.edu',
        password: 'Password123!',
        role: 'manager',
        institution: 'National Institute of Technology',
        department: 'Dean of Academic Infrastructure',
        phone: '+91 98765 43212',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
        isVerified: true,
    },
    {
        name: 'Jaswant Karun (Lead Admin)',
        email: 'admin@rentora.edu',
        password: 'Password123!',
        role: 'admin',
        institution: 'RENTORA Central Network',
        department: 'Platform Administration & Governance',
        phone: '+91 98765 43213',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
        isVerified: true,
    },
];
const seedDatabase = async () => {
    try {
        const isConnected = await (0, db_js_1.connectDB)();
        if (!isConnected) {
            console.error('[Seed Error] Could not connect to database. Aborting seed.');
            process.exit(1);
        }
        console.log('[Seed] Clearing existing demo users...');
        await user_model_js_1.User.deleteMany({
            email: { $in: demoUsers.map((u) => u.email) },
        });
        console.log('[Seed] Creating demo role accounts...');
        for (const userData of demoUsers) {
            const user = new user_model_js_1.User(userData);
            await user.save();
            console.log(` -> Created ${userData.role.toUpperCase()} account: ${userData.email}`);
        }
        console.log('\n✅ Demo users seeded successfully!');
        console.log('-----------------------------------------------------');
        demoUsers.forEach((u) => {
            console.log(`Role: ${u.role.padEnd(8)} | Email: ${u.email.padEnd(22)} | Pass: ${u.password}`);
        });
        console.log('-----------------------------------------------------');
        await mongoose_1.default.connection.close();
        process.exit(0);
    }
    catch (error) {
        console.error('[Seed Error] Failed to seed database:', error);
        process.exit(1);
    }
};
exports.seedDatabase = seedDatabase;
// If run directly
if (process.argv[1]?.includes('seed')) {
    (0, exports.seedDatabase)();
}
