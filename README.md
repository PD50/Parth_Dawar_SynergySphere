# Motion-GPT

A collaborative platform for motion projects with GPT integration. Created for Odoo X NMIT Hackathon.

## Features

- Real-time collaboration on motion projects
- Google OAuth2 authentication
- Socket.IO for real-time updates
- Project management with tasks
- Chat functionality within projects

## Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- Socket.IO client
- React Router

### Backend
- Node.js
- Express
- MongoDB with Mongoose
- Socket.IO
- Passport.js with Google OAuth2
- JWT authentication

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- MongoDB instance (local or Atlas)
- Google Developer account for OAuth2

### Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   PORT=5000
   CLIENT_URL=http://localhost:5173
   ```

4. Create a `.env` file in the frontend directory:
   ```
   VITE_API_URL=http://localhost:5000
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   ```

### Development

To run both frontend and backend concurrently:
```
npm run dev
```

To run frontend only:
```
npm run dev:frontend
```

To run backend only:
```
npm run dev:backend
```

## Project Structure

```
motion-gpt/
├── frontend/           # React application
│   ├── public/         # Static assets
│   └── src/
│       ├── components/ # Reusable UI components
│       ├── pages/      # Page components
│       ├── context/    # React context providers
│       ├── hooks/      # Custom React hooks
│       ├── services/   # API services
│       └── utils/      # Utility functions
│
├── backend/            # Node.js server
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Express middleware
│   ├── models/         # Mongoose models
│   ├── routes/         # Express routes
│   ├── services/       # Business logic
│   └── utils/          # Utility functions
│
└── README.md           # Project documentation
```

## License

MIT