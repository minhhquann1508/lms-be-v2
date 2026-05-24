import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

export const instance = axios.create({
  baseURL: process.env.BUNNY_API_URL,
  headers: {
    AccessKey: process.env.BUNNY_API_KEY,
  },
});
