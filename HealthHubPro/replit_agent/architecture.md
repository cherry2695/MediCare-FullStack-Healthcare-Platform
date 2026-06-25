# MediCare Assistant - Architecture Documentation

## Overview

MediCare Assistant is a full-stack web application designed to help users manage their medications, set reminders, and compare medication prices across different pharmacies. The application features a modern React frontend with a Node.js Express backend, using a PostgreSQL database for data persistence.

The system is built with a client-server architecture, where the frontend (client) is a single-page application (SPA) built with React, and the backend (server) is an Express.js application that provides RESTful API endpoints for data access and manipulation.

## System Architecture

### High-Level Architecture

The application follows a three-tier architecture:

1. **Presentation Layer (Frontend)**: React-based SPA using various UI components from shadcn/ui and Radix UI
2. **Application Layer (Backend)**: Express.js server that handles API requests, authentication, and business logic
3. **Data Layer**: PostgreSQL database managed through Drizzle ORM

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│              │       │              │       │              │
│    React     │◄─────►│   Express    │◄─────►│  PostgreSQL  │
│   Frontend   │       │   Backend    │       │   Database   │
│              │       │              │       │              │
└──────────────┘       └──────────────┘       └──────────────┘
```

### Frontend Architecture

The frontend is built with React and follows a component-based architecture. It uses:

- **React** for UI components and rendering
- **Wouter** for client-side routing
- **TanStack Query** (React Query) for server state management and data fetching
- **Tailwind CSS** for styling
- **Shadcn UI** and **Radix UI** for accessible UI components
- **React Hook Form** with **Zod** for form validation

### Backend Architecture

The backend is built with Express.js and follows a RESTful API design. It includes:

- **Express.js** for HTTP server and middleware
- **API Routes** for handling client requests
- **Authentication** middleware for protecting routes
- **WebSocket** support for real-time notifications
- **Database abstraction** through a storage interface

### Database Architecture

The application uses PostgreSQL as its database, with:

- **Drizzle ORM** for database schema management and queries
- **Schema definitions** for users, prescriptions, and price comparisons
- **Zod schemas** for validation that mirror database schemas

## Key Components

### Frontend Components

1. **Page Components**:
   - Dashboard: Main user interface showing medication reminders and summary
   - Prescriptions: Management of user prescriptions
   - PriceComparison: Tool for comparing medication prices
   - Profile: User profile management
   - Settings: Application settings

2. **UI Components**:
   - MedicationReminder: Handles medication reminders and alarms
   - PrescriptionForm: Form for adding and editing prescriptions
   - PrescriptionCard: Card display for prescription information
   - NotificationCenter: Manages and displays user notifications
   - ReminderAlert: Alert dialog for medication reminders
   - Header, Sidebar, and TopNavBar: Layout components

3. **Service Components**:
   - AudioManager: Handles alarm sounds and speech synthesis
   - AlarmManager: Manages medication alarm persistence
   - WebSocketService: Handles real-time notifications

### Backend Components

1. **API Routes**:
   - Authentication routes (login, register, logout)
   - User management routes
   - Prescription management routes
   - Price comparison routes

2. **Middleware**:
   - Authentication middleware
   - Error handling middleware
   - Logging middleware

3. **Storage Layer**:
   - Interface for database operations
   - Memory-based implementation for development/testing

### Database Schema

The database has three main tables:

1. **Users**: Stores user information including authentication details and preferences
   - id (PK)
   - username
   - email
   - password (hashed)
   - theme

2. **Prescriptions**: Stores medication prescription details
   - id (PK)
   - userId (FK to Users)
   - medicineName
   - dosageForm
   - quantity
   - units
   - reminderTime
   - frequency
   - isActive

3. **PriceComparisons**: Stores history of price comparisons made by users
   - id (PK)
   - userId (FK to Users)
   - medicineName
   - createdAt

## Data Flow

### Authentication Flow

1. User submits login/register credentials from the client
2. Backend validates credentials
3. If valid, a session is created and stored
4. Session ID is stored in cookies for subsequent requests
5. Protected routes check for valid session before processing requests

### Prescription Management Flow

1. User creates/edits a prescription through the UI
2. Client sends request to the appropriate API endpoint
3. Backend validates the data using Zod schemas
4. If valid, data is stored in the database
5. Response is sent back to the client
6. Client updates its state and UI based on the response

### Medication Reminder Flow

1. Client loads prescriptions from the server
2. Client schedules reminders based on prescription times
3. When a reminder is triggered:
   - Visual notification is displayed
   - Audio alert is played
   - Speech synthesis reads out the reminder
4. User can dismiss or snooze the reminder

### Price Comparison Flow

1. User searches for a medication
2. Client sends request to price comparison API
3. Backend returns price information from different pharmacies
4. Client displays the comparisons and allows sorting/filtering
5. User's search history is stored for future reference

## External Dependencies

### Frontend Dependencies

- **@tanstack/react-query**: Data fetching and server state management
- **@radix-ui/react-**: UI component primitives
- **@hookform/resolvers**: Form validation with Zod
- **class-variance-authority**: Component styling utility
- **clsx** and **tailwind-merge**: CSS class utilities
- **date-fns**: Date manipulation
- **framer-motion**: Animation library
- **wouter**: Lightweight router for React
- **zod**: Schema validation

### Backend Dependencies

- **express**: Web server framework
- **express-session**: Session management
- **bcrypt**: Password hashing (simulated in the repository with crypto)
- **drizzle-orm**: ORM for database operations
- **@neondatabase/serverless**: PostgreSQL client for serverless environments
- **ws**: WebSocket implementation

## Deployment Strategy

The application is configured for deployment on Replit, with additional configuration for scaling and production deployment.

### Development Environment

- **Vite** for development server and hot module replacement
- **Node.js** backend with TypeScript
- **PostgreSQL** database for development

### Production Environment

- **Build process**:
  - Vite builds the frontend into static assets
  - esbuild compiles the server code for production
- **Runtime**:
  - Node.js server serves static assets
  - Server handles API requests
  - Database connections are pooled for efficiency

### Deployment Configuration

- **Environment variables**:
  - NODE_ENV: Distinguishes between development and production
  - DATABASE_URL: Connection string for the PostgreSQL database
- **Ports**:
  - Development: Server runs on port 5000
  - Production: Server can be configured to run on any port, with 80 as the default external port

### Scaling Considerations

- **Stateless design**: The application follows a stateless design for easy horizontal scaling
- **Database**: The use of Neon's serverless PostgreSQL allows for elastic scaling
- **Asset delivery**: Static assets are pre-built for faster delivery

## Security Considerations

- **Password security**: Passwords are hashed before storage
- **Authentication**: Session-based authentication with secure cookies
- **Input validation**: All user inputs are validated using Zod schemas
- **HTTPS**: Production deployment should enforce HTTPS

## Development Practices

- **TypeScript**: Used throughout the codebase for type safety
- **Code organization**: Clear separation between client, server, and shared code
- **API design**: RESTful API design with clear endpoint semantics
- **Error handling**: Consistent error handling patterns across the application