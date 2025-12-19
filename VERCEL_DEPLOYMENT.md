# SafeVoice Backend - Vercel Deployment Guide

## 🚀 Deployment Steps

### 1. Install Vercel CLI (if not already installed)
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy to Vercel
```bash
vercel
```

For production deployment:
```bash
vercel --prod
```

## 🔧 Environment Variables

Add these environment variables in Vercel Dashboard:

1. Go to: https://vercel.com/your-project/settings/environment-variables
2. Add the following:

```
MONGODB_URI=mongodb+srv://Thomson:mongodb@taskmanager.or8tbtc.mongodb.net/safevoice
MONGO_URI=mongodb+srv://Thomson:mongodb@taskmanager.or8tbtc.mongodb.net/safevoice
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=production
PORT=3001

# Firebase Configuration (if using push notifications)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
```

## 📝 Important Notes

1. **MongoDB Connection**: Make sure your MongoDB Atlas allows connections from anywhere (0.0.0.0/0) or add Vercel IPs to whitelist
2. **Serverless Functions**: Vercel runs as serverless functions, so persistent connections may behave differently
3. **Cold Starts**: First request after inactivity may be slower due to cold starts
4. **Timeouts**: Vercel has a 10-second timeout for Hobby plan, 60 seconds for Pro

## 🔍 Verify Deployment

After deployment, test your endpoints:

```bash
# Health check
curl https://your-app.vercel.app/api/health

# API info
curl https://your-app.vercel.app/
```

## 🛠️ Troubleshooting

### MongoDB Connection Issues
- Ensure IP whitelist includes `0.0.0.0/0` in MongoDB Atlas
- Verify connection string is correct

### Environment Variables Not Working
- Check they're added in Vercel Dashboard
- Redeploy after adding variables

### Build Errors
- Run `npm run build` locally first to catch TypeScript errors
- Check Vercel build logs for specific errors

## 📚 Useful Commands

```bash
# Development
npm run dev

# Build locally
npm run build

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# List deployments
vercel ls
```

## 🌐 Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

---

Your SafeVoice backend is now configured for Vercel deployment! 🎉
