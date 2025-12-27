# Deployment Guide - Render

This guide will help you deploy ProofStamp to Render.

## Prerequisites

- GitHub account
- Render account (sign up at https://render.com)

## Step 1: Push to GitHub

1. Initialize git repository (if not already done):
```bash
git init
git add .
git commit -m "Initial commit"
```

2. Create a new repository on GitHub:
   - Go to https://github.com/new
   - Name it `proofstamp` (or your preferred name)
   - Don't initialize with README (we already have one)
   - Click "Create repository"

3. Push to GitHub:
```bash
git remote add origin https://github.com/YOUR_USERNAME/proofstamp.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## Step 2: Deploy Backend Service on Render

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the backend service:
   - **Name**: `proofstamp-server` (or your choice)
   - **Environment**: Docker
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Dockerfile Path**: `server/Dockerfile`
   - **Docker Build Context**: `server`
   - **Start Command**: (leave empty, Dockerfile handles this)

5. **Environment Variables**:
   - `NODE_ENV` = `production`
   - `PORT` = `5000`
   - `CLIENT_URL` = (we'll set this after deploying frontend)

6. **Add Disk** (for SQLite persistence):
   - Click "Add Disk"
   - Name: `data`
   - Mount Path: `/app/data`
   - Size: 1 GB (free tier allows up to 1 GB)

7. Click "Create Web Service"

8. **Note the backend URL**: Something like `https://proofstamp-server.onrender.com`

## Step 3: Deploy Frontend Service on Render

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Select the same GitHub repository
4. Configure the frontend service:
   - **Name**: `proofstamp-client` (or your choice)
   - **Environment**: Docker
   - **Region**: Same as backend
   - **Branch**: `main`
   - **Root Directory**: `client`
   - **Dockerfile Path**: `client/Dockerfile`
   - **Docker Build Context**: `client`

5. **Environment Variables**:
   - None needed for frontend

6. Click "Create Web Service"

7. **Note the frontend URL**: Something like `https://proofstamp-client.onrender.com`

## Step 4: Update Environment Variables

1. Go back to your **backend service** settings
2. Update `CLIENT_URL` environment variable:
   - Set it to your frontend URL: `https://proofstamp-client.onrender.com`
3. Save changes (this will trigger a redeploy)

## Step 5: Update Frontend Nginx Configuration

The frontend needs to know the backend URL. We need to update the nginx.conf to use an environment variable or update it to point to your Render backend URL.

### Option A: Update nginx.conf with your backend URL

Edit `client/nginx.conf` and update the proxy_pass line:
```nginx
proxy_pass http://proofstamp-server.onrender.com:5000/api/;
```

Then commit and push:
```bash
git add client/nginx.conf
git commit -m "Update nginx config for Render backend"
git push
```

### Option B: Use Render's internal service discovery

If both services are in the same region, you can use Render's internal hostname. However, for simplicity, Option A is recommended.

## Step 6: Verify Deployment

1. Visit your frontend URL: `https://proofstamp-client.onrender.com`
2. Test the application:
   - Enter an author name
   - Drop a file to timestamp it
   - Verify a hash

## Important Notes

### Free Tier Limitations

- **Spinning Down**: Free tier services spin down after 15 minutes of inactivity
- **Cold Starts**: First request after spin-down may take 30-60 seconds
- **Disk Persistence**: Free tier includes 1 GB of disk storage
- **Build Time**: Free tier has limited build minutes per month

### Database Persistence

The SQLite database is stored in the persistent disk at `/app/data/proofstamp.db`. This ensures data persists across deployments.

### Updating the Application

To update your application:
1. Make changes locally
2. Commit and push to GitHub:
```bash
git add .
git commit -m "Your update message"
git push
```
3. Render will automatically rebuild and redeploy

## Troubleshooting

### Backend not connecting to frontend
- Check that `CLIENT_URL` environment variable is set correctly
- Verify CORS is enabled in backend code

### Database not persisting
- Verify disk is mounted at `/app/data`
- Check disk usage in Render dashboard

### Services timing out
- Free tier services spin down after inactivity
- First request after spin-down will be slow
- Consider upgrading to paid tier for always-on services

## Support

For Render-specific issues, check:
- Render Documentation: https://render.com/docs
- Render Status: https://status.render.com

