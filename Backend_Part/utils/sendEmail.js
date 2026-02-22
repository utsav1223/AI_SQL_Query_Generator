const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const { PassThrough } = require("stream");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Use SSL/TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("Email transporter configuration error:", error);
  } else {
    console.log("Email server is ready to take our messages");
  }
});

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const buildEmailLayout = ({ title, subtitle, bodyHtml, metaRows = [], notice = "" }) => {
  const metaHtml = metaRows
    .map(
      (row) => `
        <tr>
          <td style="padding: 8px 0; color: #475569; font-size: 13px; font-weight: 600;">${escapeHtml(row.label)}</td>
          <td style="padding: 8px 0; color: #0f172a; font-size: 13px; font-weight: 700; text-align: right;">
            ${escapeHtml(row.value)}
          </td>
        </tr>
      `
    )
    .join("");

  return `
    <div style="margin: 0; padding: 24px; background: #f8fafc; font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a;">
      <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="max-width: 640px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background: #ffffff;">
        <tr>
          <td style="padding: 18px 24px; background: linear-gradient(120deg, #0f172a 0%, #111827 100%);">
            <p style="margin: 0; color: #34d399; font-size: 11px; letter-spacing: 0.14em; font-weight: 800; text-transform: uppercase;">
              SQL Studio
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 28px 24px 12px;">
            <h1 style="margin: 0; font-size: 26px; line-height: 1.25; color: #0f172a;">${title}</h1>
            <p style="margin: 10px 0 0; color: #475569; font-size: 14px; line-height: 1.65;">
              ${subtitle}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 0 24px 10px;">
            ${bodyHtml}
          </td>
        </tr>
        ${metaRows.length > 0
      ? `
          <tr>
            <td style="padding: 8px 24px 16px;">
              <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
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
            <td style="padding: 0 24px 18px;">
              <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 12px 14px; color: #065f46; font-size: 13px; line-height: 1.55;">
                ${notice}
              </div>
            </td>
          </tr>
        `
      : ""
    }
        <tr>
          <td style="padding: 16px 24px 22px; color: #64748b; font-size: 12px; line-height: 1.6;">
            This is an automated email from SQL Studio. If you did not request this action, please contact support.
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
      <div style="margin: 8px 0 0;">
        <p style="margin: 0 0 10px; color: #334155; font-size: 14px; line-height: 1.65;">
          Enter this one-time passcode to continue:
        </p>
        <div style="display: inline-block; padding: 12px 18px; border-radius: 10px; background: #0f172a; color: #34d399; font-size: 24px; letter-spacing: 0.22em; font-weight: 800;">
          ${escapeHtml(otp)}
        </div>
        <p style="margin: 14px 0 0; color: #475569; font-size: 13px; line-height: 1.7;">
          This OTP expires in <strong>10 minutes</strong> and can only be used once.
        </p>
      </div>
      <div style="margin-top: 16px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px; background: #f8fafc;">
        <p style="margin: 0; color: #334155; font-size: 13px; line-height: 1.65;">
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
      <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.7;">
        Payment was verified and your account has been upgraded to the Pro plan.
      </p>
    `,
    metaRows: [
      { label: "Invoice Number", value: invoiceNumber || "N/A" },
      { label: "Amount Paid", value: `INR ${amount}` },
      {
        label: "Renewal Date",
        value: renewalDate ? new Date(renewalDate).toDateString() : "N/A"
      }
    ],
    notice: "You can view all billing documents anytime from Dashboard -> Billing Records."
  });

exports.sendEmail = async ({ to, subject, html, attachments = [] }) => {
  await transporter.sendMail({
    from: `"SQL Studio" <${process.env.EMAIL_USER}>`,
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
