const express = require("express");
const db = require("./db");
const router = express.Router();
const http = require("http").Server(express);
const io = require("socket.io")(http);
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const twilio = require('twilio');
const Nexmo = require('nexmo');
//{"success":true,"message":"User registered successfully","userId":2,"pin":7735}
const { createAndCaptureOrder } = require('./payment.js');
module.exports = function (pool) {
  // Configure Vonage client
  
  const nexmo= new Nexmo({
    apiKey: "4aab9303",
    apiSecret: "2jVuB4fjvEhPp5gR"
  })

const vonagePhoneNumber = "Vonage APIs";  

  router.post("/", async (req, res) => {
    const { sessionId, serviceCode, phoneNumber, text } = req.body;
    let response = "";

    try {
      if (text === "") {
        response = `CON Welcome to E-Ticketing
            1. My account
            2. Make Payments
            3. Change pin`;
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

          // Compare the entered PIN with the stored hashed PIN
          const isPINValid = await bcrypt.compare(enteredPIN, hashedPIN);

          if (isPINValid) {
            createAndCaptureOrder()
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
      
             // Send a message using Vonage after successful payment
          const messageBody = `Payment of K${paymentAmount} for serial number ${serialNumber} successful. Thank you!`;

          nexmo.message.sendSms(vonagePhoneNumber, '265992834962',messageBody, (err, responseData) => {
            if (err) {
              console.log('Error sending Vonage SMS:', err);
            } else {
              if (responseData.messages[0].status === "0") {
                console.log("Vonage SMS sent successfully:", responseData);
              } else {
                console.log(`Vonage SMS failed with status: ${responseData.messages[0]['status']}`);
              }
            }
          });

          response = `END ${messageBody}`;
          } else {
            // Incorrect PIN entered
            response = `END Wrong PIN. Payment canceled.`;
          }
        }
      } else if (text === "1*1") {
        const accountNumber = "ACC100101";
        response = `END Your serial number is ${accountNumber}`;
      } else if (text === "1*2") {
        const result = await db.query('SELECT SUM(payment_amount) AS total_sales FROM my_table');
        const totalSales = result.rows[0].total_sales;
        response = `END Your balance is ${totalSales}`;
      }
      else if (text === "3") {
        response = `CON Enter your serial number to change PIN:`;
      } else if (text.startsWith("3*")) {
        const parts = text.split("*");
  
        if (parts.length === 2) {
          const serialNumber = parts[1];
          // Check if the serial number exists in the database
          const serialQuery = 'SELECT id FROM users WHERE id = $1';
          const serialResult = await db.query(serialQuery, [serialNumber]);
  
          if (serialResult.rows.length === 1) {
            response = `CON Enter your old PIN:`;
          } else {
            response = `END Invalid serial number. Please enter a valid serial number.`;
          }
        } else if (parts.length === 3) {
          const serialNumber = parts[1];
          const oldPin = parts[2];
  
          // Retrieve the hashed PIN from the database for the specified user
          const pinQuery = 'SELECT pin FROM my_table WHERE payment_id = $1';
          const pinResult = await db.query(pinQuery, [serialNumber]);
          const hashedPIN = pinResult.rows[0].pin;
  
          // Compare the entered old PIN with the stored hashed PIN
          const isPINValid = await bcrypt.compare(oldPin, hashedPIN);
  
          if (isPINValid) {
            response = `CON Enter your new 4-digit PIN:`;
          } else {
            // Incorrect old PIN entered
            response = `END Wrong old PIN. PIN change canceled.`;
          }
        } else if (parts.length === 4) {
          const serialNumber = parts[1];
          const newPin = parts[3];
  
          // Validate the new PIN format (4 digits)
          if (/^\d{4}$/.test(newPin)) {
            // Hash the new PIN before updating
            const newPinHash = await bcrypt.hash(newPin, 10);
  
            // Update the PIN in the database
            const updateQuery = 'UPDATE my_table SET pin = $1 WHERE payment_id = $2';
            await db.query(updateQuery, [newPinHash, serialNumber]);
  
            response = `END Your PIN has been successfully changed to ${newPin}.`;
          } else {
            response = `END Invalid PIN format. Please enter a 4-digit PIN.`;
          }
        }
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