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

async function sendEmail(title, message, html) {
    const mailOptions = {
        from: '"EasyRent" easyrent@gmail.com',
        to: 'mirai1st04@gmail.com', 
        subject: title,
        text: message, 
        html: html,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log('Error occurred:', error.message);
        }
        console.log('Message sent successfully! Message ID:', info.messageId);
    });
}

const text = 
    `
        <h3>Hai! Terima kasih kerana menggunakan perkhidmatan EasyRent.</h3>
        <br>
        <p>Untuk melengkapkan proses pendaftaran anda, sila masukkan kod 6 digit berikut:</p>
        <p><strong>123456</strong></p>
        <p>Kod ini hanya sah untuk tempoh yang terhad. Jika anda tidak meminta kod ini, sila abaikan mesej ini.</p>
    `;

sendEmail("test", "test message", text);

