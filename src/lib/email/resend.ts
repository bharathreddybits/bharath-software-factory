import { Resend } from "resend";
import factoryConfig from "@/src/config/factory.config";

// ── Lazy singleton ─────────────────────────────────────────────────────────────

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY must be set in .env.local");
    _resend = new Resend(key);
  }
  return _resend;
}

// ── Base email template ────────────────────────────────────────────────────────

export function baseEmailTemplate(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { margin: 0; padding: 0; background: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
    .header { background: #09090b; padding: 24px 32px; }
    .header-title { color: #ffffff; font-size: 18px; font-weight: 600; margin: 0; letter-spacing: -0.02em; }
    .body { padding: 32px; color: #3f3f46; font-size: 15px; line-height: 1.6; }
    .body p { margin: 0 0 16px; }
    .footer { padding: 20px 32px; background: #fafafa; border-top: 1px solid #e4e4e7; font-size: 12px; color: #a1a1aa; text-align: center; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <p class="header-title">${factoryConfig.product.name}</p>
    </div>
    <div class="body">${bodyHtml}</div>
    <div class="footer">
      You're receiving this because you have an account with ${factoryConfig.product.name}.
      &copy; ${new Date().getFullYear()} ${factoryConfig.legal.companyName}.
    </div>
  </div>
</body>
</html>`;
}

// ── Send helper ────────────────────────────────────────────────────────────────

type SendOptions = {
  to: string;
  subject: string;
  html: string;
};

const FROM_ADDRESS =
  process.env.RESEND_FROM_ADDRESS ??
  `${factoryConfig.product.name} <noreply@${factoryConfig.product.domain}>`;

export async function sendTransactionalEmail({ to, subject, html }: SendOptions): Promise<void> {
  const { error } = await getResend().emails.send({
    from: FROM_ADDRESS,
    to,
    subject,
    html: baseEmailTemplate(html),
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}
