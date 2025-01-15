const contestModel = require('../model/contestModel');
const contestHistory = require('../model/contesthistory');

const winningLeaderBoard = async (obj) => {
  try {
    const { contestId, timeSlotId } = obj;
    const contest = await contestModel.findById(contestId).lean();
    if (!contest) {
      throw new Error('Contest not found');
    }
    
    const currentTime = new Date().getTime();
    contest.timeSlots = contest.timeSlots.filter((el) => {
      return new Date(el.endTime )< currentTime; 
    }) .sort((a, b) => a.endTime - b.endTime);

    contest.timeSlots.map((el,i)=>{
      return el 
    })

    const effectiveTimeSlotId = timeSlotId || contest.timeSlots?.at(-1)?._id;


    if (!effectiveTimeSlotId) {
      throw new Error('Time slot ID is not available');
    }
    // Fetch the contest history details
    const history = await contestHistory
      .findOne({
        timeslotId: effectiveTimeSlotId,
        contestId: contest._id,
      })
      .populate({ path: 'userranks.userId', select: 'name _id' })
      .lean();

    if (!history) {
      throw new Error('Contest history not found');
    }
    history.slotsFill = history.slotsFill?.length || 0;

    return {
      contest,
      slotHistory: history,
    };
  } catch (error) {
    console.error('Error in winningLeaderBoard:', error.message);
    throw new Error(`Failed to fetch winning leaderboard: ${error.message}`);
  }
};

const LiveWinningLeaderBoard = async (obj) => {
  try {
    const { contestId, timeSlotId } = obj;

    // Fetch the contest details
    const contest = await contestModel.findById(contestId).lean();

    if (!contest) {
      throw new Error('Contest not found');
    }

    // Determine the timeSlotId to use
    let effectiveTimeSlotId = '';


    console.log( contest.timeSlots?.length)

    const currentDate = new Date()

if (contest.timeSlots?.length > 0) {
  // Find the current time slot based on the current date and time
  const currentTimeSlot = contest.timeSlots.find((slot) => {
    const startTime = new Date(slot.startTime);
    const endTime = new Date(slot.endTime);
    return currentDate >= startTime && currentDate <= endTime;
  });

  // console.log(new Date(currentTimeSlot.endTime).toLocaleDateString())

  if (currentTimeSlot) {
    effectiveTimeSlotId = currentTimeSlot._id; // Set to the matched timeSlot's ID

  }
}

    

    if (!effectiveTimeSlotId) {
      throw new Error('Time slot ID is not available');
    }

    console.log({
      timeslotId: effectiveTimeSlotId,
      contestId: contest._id,
    })

    // Fetch the contest history details
    const history = await contestHistory
      .findOne({
        timeslotId: effectiveTimeSlotId,
        contestId: contest._id,
      })
      .populate({ path: 'userranks.userId', select: 'name _id' })
      .lean();

    if (!history) {
      throw new Error('Contest history not found');
    }

    // Add additional calculated fields
    history.slotsFill = history.slotsFill?.length || 0;

    return {
      contest,
      slotHistory: history,
    };
  } catch (error) {
    // Log the error for debugging purposes
    console.error('Error in winningLeaderBoard:', error.message);
    throw new Error(`Failed to fetch winning leaderboard: ${error.message}`);
  }
};
const winningLeaderBoardAdmin = async (obj) => {
  try {
    const { contestId, timeSlotId } = obj;
    const contest = await contestModel.findById(contestId).lean();
    if (!contest) {
      throw new Error('Contest not found');
    }
    const effectiveTimeSlotId = timeSlotId || contest.timeSlots?.at(-1)?._id;
    const currentTime = new Date().getTime();
    contest.timeSlots = contest.timeSlots.filter((el) => {
      return new Date(el.endTime )< currentTime; 
    }) .sort((a, b) => a.endTime - b.endTime);

    contest.timeSlots.map((el,i)=>{
      return el 
    })

    if (!effectiveTimeSlotId) {
      throw new Error('Time slot ID is not available');
    }
    // Fetch the contest history details
    const history = await contestHistory
      .findOne({
        timeslotId: effectiveTimeSlotId,
        contestId: contest._id,
      })
      .populate({ path: 'userranks.userId', select: 'name _id' })
      .lean();

    if (!history) {
      throw new Error('Contest history not found');
    }
    history.slotsFill = history.slotsFill?.length || 0;

    return {
      contest,
      slotHistory: history,
    };
  } catch (error) {
    console.error('Error in winningLeaderBoard:', error.message);
    throw new Error(`Failed to fetch winning leaderboard: ${error.message}`);
  }
};

module.exports = { winningLeaderBoard ,LiveWinningLeaderBoard,winningLeaderBoardAdmin};
