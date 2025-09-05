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
import profileRouter from './routes/profile';

const app = express();

// Dynamic CORS configuration
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: FRONTEND_URL, // Use environment variable instead of hardcoded URL
  credentials: true, // Important for cookies/sessions
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Session middleware (required for Passport)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // Use NODE_ENV from .env file
    httpOnly: true,
    sameSite: 'none', // Use 'none' only in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
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
app.use('/api/profile', profileRouter);

// Root route - shows backend is running
app.get('/', (req, res) => {
  res.json({
    message: 'Inventory Management Backend is running!',
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/auth',
      inventories: '/api/inventories',
      items: '/api/item',
      users: '/api/users'
    }
  });
});

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