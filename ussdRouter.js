const express = require("express");
const db = require("./db");
const router = express.Router();
const http = require("http").Server(express);
const io = require("socket.io")(http);
const crypto = require("crypto");
const bcrypt = require("bcrypt");
module.exports = function (pool) {
  router.post("/", async (req, res) => {
    const { sessionId, serviceCode, phoneNumber, text } = req.body;
    let response = "";

    try {
      if (text === "") {
        response = `CON Welcome to E-Ticketing
            1. My account
            2. Make Payments
            3.Change pin`;
      } else if (text === "1") {
        response = `CON Choose account information you want to view
            1. Account number
            2. Account balance
           
            `;
      } else if (text === "2") {
        response = `CON Enter your serial number`;
      } else if (text.startsWith("2*")) {
        const parts = text.split("*");

        if (parts.length === 2) {
          const serialNumber = parts[1];
          // Check if the serial number exists in the database
          const queryResult = await db.query(
            "SELECT full_name FROM users WHERE id = $1 ORDER BY id",
            [serialNumber]
          );

          if (queryResult.rows.length === 1) {
            const { full_name } = queryResult.rows[0];
            response = `CON you want to pay as ${full_name}\nEnter the payment amount:`;
          } else {
            response = `END User does not exist. Please enter a valid serial number.`;
          }
        } else if (parts.length === 3) {
          const serialNumber = parts[1];
          const paymentAmount = parts[2];

          // Ask the user to enter their PIN for confirmation
          response = `CON Confirm payment of K${paymentAmount} for serial number ${serialNumber}. Enter your PIN:`;
        } else if (parts.length === 4) {
          const serialNumber = parts[1];
          const paymentAmount = parts[2];
          const enteredPIN = parts[3];

          // Retrieve the hashed PIN from the database for the specified user
          const userResult = await db.query(
            "SELECT pin FROM my_table WHERE payment_id = $1",
            [serialNumber]
          );
          const hashedPIN = userResult.rows[0].pin;
          //const storedPaymentAmount = userResult.rows[0].payment_amount;

          // Compare the entered PIN with the stored hashed PIN
          const isPINValid = await bcrypt.compare(enteredPIN, hashedPIN);

          if (isPINValid) {
            // Retrieve the stored payment amount (default to 0 if null or undefined)
            const storedPaymentAmount = userResult.rows[0].payment_amount || 0;

            // Update payment status in my_table
            await db.query(
              "UPDATE my_table SET payment_status = $1, payment_amount = $2 WHERE payment_id = $3",
              [
                "paid",
                storedPaymentAmount + parseFloat(paymentAmount),
                serialNumber,
              ]
            );

            // Update payment status in users table
            await db.query(
              "UPDATE my_table SET payment_status = $1 WHERE payment_id = $2",
              ["paid", serialNumber]
            );

            // Notify the dashboard about the payment using WebSocket
            const paymentUpdateData = { serialNumber, paymentStatus: "paid" };
            console.log("Sending payment update:", paymentUpdateData);
            io.emit("paymentUpdate", paymentUpdateData);

            response = `END Payment of K${paymentAmount} for serial number ${serialNumber} successful. Thank you!`;
          } else {
            // Incorrect PIN entered
            response = `END Wrong PIN. Payment canceled.`;
          }
        }
      } else if (text === "1*1") {
        const accountNumber = "ACC100101";
        response = `END Your account number is ${accountNumber}`;
      } else if (text === "1*2") {
        const balance = "K 10,000";
        response = `END Your balance is ${balance}`;
      }
    } catch (error) {
      console.error("Error processing request:", error);
      response = `END An error occurred. Please try again later.`;
    } finally {
      res.set("Content-Type", "text/plain");
      res.send(response);
    }
  });

  // Attach socket.io to the Express application
  express.io = io;

  return router;
};
