const mongoose = require("mongoose");
const express = require("express");
const app = express();
app.use(express.json());
app.use(require("cors")());
const fs = require('fs');
const https = require('https')

// const http = require("http");
require('dotenv').config()

// const server = http.createServer(app);
const key = fs.readFileSync('cert.key');
const cert = fs.readFileSync('cert.crt');

const server = https.createServer({key, cert}, app);

const initializeSocket = require("./sockethelper/socket");
const { handalePrizeDistribution } = require("./function/HandaleprizeDistribution");
initializeSocket(server, app);
const cron = require("node-cron");

const PORT = process.env.PORT || 7000;

cron.schedule(`*/${process.env.EVENT_TRIGGER_TIME_SECOND} * * * * *`, () => {
  handalePrizeDistribution()
});

console.log(new Date())
mongoose
  .connect(process.env.MONGO_DB_URI)
  .then(() => {
    server.listen(PORT, () => {
      console.log("Local host running on port ", 7000);
    });
  })
  .catch((error) => {
    console.log(error);
  });

