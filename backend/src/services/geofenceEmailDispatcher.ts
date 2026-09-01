import crypto from 'crypto';

export interface EmailDispatchLog {
  id: string;
  recipient_email: string;
  recipient_user_id: string;
  trust_id: string;
  type: 'EMAIL_1_OTP' | 'EMAIL_2_VERIFICATION_LINK';
  subject: string;
  body_text: string;
  body_html: string;
  timestamp: string;
  otp_code?: string;
  verification_url?: string;
  expires_at?: string;
}

export class GeofenceEmailDispatcher {
  private emailLogs: EmailDispatchLog[] = [];

  /**
   * Calculates Haversine distance in meters between two GPS coordinates.
   */
  public calculateDistanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Generates a 6-digit cryptographically random OTP.
   */
  public generateOtp(): string {
    const num = crypto.randomInt(100000, 999999);
    return num.toString();
  }

  /**
   * Generates a secure single-use form token.
   */
  public generateFormToken(trustId: string): string {
    const payload = `${trustId}:${Date.now()}:${crypto.randomBytes(8).toString('hex')}`;
    return crypto.createHash('sha256').update(payload).digest('hex').substring(0, 32);
  }

  /**
   * Dispatches the 2-Email pair when courier enters ~800m geofence.
   */
  public dispatchDoorstepEmails(
    recipientEmail: string,
    recipientUserId: string,
    trustId: string,
    orderId: string,
    merchantName: string,
    baseUrl: string = 'http://localhost:3000'
  ): {
    otp: string;
    formToken: string;
    expiresAt: string;
    email1: EmailDispatchLog;
    email2: EmailDispatchLog;
  } {
    const otp = this.generateOtp();
    const formToken = this.generateFormToken(trustId);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 20 * 60 * 1000).toISOString(); // 20 minutes expiry
    const verificationUrl = `${baseUrl}/verify?token=${formToken}&trustId=${trustId}`;

    // Email 1: OTP ONLY (No links, no forms)
    const email1: EmailDispatchLog = {
      id: `EML1_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      recipient_email: recipientEmail,
      recipient_user_id: recipientUserId,
      trust_id: trustId,
      type: 'EMAIL_1_OTP',
      subject: `Your Razorpay Trust-ID Delivery OTP: ${otp}`,
      body_text: `Your delivery agent for Order ${orderId} (${merchantName}) has entered your location.\n\nYour One-Time Doorstep Code is:\n\n   >>>  ${otp}  <<<\n\n(Expires in 20 minutes)\n\nShare this code only with your delivery agent if asked, or use it in the link from the next email notice.`,
      body_html: `
        <div style="font-family: Arial, sans-serif; max-width: 540px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0c2340; margin-bottom: 8px;">Razorpay Trust-ID Delivery Handover</h2>
          <p style="color: #475569; font-size: 14px;">Your courier has arrived within the delivery geofence for order <strong>${orderId}</strong>.</p>
          <div style="background-color: #f8fafc; border: 2px dashed #0c83fe; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px;">One-Time Security OTP</span>
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 6px; color: #0c83fe;">${otp}</span>
            <span style="display: block; color: #ef4444; font-size: 12px; margin-top: 6px;">⏱ Valid for 20 minutes</span>
          </div>
          <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
            🔒 <em>Share this code only with your delivery agent if asked, or use it in the verification link sent in Email 2.</em>
          </p>
        </div>
      `,
      timestamp: now.toISOString(),
      otp_code: otp,
      expires_at: expiresAt,
    };

    // Email 2: Verification Link (Options A, B, C form)
    const email2: EmailDispatchLog = {
      id: `EML2_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      recipient_email: recipientEmail,
      recipient_user_id: recipientUserId,
      trust_id: trustId,
      type: 'EMAIL_2_VERIFICATION_LINK',
      subject: `Complete Your Order Verification - Order ${orderId}`,
      body_text: `Please verify your package handover for Order ${orderId} by visiting:\n${verificationUrl}\n\nYou will need the 6-digit OTP sent in Email 1 to confirm package status.`,
      body_html: `
        <div style="font-family: Arial, sans-serif; max-width: 540px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0c2340; margin-bottom: 8px;">Verify Your Order Handover</h2>
          <p style="color: #475569; font-size: 14px;">Confirm receipt of your items for Order <strong>${orderId}</strong> from <strong>${merchantName}</strong>.</p>
          <div style="margin: 24px 0; text-align: center;">
            <a href="${verificationUrl}" style="background-color: #0c83fe; color: white; padding: 12px 28px; font-size: 15px; font-weight: bold; text-decoration: none; border-radius: 6px; display: inline-block;">
              Open 3-Option Verification Form →
            </a>
          </div>
          <p style="color: #64748b; font-size: 13px;">
            ⚠️ <em>You will be asked to enter the 6-digit code received in Email 1 and select whether the delivered product matches your order.</em>
          </p>
        </div>
      `,
      timestamp: new Date(now.getTime() + 500).toISOString(),
      verification_url: verificationUrl,
      expires_at: expiresAt,
    };

    this.emailLogs.unshift(email2);
    this.emailLogs.unshift(email1);

    return {
      otp,
      formToken,
      expiresAt,
      email1,
      email2,
    };
  }

  public getLogsForUser(userId: string): EmailDispatchLog[] {
    return this.emailLogs.filter(l => l.recipient_user_id === userId);
  }

  public getAllLogs(): EmailDispatchLog[] {
    return this.emailLogs;
  }
}

export const emailDispatcher = new GeofenceEmailDispatcher();
