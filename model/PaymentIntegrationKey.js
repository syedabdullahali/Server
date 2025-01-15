const {Schema,model} = require('mongoose')


const  paymenIntegrationKey = new Schema({
    provider: {
      type: String,
      required: true,
      enum: ['PayPal', 'Stripe', 'PhonePe', 'Razorpay', 'Other'], // Payment providers
    },
    apiKey: {
      type: String,
      required: true,
    },
    secretKey: {
      type: String,
      required: true,
    },
    environment: {
      type: String,
      required: true,
      enum: ['sandbox', 'production'], // Sandbox for testing, production for live
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  })

module.exports = model('paymenIntegrationKey',paymenIntegrationKey)