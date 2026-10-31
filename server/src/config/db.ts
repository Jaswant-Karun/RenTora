import mongoose from 'mongoose';

export const connectDB = async (): Promise<boolean> => {
  const rawUri =
    process.env.MONGO_DB ||
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.DATABASE_URL;

  const uri = rawUri ? rawUri.trim() : 'mongodb://127.0.0.1:27017/rentora';
  const dbName = process.env.DB_NAME || 'rentora';

  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      dbName,
    });
    console.log(`[RENTORA MongoDB] Connected successfully to host: ${conn.connection.host} (DB: ${conn.connection.name})`);
    return true;
  } catch (error: any) {
    console.error(`[RENTORA MongoDB Connection Error]: ${error.message}`);
    console.warn(`[RENTORA Info] Please make sure MongoDB is running locally or specify valid MONGO_DB / MONGODB_URI in environment variables.`);
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
