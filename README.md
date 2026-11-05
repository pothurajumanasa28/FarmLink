# Smart Local Farm-to-Institution Procurement Portal
### Seshadri Rao Gudlavalleru Engineering College (SRGEC)
**Department of Community Service Project (CSP) & Computer Science Engineering**

---

## 1. Project Overview

The **Smart Local Farm-to-Institution Procurement Portal** is a production-grade, full-stack, mobile-friendly web application designed to connect local farmers in Andhra Pradesh (specifically around Gudlavalleru and the Krishna delta region) directly with institutional buyers, such as the **Seshadri Rao Gudlavalleru Engineering College** campus dining halls, student hostels, and central canteen.

### Core Value Proposition
- **Direct Procurement**: Eliminates commission middlemen, giving local farmers fair and timely payments while providing students and college staff with fresh, traceable, farm-direct harvest.
- **Stock Protection**: Real-time atomic inventory tracking prevents overselling. Stock is locked upon mutual order acceptance and released exactly once if cancelled prior to delivery.
- **Dynamic Bulk Tendering**: Institutional buyers can post monthly/weekly requirements. Farmers submit bids with partial fulfillment support, progress bars, and atomic capacity limits.
- **Bilingual Interface**: Native, high-fidelity support for both **English** and **Telugu (తెలుగు)** across every dashboard, status badge, form, alert, and unit measurement.
- **Privacy & Safety**: Contact numbers and email addresses remain strictly private until an order is officially accepted by both parties.

---

## 2. Technology Stack

- **Frontend**: React 18, Vite 5, React Router DOM 6, Lucide React icons.
- **Styling**: Mobile-first, responsive, accessible CSS with KaTeX and Telugu typography support (`Noto Sans Telugu`).
- **Backend**: Node.js & Express REST API with security rate limiting and CORS controls.
- **Database**: MongoDB Atlas (or local MongoDB) via Mongoose 8.
- **Authentication**: Stateless JWT token authentication with bcrypt password hashing and server-side role validation.
- **Testing**: Built-in automated test suite covering units, stock reservations, order progression, and permissions.
- **Hosting**: Designed for Vercel (Frontend) and Render (Backend).

---

## 3. User Roles & Permission Matrix

| Feature / Permission | Farmer | Institution (Hostel / Canteen) | Administrator |
| :--- | :---: | :---: | :---: |
| **Self-Registration** | Yes (Pending Approval) | Yes (Pending Approval) | **No** (Protected Script Only) |
| **Manage Produce Listings** | Yes (Approved Only) | No | Moderate Only |
| **Request Individual Orders** | No | Yes (Approved Only) | View Only |
| **Accept / Prepare / Deliver Orders** | Yes | No | View / Audit Only |
| **Publish Bulk Requirements** | No | Yes (Approved Only) | Moderate Only |
| **Submit Bulk Tender Offers** | Yes (Approved Only) | No | View Only |
| **Accept All / Partial Offers** | No | Yes (Approved Only) | View Only |
| **Approve / Reject / Suspend Accounts** | No | No | **Yes** |
| **Two-Way Star Ratings (Delivered Only)**| Yes | Yes | Moderate Abusive Reviews |

---

## 4. Beginner-Friendly Step-by-Step Setup

Follow these simple steps on your Windows, Mac, or Linux computer:

### Prerequisites
1. **Node.js** (v18 or v20+ recommended) — download from [nodejs.org](https://nodejs.org).
2. **MongoDB** — either a free cloud database on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) or a local MongoDB service (`mongodb://127.0.0.1:27017/farm_procurement`).

---

### Step 1: Install Backend Dependencies

Open a PowerShell or Terminal window in the project directory:

```bash
cd "d:\csp project\backend"
npm install
```

### Step 2: Configure Environment Variables

Create your `.env` file in `backend/` by copying `.env.example`:

```bash
# In backend directory
copy .env.example .env     # Windows
# or cp .env.example .env   # Mac/Linux
```

Ensure your `.env` contains:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/farm_procurement
JWT_SECRET=super_secret_jwt_key_srgrec_college_demo_2026
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
ADMIN_EMAIL=admin@srgrec.edu.in
ADMIN_PASSWORD=AdminSecurePass123!
ADMIN_NAME=SRGEC Admin Officer
ADMIN_PHONE=+919876543210
```
*(If using MongoDB Atlas, simply replace `MONGODB_URI` with your connection string from the Atlas dashboard).*

---

### Step 3: Initialize the Administrator Account

Run the secure admin creation script. (Public registration for admin is permanently disabled):

```bash
npm run init-admin
```
You will see:
```text
[Init Admin] Connected to MongoDB.
[Init Admin] Admin account successfully created!
Email: admin@srgrec.edu.in
Role:  admin
```

---

### Step 4: Seed Demo Records (Farmers, Hostels, Listings & Orders)

Run the automated seeder to load the complete demonstration dataset:

```bash
npm run seed
```
This populates:
- **3 Farmers** (Ramesh Reddy, Venkata Rao, Lakshmi Devi)
- **2 Institutions** (SRGEC Boys Hostel Mess, SRGEC Central Canteen)
- **6 Produce Listings** (Sona Masoori Rice, Tomatoes, Chillies, Black Gram, Buffalo Milk, Bananas)
- **3 Bulk Requirements** with fulfillment metrics
- **4 Sample Orders** covering Pending, Accepted, Preparing, and Delivered states with feedback.

---

### Step 5: Run Automated Tests

Execute the automated test suite to verify core business logic:

```bash
npm test
```
All business rules (stock protection, unit conversions, contact privacy, atomic cancellations, and status constraints) will be validated.

---

### Step 6: Start the Backend Server

```bash
npm run dev
# or npm start
```
The backend API will be live at `http://localhost:5000/api/health`.

---

### Step 7: Install and Start the Frontend

Open a second terminal window:

```bash
cd "d:\csp project\frontend"
npm install
npm run dev
```

The web application is now active at:
👉 **`http://localhost:5173`**

---

## 5. Demonstration Accounts

For quick presentation and evaluation, use these pre-configured accounts:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Farmer 1** | `farmer.ramesh@srgrec.demo` | `FarmerPass123!` | Ramesh Reddy (Gudlavalleru) |
| **Farmer 2** | `farmer.venkata@srgrec.demo` | `FarmerPass123!` | Venkata Rao (Angalur) |
| **Farmer 3** | `farmer.lakshmi@srgrec.demo`| `FarmerPass123!` | Lakshmi Devi (Mudinepalli) |
| **Institution 1** | `hostel@srgrec.demo` | `HostelPass123!` | SRGEC Boys Hostel Mess |
| **Institution 2** | `canteen@srgrec.demo` | `CanteenPass123!`| SRGEC Campus Central Canteen |
| **College Admin** | `admin@srgrec.edu.in` | `AdminSecurePass123!` | SRGEC Procurement Officer |

*Tip: The Login page also features 1-click quick-fill buttons for immediate testing.*

---

## 6. Language and Unit Conversions

- Switch between **English** and **Telugu (తెలుగు)** at any moment using the language toggle in the header.
- Quantities have mandatory explicit units: `kg`, `quintal`, `tonne`, `bags`, `pieces`, `litres`.
- Currency is strictly formatted in Indian Rupees (`₹`).

---

## 7. College CSP Demonstration Checklist

Refer to [`DEMO_GUIDE.md`](./DEMO_GUIDE.md) for the complete presentation script and feature verification walkthrough.
