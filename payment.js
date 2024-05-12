async function makePayment() {
    const paymentData = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      redirect_urls: {
        return_url: "http://localhost:3000/success",
        cancel_url: "http://localhost:3000/cancel",
      },
      transactions: [
        {
          item_list: {
            items: [
              {
                name: "Red Sox Hat",
                sku: "001",
                price: "25.00",
                currency: "USD",
                quantity: 1,
              },
            ],
          },
          amount: {
            currency: "USD",
            total: "25.00",
          },
          description: "Hat for the best team ever",
        },
      ],
    };
  
    try {
      const response = await fetch("http://localhost:3000/pay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const result = await response.json();
      console.log("Payment response:", result);
      // Handle success, e.g., redirect user to success page
    } catch (error) {
      console.error("Error making payment:", error);
  
      // Log the response text if available
      if (error.response && error.response.text) {
        console.error("Response text:", error.response.text);
      }
      
      // Handle error, e.g., show error message to the user
    }
  }
  
  module.exports = makePayment;
  