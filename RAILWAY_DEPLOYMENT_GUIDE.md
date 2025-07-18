# Railway Backend Deployment Guide

This guide will walk you through deploying your Johnbabs Environmental Services backend to Railway step by step.

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ GitHub account
- ✅ Railway account (free at [railway.app](https://railway.app))
- ✅ MongoDB Atlas account (free at [mongodb.com/atlas](https://www.mongodb.com/atlas))
- ✅ Gmail account for email notifications

## 🗄️ Step 1: Set Up MongoDB Atlas Database

### 1.1 Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Click "Try Free" and create an account
3. Choose "Free" tier (M0)
4. Select your preferred cloud provider (AWS/Google Cloud/Azure)
5. Choose a region close to your users

### 1.2 Create Database Cluster
1. Click "Build a Database"
2. Choose "FREE" tier (M0)
3. Select cluster name (e.g., "johnbabs-cluster")
4. Click "Create"

### 1.3 Set Up Database Access
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create a username and password (save these!)
5. Select "Read and write to any database"
6. Click "Add User"

### 1.4 Set Up Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

### 1.5 Get Connection String
1. Go to "Database" in the left sidebar
2. Click "Connect"
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `<dbname>` with `johnbabs_db`

**Example connection string:**
```
mongodb+srv://yourusername:yourpassword@cluster0.xxxxx.mongodb.net/johnbabs_db?retryWrites=true&w=majority
```

## 📧 Step 2: Set Up Gmail for Email Notifications

### 2.1 Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Navigate to "Security"
3. Enable "2-Step Verification"

### 2.2 Generate App Password
1. Go to "Security" → "2-Step Verification"
2. Click "App passwords"
3. Select "Mail" and "Other (Custom name)"
4. Name it "Johnbabs Backend"
5. Copy the generated 16-character password

## 🚂 Step 3: Deploy to Railway

### 3.1 Create Railway Account
1. Go to [Railway.app](https://railway.app)
2. Click "Start a New Project"
3. Sign in with GitHub

### 3.2 Deploy from GitHub
1. Click "Deploy from GitHub repo"
2. Select your repository: `johnbabs-project-v1`
3. Railway will detect it's a Node.js project
4. Click "Deploy Now"

### 3.3 Configure Environment Variables
1. In your Railway project dashboard, go to "Variables" tab
2. Add the following environment variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# MongoDB Connection (replace with your actual connection string)
MONGODB_URI=mongodb+srv://yourusername:yourpassword@cluster0.xxxxx.mongodb.net/johnbabs_db?retryWrites=true&w=majority

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secure-jwt-secret-key-here

# CORS Configuration (your frontend URL)
FRONTEND_URL=https://your-github-username.github.io

# Email Configuration
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-character-app-password
ADMIN_EMAIL=johnbabsenvironmental@gmail.com

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

### 3.4 Configure Deployment Settings
1. Go to "Settings" tab
2. Set "Root Directory" to `backend`
3. Set "Start Command" to `npm start`
4. Save changes

### 3.5 Deploy the Application
1. Railway will automatically detect changes and deploy
2. Monitor the deployment logs
3. Wait for "Deploy successful" message

## 🔧 Step 4: Update Frontend API URL

### 4.1 Get Your Railway URL
1. In Railway dashboard, go to "Deployments" tab
2. Copy the generated URL (e.g., `https://your-app-name.railway.app`)

### 4.2 Update Frontend Code
1. Open `src/services/api.ts`
2. Replace the placeholder URL:

```typescript
// Replace this line:
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-backend-url.railway.app/api';

// With your actual Railway URL:
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-app-name.railway.app/api';
```

### 4.3 Deploy Frontend Changes
```bash
git add .
git commit -m "Update API URL to Railway backend"
git push origin main
```

## 🧪 Step 5: Test Your Deployment

### 5.1 Test Backend Health
Visit: `https://your-app-name.railway.app/api/health`
Should return: `{"status":"ok","message":"Server is running"}`

### 5.2 Test Form Submissions
1. Go to your live website
2. Test the Contact form
3. Test the Consultation form
4. Test the Quote request form
5. Check if you receive email notifications

### 5.3 Test Admin Login
1. Go to `/admin` (if enabled)
2. Login with default credentials:
   - Username: `admin`
   - Password: `admin123`

## 🔍 Step 6: Monitor and Debug

### 6.1 View Railway Logs
1. In Railway dashboard, go to "Deployments"
2. Click on your latest deployment
3. View real-time logs

### 6.2 Common Issues and Solutions

#### Issue: "MongoDB connection failed"
**Solution:**
- Check MongoDB Atlas network access (allow all IPs)
- Verify connection string format
- Ensure database user has correct permissions

#### Issue: "Email sending failed"
**Solution:**
- Verify Gmail app password is correct
- Check if 2FA is enabled
- Ensure email credentials are properly set

#### Issue: "CORS errors"
**Solution:**
- Update `FRONTEND_URL` in Railway variables
- Ensure it matches your GitHub Pages URL exactly

#### Issue: "Port already in use"
**Solution:**
- Railway automatically assigns ports
- Use `process.env.PORT` in your code (already configured)

## 📊 Step 7: Production Optimization

### 7.1 Set Up Custom Domain (Optional)
1. In Railway dashboard, go to "Settings"
2. Click "Custom Domains"
3. Add your domain
4. Configure DNS records

### 7.2 Set Up Monitoring
1. Railway provides basic monitoring
2. Consider setting up uptime monitoring (UptimeRobot, Pingdom)
3. Set up error tracking (Sentry)

### 7.3 Database Backup
1. MongoDB Atlas provides automatic backups
2. Set up additional backup strategies if needed

## 🔒 Step 8: Security Best Practices

### 8.1 Environment Variables
- ✅ Never commit sensitive data to Git
- ✅ Use strong, unique passwords
- ✅ Rotate JWT secrets regularly

### 8.2 Database Security
- ✅ Use strong database passwords
- ✅ Restrict network access when possible
- ✅ Enable MongoDB Atlas security features

### 8.3 API Security
- ✅ Implement rate limiting
- ✅ Use HTTPS (Railway provides this)
- ✅ Validate all inputs

## 📈 Step 9: Scaling (Future)

### 9.1 Railway Scaling
- Railway automatically scales based on traffic
- Upgrade to paid plan for more resources
- Set up multiple instances for high availability

### 9.2 Database Scaling
- MongoDB Atlas scales automatically
- Consider read replicas for high traffic
- Implement caching strategies

## 🆘 Troubleshooting

### Common Error Messages:

**"Module not found"**
- Ensure all dependencies are in `package.json`
- Check if `node_modules` is in `.gitignore`

**"Port 5000 already in use"**
- Railway uses `process.env.PORT`
- Your code already handles this correctly

**"MongoDB connection timeout"**
- Check MongoDB Atlas network access
- Verify connection string format
- Ensure cluster is running

**"Email authentication failed"**
- Verify Gmail app password
- Check if 2FA is enabled
- Test email credentials manually

## 📞 Support Resources

- **Railway Documentation**: [docs.railway.app](https://docs.railway.app)
- **MongoDB Atlas Documentation**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- **Node.js Documentation**: [nodejs.org/docs](https://nodejs.org/docs)

## ✅ Deployment Checklist

- [ ] MongoDB Atlas database created and configured
- [ ] Gmail app password generated
- [ ] Railway project created and deployed
- [ ] Environment variables configured
- [ ] Frontend API URL updated
- [ ] All forms tested and working
- [ ] Email notifications received
- [ ] Admin panel accessible (if enabled)
- [ ] Monitoring and logging configured
- [ ] Security measures implemented

## 🎉 Success!

Once you've completed all steps, your backend will be:
- ✅ Running on Railway's infrastructure
- ✅ Connected to MongoDB Atlas database
- ✅ Sending email notifications
- ✅ Accessible from your frontend
- ✅ Scalable and secure

Your Johnbabs Environmental Services website will have full backend functionality with working forms, email notifications, and database storage!
