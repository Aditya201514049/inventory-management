import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import './config/passport'; // Ensure passport strategies are loaded
import inventoryRouter from './routes/inventory';
import authRouter from './routes/auth';
import accessRouter from './routes/access';
import adminRouter from './routes/admin';
import categoryRouter from './routes/category';
import itemRouter from './routes/item';
import userRouter from './routes/user';
import fieldRouter from './routes/field';
// import userRouter from './routes/user'; // Add as you create more routers

const app = express();

// Dynamic CORS configuration
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true, // Important for sessions
}));
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
app.use('/auth', authRouter);
app.use('/api/inventories', inventoryRouter);
app.use('/api/access', accessRouter);
app.use('/api/admin', adminRouter);
app.use('/api/category', categoryRouter);
app.use('/api/item', itemRouter);
app.use('/api/users', userRouter); 
app.use('/api/fields', fieldRouter);

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

app.get('/profile', (req, res) => {
  if ((req as any).isAuthenticated && (req as any).isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});