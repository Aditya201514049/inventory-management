import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import './config/passport'; // Ensure passport strategies are loaded
import inventoryRouter from './routes/inventory';
// import userRouter from './routes/user'; // Add as you create more routers

const app = express();
app.use(cors());
app.use(express.json());

// Session middleware (required for Passport)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_secret',
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

// API routes
app.use('/api/inventories', inventoryRouter);
// app.use('/api/users', userRouter); // Add more as needed

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Example protected route
app.get('/api/protected', (req, res) => {
  if ((req as any).isAuthenticated && (req as any).isAuthenticated()) {
    res.json({ message: 'You are authenticated!' });
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});