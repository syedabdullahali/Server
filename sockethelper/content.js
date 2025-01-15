
const mongoose = require('mongoose');
const Contest = require('../model/contestModel');

const Category = require("../model/admin/category");
const SubCategory = require('../model/admin/subCategory');
const timeSheduleSchema = require("../model/contestTimeSheduleList")

const useContest = require("../model/admin/userContestDetailSchema")

const categorizeContests = (contests) => {
  const now = new Date();

  const live = [];
  const upcoming = [];
  const expired = [];

  contests.forEach((contest) => {
    contest.timeSlots.forEach((slot) => {
      if (slot.status === 'active') {
        if (slot.startTime <= now && slot.endTime >= now) {
          live.push(contest);
        } else if (slot.startTime > now) {
          upcoming.push(contest);
        } else if (slot.endTime < now) {
          expired.push(contest);
        }
      }
    });
  });

  return { live, upcoming, expired };
};

const updateAndEmitContests = async (io, subcategoryId = null) => {
  try {
    const filter =
      subcategoryId && mongoose.Types.ObjectId.isValid(subcategoryId)
        ? { subcategoryId: new mongoose.Types.ObjectId(subcategoryId) }
        : {};

    const contests = await Contest.find(filter).populate("subcategoryId");
    const { live, upcoming, expired } = categorizeContests(contests);
    io.emit("liveContests", live);
    io.emit("upcomingContests", upcoming);
    io.emit("expiredContests", expired);


  } catch (error) {
    console.error("Error updating contests:", error);
  }
};


const getContestStatus = async (contest) => {
  const currentTime = new Date();
  let isLive = false;
  let isUpcoming = false;
  let currentSlot = null;
  let isStopped = false;

  const timeSlots = await timeSheduleSchema.find({ contestId: contest._id })
  contest.timeSlots = timeSlots

  for (const slot of contest.timeSlots) {
    const startTime = new Date(slot.startTime);
    const endTime = new Date(slot.endTime);

    if (startTime <= currentTime && endTime >= currentTime) {
      isLive = true;
      currentSlot = slot;
      break;
    }

    if (startTime > currentTime && !isLive) {
      isUpcoming = true;

      if (!currentSlot || startTime < new Date(currentSlot.startTime)) {
        currentSlot = slot;
      }
    }
  }

  if (contest.timeSlots.some(slot => slot.status === "stopped")) {
    isStopped = true;
  }

  if (isLive) return { status: "live", timeSlot: currentSlot, isStopped };
  if (isUpcoming) return { status: "upcoming", timeSlot: currentSlot, isStopped };

  return {
    status: "expired",
    timeSlot: contest.timeSlots[contest.timeSlots.length - 1],
    isStopped: isStopped || contest.timeSlots[contest.timeSlots.length - 1]?.status === "stopped"
  };
};


const getGroupedContestsByStatus = async () => {
  const contests = await Contest.find()
    .sort({ createdAt: -1 })
    .populate({
      path: "subcategoryId",
      populate: {
        path: "auctioncategory",
        model: "category",
      },
    })
    .lean();

  const grouped = {
    live: {},
    upcoming: {},
    expired: {},
  };

  const contestPromises = contests.map(async (contest) => {
    if (!contest.subcategoryId || !contest.subcategoryId.auctioncategory) {
      return;
    }
    const timeSlots = await timeSheduleSchema.find({ contestId: contest._id })
    contest.timeSlots = timeSlots
    const { status, timeSlot, isStopped } = getContestStatus(contest);

    if (isStopped || !timeSlot) return; 

    const category = contest.subcategoryId.auctioncategory;
    const subcategory = contest.subcategoryId;
    if (!grouped[status][category._id]) {
      grouped[status][category._id] = {
        category: {
          _id: category._id,
          name: category.name,
        },
        subcategories: {},
      };
    }

    if (!grouped[status][category._id].subcategories[subcategory._id]) {
      grouped[status][category._id].subcategories[subcategory._id] = {
        subcategory: {
          _id: subcategory._id,
          name: subcategory.name,
        },
        contests: [],
      };
    }

    try {
      const ranking = await calculateUserRankings(contest._id, timeSlot._id);
      grouped[status][category._id].subcategories[subcategory._id].contests.push({
        ...contest,
        timeSlots: timeSlot,
        ranking: ranking,
      });
    } catch (error) {
      console.error(`Error calculating ranking for contestId: ${contest._id}, timeSlotId: ${timeSlot._id}`, error);
    }
  });
  await Promise.all(contestPromises);
  const result = Object.keys(grouped).reduce((acc, status) => {
    acc[status] = Object.values(grouped[status]).map((cat) => ({
      category: cat.category,
      subcategories: Object.values(cat.subcategories).map((sub) => ({
        subcategory: { name: sub.subcategory.name, _id: sub.subcategory._id },
        contests: sub.contests.map((contest) => ({
          ...contest,
          timeSlots: contest.timeSlots,
        })),
      })),
    }));
    return acc;
  }, {});
  return result;
};


const calculateUserRankings = async (contestId, timeSlotId) => {
  try {
    const userContestDetails = await useContest.find({
      contesId: contestId,
      timeslotId: timeSlotId,
    });
    const bidCountMap = new Map();
    userContestDetails.forEach((user) => {
      user.bids.forEach((bid) => {
        const amount = bid.Amont;
        bidCountMap.set(amount, (bidCountMap.get(amount) || 0) + 1);
      });
    });
    const userRankingData = userContestDetails.map((user) => {
      let uniqueBidCount = 0;
      user.bids.forEach((bid) => {
        if (bidCountMap.get(bid.Amont) === 1) {
          uniqueBidCount++;
        }
      });
      return {
        userId: user.userId,
        uniqueBidCount,
      };
    });

    userRankingData.sort((a, b) => b.uniqueBidCount - a.uniqueBidCount);
    return userRankingData.map((user, index) => ({
      rank: index + 1,
      userId: user.userId,
      uniqueBidCount: user.uniqueBidCount,
    }));
  } catch (error) {
    console.error("Error calculating rankings:", error);
    throw error;
  }
};



module.exports = {
  updateAndEmitContests,
  getGroupedContestsByStatus
};
