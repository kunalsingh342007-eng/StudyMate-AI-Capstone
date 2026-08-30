import { createExpressApp } from '../server/app.js';
import dotenv from 'dotenv';

dotenv.config();

const app = createExpressApp();

export default app;
