#!/bin/bash

# FocusFlow Production Setup Script
# This script helps set up the production environment

set -e

echo "🚀 FocusFlow Production Setup"
echo "=============================="
echo ""

# Check if .env.production exists
if [ -f .env.production ]; then
    echo "✅ .env.production file exists"
else
    echo "⚠️  .env.production not found"
    echo "📝 Creating from .env.production.example..."
    
    if [ -f .env.production.example ]; then
        cp .env.production.example .env.production
        echo "✅ Created .env.production"
        echo "⚠️  Please edit .env.production and add your production values"
        exit 1
    else
        echo "❌ .env.production.example not found"
        exit 1
    fi
fi

echo ""
echo "🔍 Checking dependencies..."
npm list >/dev/null 2>&1 || npm install

echo ""
echo "🧹 Cleaning previous builds..."
rm -rf dist

echo ""
echo "🔨 Building for production..."
npm run build

echo ""
echo "📊 Build Statistics:"
du -sh dist
echo ""
echo "Bundle Breakdown:"
du -sh dist/entries/* 2>/dev/null || echo "No entry files"
du -sh dist/chunks/* 2>/dev/null || echo "No chunk files"
du -sh dist/assets/* 2>/dev/null || echo "No asset files"

echo ""
echo "✅ Production build complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Review the build output in ./dist"
echo "2. Test locally with: npm run preview"
echo "3. Deploy to your hosting platform:"
echo "   - Vercel: vercel --prod"
echo "   - Netlify: netlify deploy --prod"
echo "   - Manual: Upload ./dist folder"
echo ""
echo "🔐 Don't forget to:"
echo "- Set environment variables in your hosting platform"
echo "- Update Google OAuth redirect URIs"
echo "- Configure Appwrite for production domain"
echo ""
