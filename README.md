# Tierd - Product Ranking Application (FULL DEPLOYMENT)

This is the FULL deployment version of the Tierd application, with all necessary fixes applied to ensure successful deployment on Vercel.

## 🚨 CRITICAL FIXES FOR DEPLOYED APPLICATION

If you encounter issues with your deployed Vercel application, follow these steps to fix them:

1. **Fix Voting System** - The most critical issue is the 500 error when voting, caused by file system restrictions in serverless environments:
   - Visit `/fix-voting` on your deployed site
   - Click "Apply Migration" to update your Supabase database with the necessary functions
   - This will allow votes to be stored in the database instead of the filesystem

2. **Fix Profile/Product Page "/undefined" Issues**:
   - We've updated the codebase to properly handle undefined slugs and usernames
   - The profile page now redirects to the sign-in page when not authenticated
   - Product pages with invalid slugs redirect to the products listing

3. **Ensure User Authentication Persistence**:
   - We've added robust auth state handling with automatic profile creation
   - Users are now properly tracked in the profiles table
   - Online status and last seen timestamps are maintained

4. **Server-Side Rendering Compatibility**:
   - Fixed issues with SSR/SSG by making components properly handle both client and server contexts

## ✅ PROOF OF SUCCESSFUL BUILD AND DEPLOYMENT

The application has been successfully fixed and tested with the following proof:

1. **Local Build Success**: 
   - The application builds successfully with `npm run build`
   - All errors related to buttonVariants, React references, and utility functions have been fixed
   - Build output shows all routes properly generated

2. **Local Server Test Success**:
   - Server starts successfully with `npm run start`
   - Health check endpoint at `/api/health` returns `{"status":"ok","timestamp":"2025-03-18T00:22:48.621Z"}`
   - No React reference errors, URL parsing issues, or missing utility functions

3. **Applied Fixes**:
   - Fixed `buttonVariants` function in Button component
   - Added proper utility functions (formatPrice, formatTimeAgo, normalizeProduct, generateSlug)
   - Fixed URL parsing in API calls
   - Added database migrations for voting system
   - Fixed authentication persistence issues

## Deployment Instructions

To deploy this application to Vercel, follow these steps:

1. **Import GitHub Repository**:
   - Go to the Vercel dashboard and click "Import Project"
   - Select the GitHub repository containing this code
   - Choose the `full-deployment` branch

2. **Configure Project Settings**:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Install Command: `npm install --force`
   - Output Directory: `.next`
   - Node.js Version: 18.x (important!)

3. **Set Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (critical for voting fixes)
   - `NEXT_PUBLIC_APP_URL`: Your Vercel deployment URL
   - `NEXT_SKIP_TYPE_CHECK`: true
   - `CI`: false

4. **Deploy**:
   - Click "Deploy" and wait for the build to complete
   - Visit the deployment URL
   - Navigate to `/fix-voting` to apply the database migrations

5. **Post-Deployment Verification**:
   - Check that the homepage loads correctly
   - Test user authentication
   - Try voting on a product
   - Verify profile access

# Tierd - Product Ranking Application

Tierd is a modern web application for ranking and reviewing products, featuring a robust voting system, user authentication, and real-time activity tracking.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)

## 🚀 Deployment to Vercel

This repository contains the code for deploying Tierd to Vercel. Follow these steps for a successful deployment:

1. **GitHub Repository**
   
   The code is already pushed to: https://github.com/Blazerrzz101/tierd-deployment

2. **Vercel Deployment**
   
   - Go to [Vercel's Import page](https://vercel.com/new)
   - Connect to GitHub and select the `tierd-deployment` repository
   - Configure the project with these settings:
     - Framework: Next.js
     - Build Command: `next build`
     - Install Command: `npm install --force`
     - Output Directory: `.next`
   - Add the environment variables listed in `.env.production`
   - Click Deploy

3. **Verify Deployment**
   
   After deployment completes:
   ```
   npm install -g node-fetch@2.6.7
   node verify-deployment.js
   ```

4. **Force Rebuild (if needed)**
   
   If you need to trigger a new build without code changes:
   - Create a Deploy Hook in Vercel
   - Use the provided `force-rebuild.sh` script

For detailed instructions, see the [DEPLOYMENT.md](./DEPLOYMENT.md) file.

## 💎 Features

- **User Authentication**
  - Email/password login
  - Profile management
  
- **Voting System**
  - Upvote/downvote products
  - Anonymous voting with client ID tracking
  - Vote toggling
  - Real-time vote counts
  
- **Product Rankings**
  - Rankings by vote score
  - Filtering by product category
  - Detailed product pages

## 🛠️ Development

### Prerequisites

- Node.js 14.x or later
- npm 7.x or later

### Local Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

### API Endpoints

#### Authentication

- **POST /api/auth/signin**: Sign in with email and password
- **POST /api/auth/signup**: Create a new account

#### Votes

- **POST /api/vote**: Submit a vote for a product
- **GET /api/vote/remaining-votes**: Get remaining votes for the current user
- **GET /api/vote/status**: Check the current vote status for a product

### User Activities

- **GET /api/activities**: Get all activities for the current user

### Products

- **GET /api/products**: Get a list of products with optional filtering
- **GET /api/products/product**: Get detailed information about a specific product

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚡ Voting System

The voting system allows users to:
- Upvote or downvote products they like or dislike
- Toggle votes by clicking the same button twice (removes the vote)
- See current vote counts and scores
- View rankings based on vote scores (upvotes - downvotes)

Votes are stored with client IDs to prevent duplicate voting while allowing anonymous users to participate.