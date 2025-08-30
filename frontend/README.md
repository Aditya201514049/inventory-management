# Inventory Management Frontend

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## Key Dependencies Explained

### Core React & Routing
- **React 18** - UI library
- **React Router DOM** - Client-side routing
- **TypeScript** - Type safety

### State Management & Data Fetching
- **@tanstack/react-query** - Server state management and caching
- **Axios** - HTTP client for API calls

### Forms & Validation
- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **@hookform/resolvers** - Form validation integration

### UI Components & Styling
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **React Beautiful DnD** - Drag and drop functionality
- **React Dropzone** - File upload handling

### Utilities
- **React Markdown** - Markdown rendering
- **Date-fns** - Date manipulation
- **React Hot Toast** - Toast notifications
- **Clsx & Tailwind Merge** - Conditional CSS classes

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── hooks/         # Custom React hooks
├── services/      # API service functions
├── types/         # TypeScript type definitions
├── utils/         # Utility functions
└── styles/        # Global styles
```

## Development

The frontend is configured to proxy API calls to your backend at `http://localhost:4000`. Make sure your backend is running before starting the frontend.

## Features to Implement

Based on your backend, you'll need to build:

1. **Authentication Pages** - Login/Register with OAuth
2. **Dashboard** - User's personal page with inventories
3. **Inventory Management** - Create, edit, delete inventories
4. **Custom ID Configuration** - The drag-and-drop ID builder
5. **Field Management** - Add/edit/delete custom fields
6. **Item Management** - Add/edit/delete items
7. **Search & Filtering** - Full-text search across content
8. **Admin Panel** - User management and system administration



