const express = require("express");
const paypal = require("paypal-rest-sdk");
const bodyParser = require("body-parser");
const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));

paypal.configure({
  mode: "sandbox", // Change to 'live' for production
  client_id:
    "Af-P5E1G40gSI82238V4bT3txlGd__CsemFiOZ-tW4Jk-PRjqAInaYnIbv8YOddkdDHwbTm_9Q5AUVvA",
  client_secret:
    "EBJy_gpGbHS6lEsI9LgrYmqtl-wHtnh8Ehw1Xtk-KQEOjM7WIEmzJoijZ63ibwWtja7LZ5HGCxJlJj72"
});

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/create-payment", (req, res) => {
  const create_payment_json = {
    intent: "sale",
    payer: {
      payment_method: "paypal"
    },
    redirect_urls: {
      return_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel"
    },
    transactions: [
      {
        item_list: {
          items: [
            {
              name: "Item Name",
              sku: "Item SKU",
              price: "12.00",
              currency: "USD",
              quantity: 1
            }
          ]
        },
        amount: {
          currency: "USD",
          total: "12.00"
        },
        description: "This is the payment description."
      }
    ]
  };

  paypal.payment.create(create_payment_json, (error, payment) => {
    if (error) {
      throw error;
    } else {
      for (let i = 0; i < payment.links.length; i++) {
        if (payment.links[i].rel === "approval_url") {
          res.redirect(payment.links[i].href);
        }
      }
    }
  });
});

app.get("/success", (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const execute_payment_json = {
    payer_id: payerId,
    transactions: [
      {
        amount: {
          currency: "USD",
          total: "12.00"
        }
      }
    ]
  };

  paypal.payment.execute(paymentId, execute_payment_json, (error, payment) => {
    console.log(payment);
    if (error) {
      console.error(error.response);
      throw error;
    } else {
      res.render("success", { transactionId: payment.id }); // Pass transaction ID to view
    }
  });
});

app.get("/cancel", (req, res) => {
  res.render("cancel");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
