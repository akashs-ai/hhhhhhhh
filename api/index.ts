import { createExpressApp } from '../server/app.js';

// Vercel Serverless Function entry point exporting the existing Express application
const app = createExpressApp();

export default app;
