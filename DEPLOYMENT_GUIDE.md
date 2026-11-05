# Cloud Deployment & Production Hosting Guide
### Smart Local Farm-to-Institution Procurement Portal
**Seshadri Rao Gudlavalleru Engineering College**

This guide provides step-by-step instructions for deploying the portal to free, production-ready cloud hosting:
- **Database**: MongoDB Atlas (Free M0 Sandbox)
- **Backend**: Render Web Service (Node.js)
- **Frontend**: Vercel (React + Vite)
- **Version Control**: Git & GitHub

---

## Part 1: Setting up MongoDB Atlas (Cloud Database)

1. **Sign Up**:
   - Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and register for a free account.
2. **Create a Free Cluster**:
   - Select **M0 Free Tier**.
   - Choose provider **AWS** and region **ap-south-1 (Mumbai)** for lowest latency to Andhra Pradesh.
   - Name the cluster (e.g., `Cluster0`) and click **Create**.
3. **Configure Database Access (User Credentials)**:
   - Go to **Security > Database Access > Add New Database User**.
   - Authentication Method: **Password**.
   - Username: `srgrec_admin`
   - Password: Choose a strong password (e.g. `AtlasFarmSecure2026!`).
   - Database User Privileges: `Read and write to any database`.
   - Click **Add User**.
4. **Configure Network Access (IP Whitelist)**:
   - Go to **Security > Network Access > Add IP Address**.
   - Click **Allow Access from Anywhere** (`0.0.0.0/0`) so that Render and local developers can connect.
   - Click **Confirm**.
5. **Obtain Connection String**:
   - On the Clusters overview page, click **Connect > Drivers > Node.js**.
   - Copy the connection string:
     ```text
     mongodb+srv://srgrec_admin:<password>@cluster0.xxxx.mongodb.net/farm_procurement?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your actual password and save this string for backend deployment.

---

## Part 2: GitHub Repository Setup

1. Open your terminal in the root workspace folder (`d:\csp project`):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Complete Smart Farm-to-Institution Procurement Portal"
   ```
2. Create a new private or public repository on [GitHub](https://github.com/new) named `smart-farm-procurement`.
3. Push your repository:
   ```bash
   git remote add origin https://github.com/<your-username>/smart-farm-procurement.git
   git branch -M main
   git push -u origin main
   ```
*(Note: Sensitive `.env` files are ignored automatically by `.gitignore` so your secrets are never exposed on GitHub).*

---

## Part 3: Deploying Backend to Render

1. Log in to [render.com](https://render.com) using your GitHub account.
2. Click **New + > Web Service**.
3. Connect your `smart-farm-procurement` GitHub repository.
4. Configure the Web Service:
   - **Name**: `srgrec-farm-backend`
   - **Region**: Singapore or Frankfurt
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. Click **Environment Variables** and add the following keys:
   - `NODE_ENV` = `production`
   - `PORT` = `10000`
   - `MONGODB_URI` = *(Your MongoDB Atlas connection string from Part 1)*
   - `JWT_SECRET` = *(Generate a 32+ character random secret string)*
   - `JWT_EXPIRES_IN` = `7d`
   - `CLIENT_URL` = *(Your Vercel URL, e.g. `https://srgrec-farm.vercel.app` - you can update this after Part 4)*
   - `ADMIN_EMAIL` = `admin@srgrec.edu.in`
   - `ADMIN_PASSWORD` = `AdminSecurePass123!`
   - `ADMIN_NAME` = `SRGEC Admin Officer`
   - `ADMIN_PHONE` = `+919876543210`
6. Click **Create Web Service**.
7. Once deployed, Render will provide your public backend URL, e.g.:
   `https://srgrec-farm-backend.onrender.com`
8. In the Render Shell tab, run the seeder and admin initialization:
   ```bash
   npm run init-admin
   npm run seed
   ```

---

## Part 4: Deploying Frontend to Vercel

1. Log in to [vercel.com](https://vercel.com) using your GitHub account.
2. Click **Add New... > Project** and import `smart-farm-procurement`.
3. Configure Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click Edit and select `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Expand **Environment Variables**:
   - Name: `VITE_API_URL`
   - Value: `https://srgrec-farm-backend.onrender.com` *(your Render backend URL from Part 3, without trailing slash)*
5. Click **Deploy**.
6. Within 1 minute, Vercel will launch your live web application (e.g. `https://srgrec-farm.vercel.app`)!
7. **Final step**: Go back to your Render dashboard, update `CLIENT_URL` in backend Environment Variables to your new Vercel URL, and trigger a quick redeploy so CORS permits live API calls.

---

## Part 5: Verification Checklist

1. Open your Vercel deployment URL on desktop and mobile phone.
2. Verify Telugu font rendering and mobile layout responsiveness.
3. Test logging in with demo credentials (`hostel@srgrec.demo` or `farmer.ramesh@srgrec.demo`).
4. Place an order request, switch accounts to accept it, and verify contact detail unlock.
5. Review the Admin dashboard to observe live cloud database metrics.
