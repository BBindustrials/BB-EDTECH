import express from 'express';
import cors from 'cors';
import iddRoutes from './routes/idd.routes.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/idd', iddRoutes);

export default app;
