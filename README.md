# Inventory Management System

A comprehensive full-stack inventory management application built with React, Express, TypeScript, and PostgreSQL. This system provides advanced inventory tracking, user management, and collaboration features with a modern, responsive interface.

## 🚀 Features

### 🔐 Authentication & Authorization
- **OAuth Integration**: Google and GitHub social authentication
- **JWT-based Authentication**: Secure token-based session management
- **Role-based Access Control**: Admin and regular user roles
- **Admin God-level Access**: Admins can view, edit, and delete any inventory

### 📦 Inventory Management
- **Custom Inventory IDs**: Configurable ID formats with multiple part types:
  - FIXED: Static text parts
  - RANDOM (6/9/20/32): Random alphanumeric strings
  - GUID: UUID format
  - DATE: Configurable date formats
  - SEQUENCE: Auto-incrementing numbers with padding
- **Public/Private Inventories**: Control visibility and access
- **Categories**: Organize inventories by categories
- **Tags System**: Tag inventories for better organization
- **Markdown Support**: Rich text descriptions with markdown formatting
- **Image Storage**: Cloud-based image storage with Cloudinary
- **Optimistic Locking**: Prevent concurrent editing conflicts

### 🔍 Advanced Search
- **Full-text Search**: Search across inventories, items, and custom fields
- **Global Search**: Real-time search with dropdown results
- **Search Highlighting**: Visual highlighting of search terms
- **Keyboard Navigation**: Ctrl+/ to focus, arrow keys, Enter, Escape
- **Multi-entity Search**: Search inventories, items, and custom field values

### 👥 User Management & Access Control
- **User Profiles**: Comprehensive user profile management
- **Access Permissions**: Grant read/write access to specific users
- **Inventory Sharing**: Share inventories with controlled permissions
- **Admin Dashboard**: Complete user and inventory oversight
- **Blocked Users**: Admin ability to block/unblock users

### 📋 Custom Fields & Items
- **Flexible Field Types**: Support for multiple field types:
  - STRING: Single-line text
  - TEXT: Multi-line text
  - NUMBER: Numeric values
  - DATE: Date fields
  - BOOLEAN: True/false checkboxes
  - SELECT: Dropdown selections
  - LINK: URLs and file links
- **Field Validation**: Custom validation rules for each field type
- **Item Management**: Add, edit, delete items with custom field values
- **Like System**: Users can like items
- **Comments**: Real-time commenting on inventories and items

### 🎨 User Interface
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Modern UI Components**: Clean, intuitive interface
- **Tabbed Navigation**: Organized content with tab-based layouts
- **Real-time Updates**: Live updates for comments and interactions
- **Loading States**: Proper loading indicators and error handling
- **Accessibility**: Keyboard navigation and screen reader support

### 🔧 Technical Features
- **TypeScript**: Full type safety across frontend and backend
- **Prisma ORM**: Type-safe database operations
- **React Query**: Efficient data fetching and caching
- **Socket.IO**: Real-time communication capabilities
- **Rate Limiting**: API protection against abuse
- **CORS Configuration**: Secure cross-origin resource sharing
- **Input Validation**: Comprehensive input sanitization and validation

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Query** for state management and caching
- **React Hook Form** with Yup validation
- **Axios** for API communication
- **Lucide React** and **Heroicons** for icons

### Backend
- **Node.js** with **Express**
- **TypeScript** for type safety
- **Prisma** ORM with PostgreSQL
- **Passport.js** for OAuth authentication
- **JWT** for session management
- **Socket.IO** for real-time features
- **Cloudinary** for image storage
- **Helmet** for security headers
- **Morgan** for logging

### Database
- **PostgreSQL** with comprehensive schema
- **Prisma** migrations for schema management
- **Optimistic locking** for concurrent access control

## 📁 Project Structure

```
inventory-management/
├── backend/                 # Express.js backend
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API route handlers
│   │   └── server.ts       # Main server file
│   ├── prisma/
│   │   ├── migrations/     # Database migrations
│   │   └── schema.prisma   # Database schema
│   └── package.json
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   └── main.tsx        # Main entry point
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or higher
- PostgreSQL database
- Google OAuth credentials (optional)
- GitHub OAuth credentials (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd inventory-management
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

4. **Environment Configuration**

   Create `.env` file in the backend directory:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/inventory_db"
   JWT_SECRET="your-jwt-secret"
   SESSION_SECRET="your-session-secret"
   NODE_ENV="development"
   FRONTEND_URL="http://localhost:3000"
   BACKEND_URL="http://localhost:4000"
   
   # OAuth Credentials (optional)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   GITHUB_CLIENT_ID="your-github-client-id"
   GITHUB_CLIENT_SECRET="your-github-client-secret"
   
   # Cloudinary (for image storage)
   CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"
   ```

   Create `.env` file in the frontend directory:
   ```env
   VITE_API_URL="http://localhost:4000/api"
   VITE_BACKEND_URL="http://localhost:4000"
   ```

5. **Database Setup**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma generate
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000

## 📚 API Documentation

### Authentication Endpoints
- `GET /auth/google` - Google OAuth login
- `GET /auth/github` - GitHub OAuth login
- `GET /auth/logout` - Logout user
- `GET /auth/me` - Get current user info

### Inventory Endpoints
- `GET /api/inventories` - Get all accessible inventories
- `GET /api/inventories/my` - Get user's own inventories
- `POST /api/inventories` - Create new inventory
- `PUT /api/inventories/:id` - Update inventory
- `DELETE /api/inventories/:id` - Delete inventory

### Item Endpoints
- `GET /api/inventories/:id/items` - Get inventory items
- `POST /api/inventories/:id/items` - Create new item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

### Search Endpoints
- `GET /api/search` - Global search across all entities

### Admin Endpoints
- `GET /api/admin/users` - Get all users (admin only)
- `GET /api/inventories/admin/all` - Get all inventories (admin only)

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Protection against API abuse
- **Input Validation**: Comprehensive input sanitization
- **CORS Configuration**: Secure cross-origin requests
- **Helmet Security**: Security headers for Express
- **Password Hashing**: Secure password storage with bcrypt
- **SQL Injection Protection**: Prisma ORM prevents SQL injection

## 🎯 Course Requirements Status

This project fulfills the following course requirements:

- ✅ **Custom inventory numbers/IDs** - Configurable format system
- ✅ **Custom fields** - Up to 6 field types supported
- ✅ **Social authentication** - Google and GitHub OAuth
- ✅ **Full-text search** - Advanced search across all entities
- ✅ **Admin functionality** - Complete admin dashboard
- ✅ **Access control** - Public/private inventories with permissions
- ✅ **Real-time features** - Socket.IO integration for comments
- ✅ **Optimistic locking** - Concurrent editing protection
- ✅ **Responsive design** - Tailwind CSS framework
- ✅ **Cloud image storage** - Cloudinary integration
- ✅ **Markdown support** - Rich text descriptions
- ✅ **Tag system** - Inventory tagging and organization
- ✅ **Like system** - Item liking functionality

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built as a course project for inventory management system requirements
- Uses modern web development best practices
- Implements comprehensive security and access control features
