# College Demonstration & Evaluation Guide
### Smart Local Farm-to-Institution Procurement Portal
**Seshadri Rao Gudlavalleru Engineering College (SRGEC)**

---

## 1. Objective of the Demonstration

Demonstrate how this Community Service Project (CSP) application provides a direct, secure, and technologically robust bridge between agricultural producers in Gudlavalleru mandal and institutional bulk buyers at Seshadri Rao Gudlavalleru Engineering College.

---

## 2. Demonstration Flow & Test Scenarios

### Scenario 1: Bilingual Switch & Accessibility
1. Open the application at `http://localhost:5173`.
2. Notice the college banner: **"Seshadri Rao Gudlavalleru Engineering College — Gudlavalleru, Krishna District, AP"**.
3. Click the language toggle button in the header to switch to **తెలుగు**.
4. Observe that all buttons, statuses, table headers, currency formats, and labels seamlessly translate into Telugu.
5. Switch back to **English** (or leave in Telugu as preferred).

---

### Scenario 2: Farmer Inventory & Stock Protection
1. Log in as **Farmer 1** (`farmer.ramesh@srgrec.demo` / `FarmerPass123!`).
2. Navigate to **My Listings**:
   - Inspect **BPT Sona Masoori Rice**: Total Stock `1200 kg`, Reserved Stock `200 kg`, Available `1000 kg`.
   - Click **Edit**: Try setting the Total Stock to `150 kg` (below the 200 kg reserved for accepted orders).
   - Observe the validation error preventing reduction below committed stock.
3. Click **+ Add Produce Listing**:
   - Create a new listing (e.g., `Krishna Delta Toor Dal`, `100 kg`, `₹130/kg`, date next month).
   - Confirm it appears immediately in the listings grid.

---

### Scenario 3: Institution Produce Search & Individual Ordering
1. Open an incognito browser window or log in as **Hostel Mess** (`hostel@srgrec.demo` / `HostelPass123!`).
2. Click **Browse Produce**:
   - Search for "Tomatoes".
   - Notice the farmer's name and village are visible, but **phone number and email are hidden** for privacy.
3. Click **Request Quantity** on Venkata Rao's Fresh Farm Tomatoes:
   - Request `20 kg` for delivery next Monday.
   - Enter note: `"Please deliver at Hostel Mess Gate 1 before 8:00 AM."`
   - Submit request.
4. Go to **My Orders**:
   - View the new order in **Pending** status.
   - Note that contact details remain locked until the farmer accepts.

---

### Scenario 4: Farmer Acceptance & Contact Unlock
1. Switch back to the Farmer browser tab (`farmer.venkata@srgrec.demo`).
2. Notice the **Notification Bell** badge incrementing with the new order request alert.
3. On the dashboard, locate the incoming request from SRGEC Hostel Mess.
4. Click **Accept**:
   - Order moves to **Accepted**.
   - Notice the Hostel contact person and phone number are now **unlocked and visible**!
   - Stock is reserved automatically.
5. Click **Mark as Preparing**:
   - Status advances to `Preparing`.
6. Click **Mark as Delivered**:
   - Status advances to `Delivered`.
   - The stock is consumed, and the **Rate & Review** button activates!

---

### Scenario 5: Two-Way Feedback & Star Ratings
1. While logged in as the Farmer, click **Rate & Review** on the delivered order:
   - Give 5 stars: `"Prompt gate receipt by the hostel kitchen supervisor."`
   - Submit feedback.
2. Switch to the Institution tab, refresh **My Orders**:
   - Click **Rate & Review**:
   - Give 5 stars: `"Fresh tomatoes received in excellent condition."`
   - Submit feedback.
3. Note that duplicate submissions are strictly prevented.

---

### Scenario 6: Bulk Requirements & Partial Offer Acceptance
1. As the Institution, click **Bulk Requirements**:
   - View the active requirement for **Sona Masoori Rice (600 kg)**.
   - Click **Review Offers**.
2. As a Farmer, open **Browse Bulk Requirements**:
   - Locate the rice tender and submit an offer for **300 kg** at **₹52/kg**.
3. Back in the Institution tab, refresh **Review Offers**:
   - View the incoming offer card.
   - Click **Accept Offer**:
   - Enter partial acceptance quantity: **200 kg** (accepting 200 out of 300 offered).
   - Confirm acceptance.
   - Observe that an order for **200 kg** is created, the requirement fulfillment progress bar increments, and the remaining 100 kg of the offer remains available!

---

### Scenario 7: Administrator Oversight & Account Approvals
1. Log in as **Administrator** (`admin@srgrec.edu.in` / `AdminSecurePass123!`).
2. View the **Admin Console**:
   - Real-time counts: Pending Users, Active Listings, Active Orders, Open Requirements.
   - Recent administrative audit logs showing user actions and timestamps.
3. Click **Users & Approvals**:
   - View registered farmers and institutions.
   - Demonstrate **Approve**, **Reject** (with reason popup), and **Suspend** actions.
   - Note that suspending an account immediately disables new procurement and closes pending offers.

---

## 3. Demonstration Summary
Every user workflow specified in the project requirements has been implemented and tested:
✅ Self-service registration & admin approval barrier.  
✅ Complete bilingual Telugu & English toggle.  
✅ Atomic stock reservation with overbooking protection.  
✅ Individual listing requests & status progression.  
✅ Bulk tendering with partial offer acceptance.  
✅ Contact privacy unlocked strictly upon acceptance.  
✅ Delivered order two-way star feedback.  
✅ Admin console with live metrics & audit history.
