#!/bin/bash
echo "🚀 Setting up SynergySphere..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Setup environment
echo "🔧 Setting up environment..."
if [ ! -f .env.local ]; then
  cat > .env.local << EOF
DATABASE_URL="file:./dev.db"
JWT_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
EOF
  echo "✅ Created .env.local with secure secrets"
else
  echo "⚠️  .env.local already exists"
fi

# Setup database
echo "🗄️  Setting up database..."
npx prisma generate
npx prisma db push

echo "🎉 Setup complete!"
echo "👉 Run 'npm run dev' to start the development server"
echo "🌐 Then visit http://localhost:3000"