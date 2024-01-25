const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
  // Read variables sent via POST from our SDK
  const { text } = req.body;

  let response = "";

  if (text === "") {
    // This is the first request. Prompt for serial number
    response = `CON Enter your serial number to proceed with the payment`;
  } else if (text === "123") {
    // Serial number entered, prompt for the amount
    response = `CON Enter the payment amount`;
  } else if (text.startsWith("PAY*")) {
    const paymentDetails = text.split("*");
    if (paymentDetails.length === 2) {
      // Extract the entered amount
      const amount = paymentDetails[1];

      // Log payment details in the console
      console.log(`Serial number: 123, Amount paid: K${amount}`);
      
      // Set the response to indicate successful payment
      response = `END Payment of K${amount} successful. Thank you!`;
    } else {
      // Invalid input
      response = `END Invalid input. Please try again.`;
    }
  } else {
    // Invalid input
    response = `END Invalid input. Please try again.`;
  }

  // Print the response onto the page so that our SDK can read it
  res.set("Content-Type: text/plain");
  res.send(response);
});

module.exports = router;
