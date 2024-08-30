const email = require('emailjs/email');

// Create a server connection
const server = email.server.connect({
    user: "layinatomb@gmail.com",
    password: "Qwe=-123",
    host: "smtp.gmail.com", // e.g., "smtp.gmail.com" for Gmail
    ssl: true,
});

// Send the email
server.send({
    text: "Your voucher code is xyz",
    from: "you <layinatomb@gmail.com>",
    to: "utsavjana1234@gmail.com",
    subject: "Your Voucher Code",
}, function (err, message) {
    console.log(err || message);
});