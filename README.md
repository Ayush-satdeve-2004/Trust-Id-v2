# Trust-ID Engine v2.0
## Razorpay-Exclusive Admin Console, Merchant Hierarchy & Silent Autonomous Backend

Complete implementation of the **Trust-ID Engine Version 2.0** specification, featuring a two-layer architecture: a **Razorpay-Exclusive Trust Console** (Layer A) on top and an **Autonomous AI Engine** (Layer B) hidden underneath.

---

## 🌐 Live Production Deployment (Render)

- **Live Public App & WebSockets**: [https://trust-id-v2.onrender.com](https://trust-id-v2.onrender.com)
- **Live Customer Verification Webpage**: [https://trust-id-v2.onrender.com/verify](https://trust-id-v2.onrender.com/verify)

---

## 🏛️ Architecture

```
Layer A — Visible: Razorpay Trust Console (Razorpay Ops / Internal Systems only)
  ├── Screen 1: Merchant Directory (Searchable, Sortable, Live Alerts, Status Badges)
  ├── Screen 2: Merchant Profile (Score trend, Compliance strip, Customer List)
  ├── Screen 3: User Profile (Hashed User ID, Trust Score, Warning/Strike Logs, Scoped Orders)
  └── Screen 4: Trust-ID Detail (8-Step Handwritten Tracker + Bank-Ready PDF Dossier Synthesizer)

Layer B — Hidden: Silent Autonomous AI Backend
  ├── Module 1: Webhook Ingestion Router & Lifecycle Engine (132-day vault retention)
  ├── Module 2 & 7: Geofence GPS (~800m) & Two-Email Dispatcher (OTP + Signed 3-Option Link)
  ├── Module 3: Computer Vision (CV) Dock vs Doorstep Image Comparator
  ├── Module 4 & 13: Bank Dispute Dossier Synthesizer (ISO/IEC 27037 compliant PDF)
  ├── Module 5: Merchant SHA-256 Fingerprinting & Structural Deduplication Service
  └── Module 8 & 9: Trust Score, Penalty Matrix & Warning Escalation Engine
```

---

## 🚀 Local Development

### 1. Run Unified Server
```bash
npm start
```
- **Local Web Console & API & WebSockets**: `http://localhost:3000`
- **Local Customer Verification Webpage**: `http://localhost:3000/verify`

### 2. Run Automated Test Suite
```bash
npm test
```
Executes all 28 unit & integration tests validating fingerprinting, deduplication, two-email geofence dispatcher, CV comparator, 0 baseline +/-1 point scoring matrices, and ISO/IEC dispute dossier PDF generation.

---

## 📋 Features Implemented

1. **Merchant Fingerprint & Deduplication (Section 3)**:
   - Computes `SHA256( PAN + GSTIN + bank_account_number_hash + business_registration_number )`.
   - Structural collision detection: Re-links existing `MID_RZP_<REGION>_<8-CHAR-BASE36>` instead of creating duplicate accounts.
2. **Strict Drill-Down Hierarchy (Section 4 & 5)**:
   - `Razorpay › Merchant › User › Trust-ID` with breadcrumb navigation.
3. **8-Step Handwritten Trust-ID Pipeline (Section 5.4)**:
   - Tracks: `Order ID`, `Amount`, `Delivery Address`, `Order Location Tracking`, `Delivery SLA`, `Points`, `Digital Signature`, and `Before/After CV Images`.
   - Real-time color state transitions (`Grey` -> `Amber` -> `Green`).
4. **Two-Email Doorstep Verification Flow (Section 7)**:
   - **Email 1**: OTP only, dispatched when courier enters ≈800m geofence (valid 20m).
   - **Email 2**: Secure single-use link to 3-option form (`https://trust-id-v2.onrender.com/verify?token=...&trustId=...`).
   - Server-side OTP validation with retry limits and automated strike logging.
5. **Warning System & Non-Delivery Liability (Section 8)**:
   - Section 8.1: First offense = formal warning (-1 pt); repeat offense = blacklisted & score -2 pts.
   - Section 8.2: 0 telemetry expiry defaults fault to merchant non-delivery (-1 pt).
6. **Section 9 Point System**:
   - Baseline 0 points for all new merchants and customers.
   - Increments increase score by +1 pt.
   - Decrements decrease score by -1 pt.
7. **Final ISO/IEC Dispute Dossier PDF (Section 13)**:
   - Auto-generated upon 8 steps completion; re-exportable during the 120-day Bank Evidence Vault window.
