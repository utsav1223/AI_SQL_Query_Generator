const nodemailer = require("nodemailer");
const axios = require("axios");
const PDFDocument = require("pdfkit");
const { PassThrough } = require("stream");
const logger = require("./logger");

const EMAIL_PROVIDER = (
  process.env.EMAIL_PROVIDER ||
  (process.env.RESEND_API_KEY ? "resend" : "smtp")
).toLowerCase();
const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";
const EMAIL_PORT = Number(process.env.EMAIL_PORT || 465);
const EMAIL_SECURE = process.env.EMAIL_SECURE
  ? process.env.EMAIL_SECURE === "true"
  : EMAIL_PORT === 465;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || (EMAIL_USER ? `"SQL Studio" <${EMAIL_USER}>` : null);
const EMAIL_CONNECTION_TIMEOUT_MS = Number(process.env.EMAIL_CONNECTION_TIMEOUT_MS || 10000);
const EMAIL_GREETING_TIMEOUT_MS = Number(process.env.EMAIL_GREETING_TIMEOUT_MS || 10000);
const EMAIL_SOCKET_TIMEOUT_MS = Number(process.env.EMAIL_SOCKET_TIMEOUT_MS || 15000);
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "utsavjha93030@gmail.com";

const emailAuthConfigured = Boolean(EMAIL_USER && EMAIL_PASS);
const transporter = EMAIL_PROVIDER === "smtp" && emailAuthConfigured
  ? nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_SECURE,
    connectionTimeout: EMAIL_CONNECTION_TIMEOUT_MS,
    greetingTimeout: EMAIL_GREETING_TIMEOUT_MS,
    socketTimeout: EMAIL_SOCKET_TIMEOUT_MS,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS
    }
  })
  : null;

// Verify SMTP connection configuration
if (EMAIL_PROVIDER === "smtp" && transporter) {
  transporter.verify((error) => {
    if (error) {
      logger.error("Email transporter configuration error", error, { provider: EMAIL_PROVIDER });
    } else {
      logger.info("Email server is ready to send messages", { provider: EMAIL_PROVIDER });
    }
  });
} else if (EMAIL_PROVIDER === "smtp") {
  logger.warn("Email transport disabled: set EMAIL_USER and EMAIL_PASS to enable outbound emails.");
} else if (EMAIL_PROVIDER === "resend") {
  if (!RESEND_API_KEY) {
    logger.warn("Email transport disabled: set RESEND_API_KEY to enable Resend emails.");
  } else {
    logger.info("Email provider set to Resend API", { provider: EMAIL_PROVIDER });
  }
}

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const buildEmailLayout = ({ title, subtitle, bodyHtml, metaRows = [], notice = "", accent = "#0f766e" }) => {
  const metaHtml = metaRows
    .map(
      (row) => `
        <tr>
          <td style="padding: 13px 0; color: #64748b; font-size: 13px; font-weight: 700; line-height: 1.4; border-bottom: 1px solid #e2e8f0;">${escapeHtml(row.label)}</td>
          <td style="padding: 13px 0; color: #0f172a; font-size: 13px; font-weight: 800; line-height: 1.4; text-align: right; border-bottom: 1px solid #e2e8f0;">
            ${escapeHtml(row.value)}
          </td>
        </tr>
      `
    )
    .join("");

  return `
    <div style="margin: 0; padding: 0; background: #eef2f7; font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a;">
      <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent;">
        ${subtitle}
      </div>
      <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="width: 100%; background: #eef2f7;">
        <tr>
          <td style="padding: 28px 14px;">
            <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="max-width: 680px; margin: 0 auto;">
              <tr>
                <td style="padding: 0 0 14px;">
                  <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="border-radius: 18px 18px 0 0; overflow: hidden; background: #0f172a;">
                    <tr>
                      <td style="padding: 22px 24px; background: #0f172a;">
                        <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                          <tr>
                            <td style="vertical-align: middle;">
                              <div style="display: inline-block; width: 38px; height: 38px; border-radius: 10px; background: ${accent}; color: #ffffff; text-align: center; line-height: 38px; font-size: 18px; font-weight: 900;">
                                SQL
                              </div>
                            </td>
                            <td style="padding-left: 12px; vertical-align: middle;">
                              <p style="margin: 0; color: #ffffff; font-size: 14px; letter-spacing: 0.12em; font-weight: 900; text-transform: uppercase;">
                                AI SQL Studio
                              </p>
                              <p style="margin: 4px 0 0; color: #99f6e4; font-size: 11px; letter-spacing: 0.1em; font-weight: 700; text-transform: uppercase;">
                                Secure SQL workspace
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #dbe3ef; border-radius: 0 0 18px 18px; overflow: hidden; background: #ffffff; box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);">
                  <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                    <tr>
                      <td style="padding: 30px 28px 12px;">
                        <p style="margin: 0 0 10px; color: ${accent}; font-size: 11px; letter-spacing: 0.14em; font-weight: 900; text-transform: uppercase;">
                          Account notification
                        </p>
                        <h1 style="margin: 0; color: #0f172a; font-size: 28px; line-height: 1.22; font-weight: 900; letter-spacing: -0.01em;">
                          ${title}
                        </h1>
                        <p style="margin: 12px 0 0; color: #475569; font-size: 15px; line-height: 1.7; font-weight: 500;">
                          ${subtitle}
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 28px 18px;">
                        ${bodyHtml}
                      </td>
                    </tr>
        ${metaRows.length > 0
      ? `
                    <tr>
                      <td style="padding: 0 28px 20px;">
                        <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="border-top: 1px solid #e2e8f0;">
                          ${metaHtml}
                        </table>
                      </td>
                    </tr>
        `
      : ""
    }
        ${notice
      ? `
                    <tr>
                      <td style="padding: 0 28px 22px;">
                        <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-left: 4px solid ${accent}; border-radius: 12px; padding: 14px 16px; color: #115e59; font-size: 13px; line-height: 1.65; font-weight: 700;">
                          ${notice}
                        </div>
                      </td>
                    </tr>
        `
      : ""
    }
                    <tr>
                      <td style="padding: 18px 28px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; line-height: 1.65; font-weight: 500;">
                        <p style="margin: 0;">
                          This is an automated email from AI SQL Studio. If you did not request this action, contact support at
                          <a href="mailto:${escapeHtml(SUPPORT_EMAIL)}" style="color: ${accent}; font-weight: 800; text-decoration: none;">${escapeHtml(SUPPORT_EMAIL)}</a>.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
};

exports.buildPasswordResetOtpEmail = ({ name, otp }) =>
  buildEmailLayout({
    title: "Verify your password reset request",
    subtitle: `Hello ${escapeHtml(name || "there")}, we received a request to reset your SQL Studio password.`,
    bodyHtml: `
      <div style="margin: 4px 0 0; border: 1px solid #dbe3ef; border-radius: 14px; background: #f8fafc; padding: 18px;">
        <p style="margin: 0 0 12px; color: #334155; font-size: 14px; line-height: 1.65; font-weight: 700;">
          Enter this one-time passcode to continue.
        </p>
        <div style="margin: 0; border-radius: 12px; background: #0f172a; padding: 16px 18px; text-align: center;">
          <span style="display: inline-block; color: #5eead4; font-family: 'Courier New', monospace; font-size: 30px; letter-spacing: 0.24em; font-weight: 900;">
            ${escapeHtml(otp)}
          </span>
        </div>
        <p style="margin: 14px 0 0; color: #475569; font-size: 13px; line-height: 1.7; font-weight: 600;">
          This OTP expires in <strong>10 minutes</strong> and can only be used once.
        </p>
      </div>
      <div style="margin-top: 14px; border: 1px solid #fde68a; border-left: 4px solid #f59e0b; border-radius: 12px; padding: 13px 15px; background: #fffbeb;">
        <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.65; font-weight: 700;">
          If you did not request this reset, you can safely ignore this email. Your password will remain unchanged.
        </p>
      </div>
    `,
    metaRows: [
      { label: "Security Code", value: "Password Reset OTP" },
      { label: "Validity", value: "10 minutes" }
    ],
    notice: "SQL Studio support will never ask you for your OTP."
  });

exports.buildSubscriptionActivatedEmail = ({ name, invoiceNumber, amount, renewalDate }) =>
  buildEmailLayout({
    title: "Subscription activated successfully",
    subtitle: `Hello ${escapeHtml(name || "there")}, your SQL Studio Pro subscription is now active.`,
    bodyHtml: `
      <div style="margin: 4px 0 0; border: 1px solid #bbf7d0; border-radius: 14px; background: #f0fdf4; padding: 18px;">
        <p style="margin: 0; color: #166534; font-size: 14px; line-height: 1.7; font-weight: 800;">
          Payment was verified and your account has been upgraded to the Pro plan.
        </p>
      </div>
      <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="margin-top: 14px; border: 1px solid #dbe3ef; border-radius: 14px; background: #ffffff;">
        <tr>
          <td style="padding: 16px 18px;">
            <p style="margin: 0 0 10px; color: #0f172a; font-size: 14px; line-height: 1.5; font-weight: 900;">
              Pro workspace unlocked
            </p>
            <p style="margin: 0; color: #475569; font-size: 13px; line-height: 1.7; font-weight: 600;">
              You can now use advanced SQL tools, full history archive, analytics, billing records, and priority workflow support.
            </p>
          </td>
        </tr>
      </table>
    `,
    metaRows: [
      { label: "Invoice Number", value: invoiceNumber || "N/A" },
      { label: "Amount Paid", value: `INR ${amount}` },
      {
        label: "Renewal Date",
        value: renewalDate ? new Date(renewalDate).toDateString() : "N/A"
      }
    ],
    notice: "You can view all billing documents anytime from Dashboard -> Billing Records.",
    accent: "#0f766e"
  });

exports.sendEmail = async ({ to, subject, html, attachments = [] }) => {
  if (EMAIL_PROVIDER === "resend") {
    if (!RESEND_API_KEY) {
      throw new Error("Resend email transport is not configured.");
    }

    const resendAttachments = attachments
      .map((item) => {
        if (!item?.content) return null;

        const contentBuffer = Buffer.isBuffer(item.content)
          ? item.content
          : Buffer.from(item.content);

        return {
          filename: item.filename || "attachment",
          content: contentBuffer.toString("base64")
        };
      })
      .filter(Boolean);

    await axios.post(
      "https://api.resend.com/emails",
      {
        from: EMAIL_FROM || "SQL Studio <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
        attachments: resendAttachments
      },
      {
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: EMAIL_SOCKET_TIMEOUT_MS
      }
    );

    return;
  }

  if (!transporter) {
    throw new Error("SMTP email transport is not configured.");
  }

  await transporter.sendMail({
    from: EMAIL_FROM || `"SQL Studio" <${EMAIL_USER}>`,
    to,
    subject,
    html,
    attachments
  });
};

exports.generateInvoice = (user, paymentId, renewalDate) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = new PassThrough();
    const buffers = [];

    doc.pipe(stream);
    doc.fontSize(20).text("SQL Studio - Invoice", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Invoice ID: ${paymentId}`);
    doc.text(`Customer: ${user.name}`);
    doc.text(`Email: ${user.email}`);
    doc.text("Plan: Pro (Monthly)");
    doc.text("Amount: INR 499");
    doc.text(`Renewal Date: ${renewalDate.toDateString()}`);
    doc.text(`Issued On: ${new Date().toDateString()}`);
    doc.end();

    stream.on("data", (chunk) => buffers.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(buffers)));
    stream.on("error", reject);
  });
