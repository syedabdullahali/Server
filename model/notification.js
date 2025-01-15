const mongoose = require('mongoose')

const itemSchema = new mongoose.Schema({
   userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User', // Reference to the User model
          required: true,
    },
    description: String,
    linkPath:"",
    price: Number,
    type:[{type:String,enum:["internal","external"]}],
    isRead:{type:Boolean,default:true},

});

module.exports = mongoose.model('notification', itemSchema);
