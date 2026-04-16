import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { authRouter }  from './routes/auth';
import { adminRouter } from './routes/admin';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth',  authRouter);
app.use('/api/admin', adminRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on :${PORT}`));
