const mongoose =  require('mongoose')

const timeSheduleSchema = new mongoose.Schema({
  startTime: { type: Date },
  endTime: { type: Date },
  status: { type: String, enum: ["active", "stopped"], default: "active" },
  contestId: {type:mongoose.Schema.Types.ObjectId,ref:"categoryContest"}
},{timestamps:true});

module.exports = mongoose.model('timeSheduleSchema',timeSheduleSchema)