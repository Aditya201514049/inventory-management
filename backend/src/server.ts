import express from 'express';
import cors from 'cors';
import { prisma } from './db';
import inventoryRouter from './routes/inventory';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/inventories', inventoryRouter);

// Example route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// TODO: Add more routes here

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});