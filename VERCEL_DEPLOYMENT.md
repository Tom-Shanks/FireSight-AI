# FireSight AI Vercel Deployment

This document provides instructions for deploying the FireSight AI project to Vercel.

## Overview

The FireSight AI project has been adapted to work with Vercel's serverless architecture. The deployment includes:

1. A React frontend for the user interface
2. Serverless API functions for the backend

## Prerequisites

- A GitHub account
- A Vercel account (can be created at [vercel.com](https://vercel.com))
- Node.js 18.x or later

## Deployment Steps

### 1. Fork or Clone the Repository

First, fork or clone the FireSight AI repository to your GitHub account.

### 2. Connect to Vercel

1. Log in to your Vercel account
2. Click "Add New..." and select "Project"
3. Import your GitHub repository
4. Configure the project:
   - Framework Preset: Other
   - Root Directory: ./
   - Build Command: (leave as default)
   - Output Directory: (leave as default)

### 3. Configure Environment Variables

Add the following environment variables in the Vercel project settings:

- `ALLOWED_ORIGINS` - Set to your frontend domain (e.g., `https://firesight-ai.vercel.app`)
- `NODE_ENV` - Set to `production`

### 4. Deploy

Click "Deploy" to start the deployment process. Vercel will automatically build and deploy your project.

## Project Structure

The project is structured for Vercel deployment as follows:

- `/frontend` - React frontend application
- `/api` - Serverless API functions
- `vercel.json` - Vercel configuration file

## Vercel Configuration

The `vercel.json` file configures the build and routing for the project:

```json
{
  "version": 2,
  "builds": [
    { 
      "src": "frontend/package.json", 
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    },
    { 
      "src": "api/**/*.js", 
      "use": "@vercel/node" 
    }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "src": "/(.*)", "dest": "/frontend/$1" }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

## Local Development

To develop and test locally:

1. Install dependencies:
   ```
   cd frontend && npm install
   cd ../api && npm install
   ```

2. Install the Vercel CLI:
   ```
   npm install -g vercel
   ```

3. Run the development server:
   ```
   vercel dev
   ```

4. Access the application at `http://localhost:3000`

## Continuous Deployment

Vercel automatically deploys changes when you push to your repository. Each push to the main branch triggers a production deployment, while pushes to other branches create preview deployments.

## Monitoring and Logs

You can monitor your deployment and view logs in the Vercel dashboard:

1. Go to your project in the Vercel dashboard
2. Click on "Deployments" to see all deployments
3. Click on a specific deployment to view details and logs

## Troubleshooting

If you encounter issues with your deployment:

1. Check the build logs in the Vercel dashboard
2. Verify that all environment variables are correctly set
3. Ensure that the project structure matches the expected structure for Vercel
4. Check that all dependencies are correctly specified in package.json files

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Serverless Functions on Vercel](https://vercel.com/docs/serverless-functions/introduction) 