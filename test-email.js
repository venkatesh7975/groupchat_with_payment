require("dotenv").config();

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

const mailOptions = {
  from: process.env.EMAIL,
  to: "venkateshmoyya7975@gmail.com",
  subject: "Test Email from Organized Backend",
  text: "This is a test email from your organized backend structure.",
  html: "<p>This is a <strong>test email</strong> sent from your organized Node.js backend.</p>",
};

transporter.sendMail(mailOptions, function (error, info) {
  if (error) {
    return console.log("Error: " + error.message);
  }
  console.log("Email sent: " + info.response);
});