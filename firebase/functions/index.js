/**
 * Firebase Cloud Function (Gen 2): nhận POST JSON từ backend SLIFE, gửi mail qua SMTP.
 * Firebase không có dịch vụ SMTP riêng — bạn vẫn cần Gmail / SendGrid / v.v. trong biến môi trường.
 */
const {onRequest} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2");
const logger = require("firebase-functions/logger");
const nodemailer = require("nodemailer");

setGlobalOptions({
  region: "asia-southeast1",
  maxInstances: 10,
});

/**
 * POST body: { "to", "subject", "html", "from"? }
 * Header: Authorization: Bearer <MAIL_API_SECRET>
 *
 * Env (functions/.env khi deploy bằng Firebase CLI, hoặc cấu hình trong Console):
 *   MAIL_API_SECRET, MAIL_FROM, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 */
exports.sendSlifeMail = onRequest(
    {
      cors: false,
      invoker: "public",
    },
    async (req, res) => {
      if (req.method !== "POST") {
        res.set("Allow", "POST");
        res.status(405).send("Method Not Allowed");
        return;
      }

      const auth = req.get("authorization") || "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
      const secret = process.env.MAIL_API_SECRET || "";
      if (!secret || token !== secret) {
        res.status(401).send("Unauthorized");
        return;
      }

      let body = req.body;
      if (typeof body === "string") {
        try {
          body = JSON.parse(body);
        } catch (e) {
          res.status(400).send("Invalid JSON");
          return;
        }
      }

      const to = body && body.to;
      const subject = body && body.subject;
      const html = body && body.html;
      const fromOverride = body && body.from;

      if (!to || !subject || !html) {
        res.status(400).send("Missing to, subject, or html");
        return;
      }

      const fromAddr = (fromOverride || process.env.MAIL_FROM || "").trim();
      const host = (process.env.SMTP_HOST || "").trim();
      const user = (process.env.SMTP_USER || "").trim();
      const pass = process.env.SMTP_PASS || "";
      const port = parseInt(process.env.SMTP_PORT || "587", 10);

      if (!fromAddr || !host || !user || !pass) {
        logger.error("Missing MAIL_FROM or SMTP_* env");
        res.status(500).send("Server mail not configured");
        return;
      }

      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {user, pass},
      });

      try {
        await transporter.sendMail({
          from: fromAddr,
          to: String(to).trim(),
          subject: String(subject),
          html: String(html),
        });
        res.status(200).json({ok: true});
      } catch (err) {
        logger.error("sendMail failed", err);
        res.status(500).send(err.message || "send failed");
      }
    },
);
