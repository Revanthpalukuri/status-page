# Status Page Application

A full-stack status page application built with Node.js, Express, PostgreSQL, React, and Socket.io. Similar to StatusPage, Cachet, BetterStack, or OpenStatus - allows organizations to create beautiful status pages to communicate service availability and incidents to their users.

## 🎯 Features

### 🏢 **Multi-tenant Organizations**
- **Organization Creation** - Admin users can create new organizations with unique slugs
- **Access Control** - 7-digit access codes for team members to join organizations
- **Role-based Permissions** - Admin and member roles with different access levels
- **Multi-organization Support** - Users can be members of multiple organizations

### ⚙️ **Advanced Service Management**
- **CRUD Operations** - Create, read, update, delete services with descriptions and URLs
- **Real-time Status Updates** - Live status changes across all connected clients
- **Service Status Types** - Operational, Degraded Performance, Partial Outage, Major Outage, Under Maintenance
- **Uptime Tracking** - Manual uptime percentage management with average calculations
- **Service Ordering** - Drag-and-drop reordering of services
- **Status Change Logging** - Complete audit trail of all status changes

### 📊 **Incident & Maintenance Management**  
- **Incident Creation** - Create incidents with severity levels (Minor, Major, Critical)
- **Maintenance Scheduling** - Schedule planned maintenance with time windows
- **Incident Updates** - Post updates throughout incident lifecycle
- **Service Association** - Link incidents to affected services
- **Timeline Tracking** - Complete incident history and resolution tracking

### 📈 **Comprehensive Timeline & Analytics**
- **Unified Timeline** - Combined view of incidents and service status changes
- **Filter Options** - Filter by incidents, maintenance, or service changes
- **Search Functionality** - Search through all timeline events
- **Status Overview** - Dashboard with key metrics and average uptime
- **Real-time Charts** - Live service status visualization

### 👥 **Team Collaboration**
- **Organization Joining** - Non-admin users can join organizations via access codes
- **Member Management** - View team members and their roles
- **Permission Control** - Role-based access to features and data

### 🔄 **Real-time Features**
- **WebSocket Integration** - Live updates without page refresh
- **Status Propagation** - Instant status changes across all clients
- **Notification System** - Toast notifications for all actions
- **Live Dashboard** - Real-time metrics and status updates

### 🌐 **Public Status Pages**
- **Custom Status Pages** - Branded status pages for each organization
- **Mobile Responsive** - Optimized for all device sizes
- **Public Incident Display** - Show active incidents and maintenance
- **Service Uptime Display** - Public uptime percentages and status

### 🔐 **Security & Authentication**
- **JWT Authentication** - Secure token-based authentication system
- **Password Security** - bcrypt password hashing
- **CORS Protection** - Configured cross-origin resource sharing
- **Rate Limiting Removed** - Unrestricted API access for better user experience
- **Input Validation** - Joi-based request validation

### 🎨 **Modern User Experience**
- **Clean Interface** - Minimalistic design inspired by Linear
- **Intuitive Navigation** - Easy-to-use dashboard and forms
- **Save-to-Update** - Deliberate uptime percentage changes with save button
- **Error Handling** - Comprehensive error handling with user-friendly messages
- **Loading States** - Smooth loading indicators and skeleton screens

## 🔧 Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** with Sequelize ORM
- **Socket.io** for real-time updates
- **JWT** for authentication
- **Joi** for validation
- **bcryptjs** for password hashing

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API calls
- **Socket.io Client** for real-time updates
- **React Hook Form** for form management
- **React Hot Toast** for notifications

## 📦 Project Structure

```
status-page-app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts (Auth, Socket)
│   │   ├── pages/          # Page components
│   │   ├── utils/          # Utility functions and API
│   │   └── main.jsx        # App entry point
│   ├── public/
│   └── package.json
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── database/       # Database configuration and migrations
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Sequelize models
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Utility functions
│   │   └── index.js        # Server entry point
│   └── package.json
├── package.json            # Root package.json for scripts
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL (v13+ recommended)
- npm or yarn

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd status-page-app

# Install all dependencies
npm run install:all
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb plivo-assignment

# Or using psql
psql -c "CREATE DATABASE \"plivo-assignment\";"

# Or use the automated script
npm run server:create-db
```

### 3. Environment Configuration

Create `.env` file in the `server` directory (rename from `config.env`):

```bash
cp server/config.env server/.env
```

Edit `server/.env` with your configuration:

```env
# Database Configuration
DATABASE_URL=******
DB_HOST=******
DB_PORT=****
DB_NAME=plivo-assignment
DB_USER=postgres
DB_PASSWORD=****

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-plivo-assignment-2024
JWT_EXPIRY=7d

# Server Configuration
PORT=5001
NODE_ENV=development

# Client URL (for CORS)
CLIENT_URL=http://localhost:5173

# Email Configuration (optional - for invitations)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourstatuspage.com
```

For the **frontend**, create `.env` file in the `client` directory:

```env
# API URL for frontend to connect to backend
VITE_API_URL=http://localhost:5001
```

### 4. Database Migration and Seeding

```bash
# Run database migrations
npm run server:migrate

# Seed with demo data (optional)
npm run server:seed
```

### 5. Start Development Servers

```bash
# Start both frontend and backend
npm run dev
```

Or start them separately:

```bash
# Backend only (runs on port 5001)
npm run server:dev

# Frontend only (runs on port 5173)
npm run client:dev
```

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/me` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/refresh` - Refresh JWT token

### Organization Endpoints

- `GET /api/organizations` - Get user's organizations
- `POST /api/organizations` - Create organization (admin only)
- `POST /api/organizations/join` - Join organization with access code
- `GET /api/organizations/:id` - Get organization details
- `PUT /api/organizations/:id` - Update organization
- `DELETE /api/organizations/:id` - Delete organization
- `GET /api/organizations/:id/members` - Get organization members
- `POST /api/organizations/:id/members` - Invite member
- `PUT /api/organizations/:orgId/members/:memberId` - Update member role
- `DELETE /api/organizations/:orgId/members/:memberId` - Remove member

### Service Endpoints

- `GET /api/services/organization/:orgId` - Get organization services
- `POST /api/services/organization/:orgId` - Create service
- `GET /api/services/:id` - Get service details
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service
- `PATCH /api/services/:id/status` - Update service status
- `PATCH /api/services/:id/uptime` - Update service uptime percentage
- `PUT /api/services/organization/:orgId/reorder` - Reorder services

### Incident Endpoints

- `GET /api/incidents/organization/:orgId` - Get organization incidents
- `POST /api/incidents/organization/:orgId` - Create incident
- `GET /api/incidents/:id` - Get incident details
- `PUT /api/incidents/:id` - Update incident
- `DELETE /api/incidents/:id` - Delete incident
- `POST /api/incidents/:id/updates` - Create incident update
- `GET /api/incidents/:id/updates` - Get incident updates
- `GET /api/incidents/organization/:orgId/timeline` - Get combined timeline of incidents and service changes

### Public Endpoints

- `GET /api/public/status/:slug` - Get public status page
- `GET /api/public/status/:slug/incidents` - Get public incidents
- `GET /api/public/status/:slug/incidents/:id` - Get public incident details
- `GET /api/public/status/:slug/summary` - Get status page summary

## 🔐 Authentication

The application uses JWT (JSON Web Tokens) for authentication:

1. Users register/login to receive a JWT token
2. Token is stored in localStorage and included in API requests
3. Backend validates token on protected routes
4. Token expires after configured time (default: 7 days)

## 🌐 WebSocket Events

Real-time updates are handled via Socket.io:

### Client Events
- `join-organization` - Join organization room for updates
- `leave-organization` - Leave organization room
- `join-status-page` - Join public status page room
- `leave-status-page` - Leave public status page room

### Server Events
- `service-updated` - Service status changed
- `incident-created` - New incident created
- `incident-updated` - Incident updated
- `status-changed` - Overall system status changed

## 🎨 Service Status Types

- **Operational** (Green) - Service is working normally
- **Degraded Performance** (Yellow) - Service is slower than usual
- **Partial Outage** (Orange) - Some functionality is unavailable
- **Major Outage** (Red) - Service is completely down
- **Under Maintenance** (Blue) - Planned maintenance in progress

## 📱 Demo Data

After running the seed script, you can use these credentials:

### Admin User
- **Email**: admin@example.com
- **Password**: password123

### Demo Organization
- **Name**: Demo Company
- **Slug**: demo-company
- **Access Code**: 1234567

### Testing Organization Joining
Non-admin users can join the demo organization using:
- **Organization Slug**: demo-company  
- **Access Code**: 1234567

## 🆕 Recent Features & Updates

### ✅ **Latest Improvements (December 2024)**

1. **Enhanced Uptime Management**
   - Input + Save button mechanism for uptime percentage updates
   - Validation between 1-100% range
   - Average uptime calculation with error handling

2. **Comprehensive Timeline System**  
   - Combined incidents and service status changes
   - Service change logging with audit trail
   - Filter options: All Types, Incidents, Maintenance, Service Changes
   - Real-time timeline updates across all clients

3. **Improved User Experience**
   - Removed rate limiting for unrestricted API access
   - Clean UI without public view buttons
   - Better error handling and validation
   - Seamless status change tracking

4. **Admin & Access Control**
   - Organization creation restricted to admin users only
   - 7-digit access codes for team joining
   - Automatic access code generation for existing organizations
   - Duplicate organization prevention in dashboard

## 🚀 Production Deployment

### Vercel Deployment (Recommended)

This application is optimized for deployment on Vercel with separate frontend and backend deployments.

#### Backend Deployment (Server)

1. **Deploy the `/server` folder** as a Vercel project
2. **Set Environment Variables** in Vercel dashboard:

```env
# Database Configuration (Required)
DATABASE_URL=postgresql://username:password@host:port/database_name
DB_HOST=your-postgres-host
DB_PORT=5432
DB_NAME=your-database-name
DB_USER=your-database-username
DB_PASSWORD=your-database-password

# JWT Configuration (Required)
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRY=7d

# Server Configuration (Required)
PORT=5001
NODE_ENV=production

# Client URL for CORS (Required)
CLIENT_URL=https://your-frontend-domain.vercel.app

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourstatuspage.com
```

#### Frontend Deployment (Client)

1. **Deploy the `/client` folder** as a Vercel project
2. **Set Environment Variables**:

```env
# API URL for frontend to connect to backend
VITE_API_URL=https://your-backend-domain.vercel.app
```

### Database Setup

For production, use a managed PostgreSQL service:

- **Vercel Postgres** (Recommended for Vercel deployments)
- **Supabase** (Free tier available)
- **PlanetScale** (MySQL alternative)
- **Railway** (PostgreSQL with free tier)
- **AWS RDS** (Enterprise solution)

After setting up your database:

```bash
# Run migrations on production database
npm run server:migrate

# Optionally seed with demo data
npm run server:seed
```

### Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm run install:all

# Copy source code
COPY . .

# Build frontend
RUN npm run client:build

# Expose port
EXPOSE 5000

# Start server
CMD ["npm", "run", "server:start"]
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # API requests
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # Static files
    location / {
        root /app/client/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

## 🛠 Development

### Code Style

The project uses:
- ESLint for linting
- Prettier for code formatting (recommended)
- Tailwind CSS for consistent styling

### Database Migrations

```bash
# Create new migration
npm run server:migrate

# Seed development data
npm run server:seed
```

### Adding New Features

1. **Backend**: Add routes in `server/src/routes/`
2. **Frontend**: Add components in `client/src/components/`
3. **Models**: Add Sequelize models in `server/src/models/`
4. **API**: Update API functions in `client/src/utils/api.js`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check PostgreSQL is running
   - Verify database credentials in `.env`
   - Ensure database exists

2. **Port Already in Use**
   - Change PORT in `.env` file (default: 5001 for backend)
   - Kill process using the port: `lsof -ti:5001 | xargs kill`

3. **WebSocket Connection Issues**
   - Check CORS configuration
   - Verify CLIENT_URL in server `.env`

4. **Build Errors**
   - Clear node_modules: `rm -rf node_modules package-lock.json`
   - Reinstall dependencies: `npm install`

## 📞 Support

If you encounter any issues or have questions, please:
1. Check the troubleshooting section
2. Search existing issues on GitHub
3. Create a new issue with detailed information

---

Built with ❤️ using Node.js, React, and PostgreSQL
