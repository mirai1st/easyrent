const nodemailer = require('nodemailer');
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendEmail(to, title, message, html) {
    const recipient = String(to || '').trim();

    if (!recipient) {
        throw new Error('Recipient email is required.');
    }

    const mailOptions = {
        from: '"EasyRent" <' + process.env.EMAIL_USER + '>',
        to: recipient,
        subject: title,
        text: message,
        html: html,
    };

    return transporter.sendMail(mailOptions);
}

async function verifyEmailTransport() {
    return transporter.verify();
}

async function sendVerificationEmail(to, code) {
    const html = `
        <h3>Hai! Terima kasih kerana menggunakan perkhidmatan EasyRent.</h3>
        <br>
        <p>Untuk melengkapkan proses pendaftaran anda, sila masukkan kod 6 digit berikut:</p>
        <p><strong>${code}</strong></p>
        <p>Kod ini hanya sah untuk tempoh 10 minit. Jika anda tidak meminta kod ini, sila abaikan mesej ini.</p>
    `;

    return sendEmail(
        to,
        "Kod Pengesahan EasyRent",
        `Kod pengesahan anda ialah: ${code}. Kod ini sah untuk 10 minit.`,
        html
    );
}

async function sendCustomEmail(to, msg) {
    return sendEmail(
        to,
        msg
    );
}

module.exports = { sendEmail, sendVerificationEmail, verifyEmailTransport };
