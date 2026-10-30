import mongoose from 'mongoose';

export const connectDB = async (): Promise<boolean> => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rentora';
  
  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[RENTORA MongoDB] Connected successfully: ${conn.connection.host}`);
    return true;
  } catch (error: any) {
    console.error(`[RENTORA MongoDB Connection Error]: ${error.message}`);
    console.warn(`[RENTORA Info] Please make sure MongoDB is running locally or specify a valid MONGODB_URI in server/.env`);
    return false;
  }
};

export const getDBStatus = () => {
  const state = mongoose.connection.readyState;
  const states: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return {
    state: states[state] || 'unknown',
    readyState: state,
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
  };
};
