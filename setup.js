#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🚀 Setting up Motion-GPT project...\n');

// Check if running in the root directory
if (!fs.existsSync('package.json') || !fs.existsSync('frontend') || !fs.existsSync('backend')) {
  console.error('❌ Error: This script should be run from the root of the Motion-GPT project.');
  process.exit(1);
}

// Prompt for MongoDB URI
rl.question('MongoDB URI (default: mongodb://localhost:27017/motion-gpt): ', (mongoUri) => {
  const MONGODB_URI = mongoUri || 'mongodb://localhost:27017/motion-gpt';
  
  // Prompt for JWT secret
  rl.question('JWT Secret (default: motion-gpt-secret-key-change-in-production): ', (jwtSecret) => {
    const JWT_SECRET = jwtSecret || 'motion-gpt-secret-key-change-in-production';
    
    // Prompt for Google Client ID
    rl.question('Google OAuth Client ID: ', (googleClientId) => {
      if (!googleClientId) {
        console.log('⚠️ Warning: Google OAuth Client ID is required for authentication.');
      }
      
      // Prompt for Google Client Secret
      rl.question('Google OAuth Client Secret: ', (googleClientSecret) => {
        if (!googleClientSecret && googleClientId) {
          console.log('⚠️ Warning: Google OAuth Client Secret is required for authentication.');
        }
        
        // Prompt for port
        rl.question('Backend Port (default: 5000): ', (port) => {
          const PORT = port || '5000';
          
          // Prompt for client URL
          rl.question('Client URL (default: http://localhost:5173): ', (clientUrl) => {
            const CLIENT_URL = clientUrl || 'http://localhost:5173';
            
            // Create backend .env file
            const backendEnv = `MONGODB_URI=${MONGODB_URI}
JWT_SECRET=${JWT_SECRET}
GOOGLE_CLIENT_ID=${googleClientId}
GOOGLE_CLIENT_SECRET=${googleClientSecret}
PORT=${PORT}
CLIENT_URL=${CLIENT_URL}
NODE_ENV=development
`;
            
            fs.writeFileSync(path.join('backend', '.env'), backendEnv);
            console.log('✅ Backend .env file created');
            
            // Create frontend .env file
            const frontendEnv = `VITE_API_URL=${CLIENT_URL.includes('localhost') ? `http://localhost:${PORT}` : CLIENT_URL}
VITE_GOOGLE_CLIENT_ID=${googleClientId}
`;
            
            fs.writeFileSync(path.join('frontend', '.env'), frontendEnv);
            console.log('✅ Frontend .env file created');
            
            // Install dependencies
            console.log('\n📦 Installing dependencies...');
            try {
              execSync('npm install', { stdio: 'inherit' });
              console.log('✅ Dependencies installed successfully');
              
              console.log('\n🎉 Setup complete! You can now start the development server with:');
              console.log('   npm run dev');
              
              if (!googleClientId || !googleClientSecret) {
                console.log('\n⚠️ Note: Google OAuth credentials are missing. Authentication will not work.');
                console.log('   To enable authentication, update the .env files with your Google OAuth credentials.');
              }
            } catch (error) {
              console.error('❌ Error installing dependencies:', error);
            }
            
            rl.close();
          });
        });
      });
    });
  });
});
