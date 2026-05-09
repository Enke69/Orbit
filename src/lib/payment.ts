// Payment integration — QPay deeplink will be added here
// QPay is Mongolia's national QR payment standard
// Docs: https://qpay.mn/developers

export const TOPUP_PRICE_MNT_PER_1000_CHARS = 500; // ~$0.15 at current rate, adjust as needed
export const PRO_MONTHLY_PRICE_MNT = 25000;         // ~$7/mo, adjust as needed
export const PRO_MONTHLY_CHARS = 500_000;

export interface QPayInvoice {
  invoiceId: string;
  qrImage: string;     // base64 PNG
  deeplinks: {
    name: string;      // "QPay", "Khan Bank", "Golomt", etc.
    logo: string;
    link: string;      // app deeplink URL
  }[];
  expireDate: string;
}

// TODO: implement when QPay credentials are available
export async function createQPayInvoice(params: {
  userId: string;
  amountMnt: number;
  description: string;
  callbackUrl: string;
}): Promise<QPayInvoice> {
  // QPay deeplink integration goes here.
  // Steps:
  // 1. POST to https://merchant.qpay.mn/v2/invoice with Basic auth
  // 2. Return invoice_id, qr_image (base64), urls[] for each bank app
  throw new Error("QPay integration not yet configured — add credentials to .env.local");
}

export async function checkQPayPayment(invoiceId: string): Promise<boolean> {
  // Poll QPay to check if invoice has been paid
  // GET https://merchant.qpay.mn/v2/payment/check/{invoice_id}
  throw new Error("QPay integration not yet configured");
}
