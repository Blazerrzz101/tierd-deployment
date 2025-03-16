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