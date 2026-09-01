import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { store } from './db/store.js';
import { emailDispatcher } from './services/geofenceEmailDispatcher.js';
import { generateDisputeDossierPdf } from './services/dossierPdfGenerator.js';
import { comparePackageImages } from './services/cvComparator.js';

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// Serve Production React Frontend Dist
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.send(JSON.stringify({
    type: 'INITIAL_SYNC',
    payload: {
      merchants: store.getAllMerchants(),
      alerts: store.getAlerts(),
    }
  }));

  ws.on('close', () => {
    clients.delete(ws);
  });

  ws.on('error', (err) => {
    console.error('WebSocket connection error:', err);
    clients.delete(ws);
  });
});

// Broadcast events from store to all WS clients
store.subscribe((event) => {
  const message = JSON.stringify(event);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
});

// ==========================================
// 1. Razorpay Console APIs (Screens 1 to 4)
// ==========================================

// Screen 1: Merchant Directory
app.get('/api/merchants', (_req: Request, res: Response) => {
  res.json({
    success: true,
    merchants: store.getAllMerchants(),
  });
});

// Screen 2: Merchant Profile
app.get('/api/merchants/:id', (req: Request, res: Response) => {
  const merchant = store.getMerchant(req.params.id);
  if (!merchant) {
    return res.status(404).json({ success: false, error: 'Merchant not found' });
  }
  res.json({
    success: true,
    merchant,
  });
});

// Screen 3: User Profile (scoped to merchant)
app.get('/api/merchants/:mid/users/:uid', (req: Request, res: Response) => {
  const merchant = store.getMerchant(req.params.mid);
  if (!merchant) {
    return res.status(404).json({ success: false, error: 'Merchant not found' });
  }
  const user = merchant.users.find(u => u.user_id === req.params.uid);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found under this merchant' });
  }
  res.json({
    success: true,
    merchant_id: merchant.merchant_id,
    business_name: merchant.business_name,
    user,
  });
});

// Screen 4: Trust-ID Detail & 8-Step Tracker
app.get('/api/trust-id/:tid', (req: Request, res: Response) => {
  const { merchant, user, trustId } = store.findTrustId(req.params.tid);
  if (!trustId || !merchant || !user) {
    return res.status(404).json({ success: false, error: 'Trust-ID record not found' });
  }
  res.json({
    success: true,
    merchant,
    user,
    trustId,
  });
});

// Download / Export Bank Dispute Dossier PDF
app.get('/api/trust-id/:tid/dossier.pdf', async (req: Request, res: Response) => {
  try {
    const { merchant, user, trustId } = store.findTrustId(req.params.tid);
    if (!trustId || !merchant || !user) {
      return res.status(404).json({ success: false, error: 'Trust-ID not found' });
    }

    const pdfBuffer = await generateDisputeDossierPdf(trustId, merchant, user);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="TrustID_Dossier_${trustId.trust_id}.pdf"`);
    res.send(pdfBuffer);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Real-Time Alerts Feed
app.get('/api/alerts', (_req: Request, res: Response) => {
  res.json({
    success: true,
    alerts: store.getAlerts(),
  });
});

// ==========================================
// 2. Webhooks & Ingestion
// ==========================================

app.post('/api/webhooks/merchant-connect', (req: Request, res: Response) => {
  try {
    const { business_name, pan, gstin, bank_account_number, business_registration_number, region } = req.body;
    if (!business_name || !pan || !gstin || !bank_account_number || !business_registration_number) {
      return res.status(400).json({ success: false, error: 'Missing required merchant credentials' });
    }

    const result = store.onboardOrRelinkMerchant({
      business_name,
      pan,
      gstin,
      bank_account_number,
      business_registration_number,
      region,
    });

    res.json({
      success: true,
      isNew: result.isNew,
      merchant_id: result.merchant.merchant_id,
      merchant_fingerprint: result.merchant.merchant_fingerprint,
      merchant: result.merchant,
      alert: result.alert,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/webhooks/checkout-order', (req: Request, res: Response) => {
  try {
    const { merchant_id, order_id, amount, currency, items_summary, customer_name, customer_email, customer_phone, delivery_address } = req.body;
    if (!merchant_id || !order_id || !amount || !customer_email) {
      return res.status(400).json({ success: false, error: 'Missing order parameters' });
    }

    const result = store.createOrderAndTrustId(merchant_id, {
      order_id,
      amount: Number(amount),
      currency: currency || 'INR',
      items_summary: items_summary || 'General Merchandise',
      customer_name: customer_name || 'Customer',
      customer_email,
      customer_phone: customer_phone || '+91 9876543210',
      delivery_address: delivery_address || 'Delivery Address',
    });

    res.json({
      success: true,
      trust_id: result.trustId.trust_id,
      user_id: result.user.user_id,
      trustId: result.trustId,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/webhooks/courier-gps', (req: Request, res: Response) => {
  try {
    const { trust_id, lat, lng } = req.body;
    if (!trust_id) {
      return res.status(400).json({ success: false, error: 'trust_id is required' });
    }

    const result = store.triggerGeofenceEntry(trust_id, lat || 12.9718, lng || 77.5948);
    res.json({
      success: true,
      trustId: result.trustId,
      email1: result.email1,
      email2: result.email2,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 3. Customer Verification Form APIs
// ==========================================

app.get('/api/verification/details', (req: Request, res: Response) => {
  const { token, trustId } = req.query;
  if (!token || !trustId) {
    return res.status(400).json({ success: false, error: 'Token and trustId are required' });
  }

  const { merchant, trustId: record } = store.findTrustId(String(trustId));
  if (!record || !merchant) {
    return res.status(404).json({ success: false, error: 'Invalid verification session' });
  }

  res.json({
    success: true,
    order_id: record.order_meta.order_id,
    merchant_name: merchant.business_name,
    amount: record.order_meta.amount,
    currency: record.order_meta.currency,
    items_summary: record.order_meta.items_summary,
    delivery_address: record.order_meta.delivery_address,
    is_verified: record.otp_meta.verified,
    attempts_remaining: record.otp_meta.max_attempts - record.otp_meta.attempts,
    expires_at: record.otp_meta.expires_at,
  });
});

app.post('/api/verification/submit', async (req: Request, res: Response) => {
  try {
    const { token, trust_id, otp, outcome, is_simulation } = req.body;
    if (!trust_id || !outcome) {
      return res.status(400).json({ success: false, error: 'trust_id and outcome are required' });
    }

    if (!['A_SAME', 'B_DIFFERENT', 'C_MISMATCH'].includes(outcome)) {
      return res.status(400).json({ success: false, error: 'Invalid outcome option' });
    }

    const result = await store.submitVerificationForm(
      token || '', 
      trust_id, 
      otp || '', 
      outcome, 
      Boolean(is_simulation)
    );

    if (!result.success && !is_simulation) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 4. Autonomous AI Backend Simulation Suite
// ==========================================

// AI Autonomous Full Automation Pipeline
app.post('/api/simulation/auto-flow', async (req: Request, res: Response) => {
  try {
    const { trust_id, outcome } = req.body;
    if (!trust_id) {
      return res.status(400).json({ success: false, error: 'trust_id is required' });
    }

    // Step 1: Trigger Geofence GPS (~800m)
    const geofenceRes = store.triggerGeofenceEntry(trust_id);

    // Step 2: Auto-verify with selected outcome (or default A_SAME)
    const targetOutcome = outcome || 'A_SAME';
    const verifyRes = await store.submitVerificationForm(
      geofenceRes.trustId.otp_meta.form_token,
      trust_id,
      geofenceRes.trustId.otp_meta.otp_code,
      targetOutcome,
      true
    );

    res.json({
      success: true,
      message: `🤖 Autonomous AI Automation executed for ${trust_id}: GPS Geofence -> OTP Dispatched -> ${targetOutcome} Verified -> Dossier PDF Synthesized.`,
      geofence: geofenceRes,
      verification: verifyRes,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/simulation/emails', (_req: Request, res: Response) => {
  res.json({
    success: true,
    emails: emailDispatcher.getAllLogs(),
  });
});

app.post('/api/simulation/cv-compare', (req: Request, res: Response) => {
  const { dock_photo, doorstep_photo, force_discrepancy } = req.body;
  const result = comparePackageImages(dock_photo || 'dock_baseline_image', doorstep_photo || 'doorstep_image', force_discrepancy);
  res.json({ success: true, result });
});

app.post('/api/simulation/trigger-expiry', (req: Request, res: Response) => {
  try {
    const { trust_id } = req.body;
    const trustId = store.triggerNonDeliveryExpiry(trust_id);
    res.json({ success: true, trustId });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// SPA Fallback: serve index.html for non-API routes (e.g. /verify?token=...&trustId=...)
app.get('*', (_req: Request, res: Response) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Build frontend using npm run build:frontend first.');
  }
});

server.listen(port, () => {
  console.log(`[Trust-ID Engine v2.0] Unified Server running on http://localhost:${port}`);
  console.log(`[Trust-ID Engine v2.0] WebSockets active on ws://localhost:${port}`);
});
