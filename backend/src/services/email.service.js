const MailService = {
  // Send the email
  async sendEmail({ to, subject, html }) {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL || "dasp98458@gmail.com";

    if (!apiKey) {
      throw new Error("BREVO_API_KEY environment variable is not defined");
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "SwiftCart",
          email: senderEmail,
        },
        to: [
          {
            email: to,
          },
        ],
        subject,
        htmlContent: html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Brevo API error: ${errorText}`);
    }

    const data = await response.json();
    console.log("Email sent successfully via Brevo API:", data);
    return data;
  },

  // Send the confirmation email
  async sendConfirmation(to, order) {
    const subject = `Order Confirmation - #${order.id.slice(0, 8)}`;
    const html = `
      <div style="font-family: sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
        <h2 style="color: #4F46E5;">Thank you for your order!</h2>
        <p>Hi,</p>
        <p>Your purchase was successful. We are processing your order: <strong>#${order.id}</strong></p>
        <p>Total amount charged: <strong>₹${order.total_amount}</strong></p>
        <p>We'll notify you as soon as your products are shipped.</p>
        <br/>
        <p>Best regards,<br/>Team SwiftCart</p>
      </div>
    `;

    return this.sendEmail({ to, subject, html });
  },
};

module.exports = { MailService };