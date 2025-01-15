const Contest=require("../model/contestModel");
const timeSheduleSchema = require("../model/contestTimeSheduleList")
const SubCategory = require("../model/admin/subCategory");
const {users}=require("../sockethelper/socketUsers");
const Category=require("../model/admin/category");
const userContestHistory=require("../model/admin/userContestDetailSchema");

const getAndEmitContestsByCategory = async (categoryId, userId, io) => {
  const userSocketId = users[userId]?.toString();
  try {
    const currentDateTime = new Date();

    const subcategories = await SubCategory.find({
      auctioncategory: categoryId,
    });
    // console.log("Subcategories found:", subcategories);

    if (!subcategories.length) {
      return { message: "No subcategories found for this category." };
    }

    const subCategoryIds = subcategories.map((subcat) => subcat._id);

    // console.log("SubCategory IDs:", subCategoryIds);

    const contests = await Contest.find({
      subcategoryId: { $in: subCategoryIds },
    }).populate('subcategoryId').lean();

    // console.log("Contests found:", contests);

    const liveContests = [];
    const upcomingContests = [];

    contests.forEach(async (contest) => {
      const timeSlots = await timeSheduleSchema.find({contestId:contest._id})
      contest.timeSlots =timeSlots
      let activeTimeSlot = null;
      contest?.timeSlots?.forEach((slot) => {
        if (slot.status === "stopped") return;
        if (
          currentDateTime >= slot.startTime &&
          currentDateTime <= slot.endTime
        ) {
          activeTimeSlot = slot;
        }
      });

      if (activeTimeSlot) {
        liveContests.push({
          ...contest,
          status: "live",
          timeSlots: activeTimeSlot,
        });
      } else if (contest.startDateTime > currentDateTime) {
        upcomingContests.push({
          ...contest,
          status: "upcoming",
          timeSlots: activeTimeSlot,
        });
      }
    });

    // console.log("Live Contests:", liveContests);
    // console.log("Upcoming Contests:", upcomingContests);

    if (liveContests.length > 0) {
      io.to(userSocketId).emit(`main-liveContests`, {
        categoryId,
        liveContests,
      });
    }

    if (upcomingContests.length > 0) {
      io.to(userSocketId).emit("main-upcomingContests", {
        categoryId,
        upcomingContests,
      });
    }

    return { liveContests, upcomingContests };
  } catch (error) {
    console.error("Error fetching contests:", error);
    io.to(userSocketId).emit({ message: "Internal Server Error" });
  }
};

const getAndEmitContestsForAllCategories = async (io) => {
  try {
    const currentDateTime = new Date();
    const categories = await Category.find();
    // console.log("Categories found:", categories);

    for (const category of categories) {
      const categoryId = category._id;
      const subcategories = await SubCategory.find({
        auctioncategory: categoryId,
      });

      if (!subcategories.length) {
        continue;
      }

      const subCategoryIds = subcategories.map((subcat) => subcat._id);
      // console.log("SubCategory IDs:", subCategoryIds);

      const contests = await Contest.find({
        subcategoryId: { $in: subCategoryIds },
      }).populate('subcategoryId').lean();

      // console.log(`Contests found for category ${categoryId}:`, contests);

      const liveContests = [];
      const upcomingContests = [];


      contests.forEach(async (contest) => {
        let activeTimeSlot = null;
        const timeSlots = await timeSheduleSchema.find({contestId:contest._id})
        contest.timeSlots=timeSlots
        contest.timeSlots.forEach((slot) => {
          if (slot.status === "stopped") return;
          if (
            currentDateTime >= slot.startTime &&
            currentDateTime <= slot.endTime
          ) {
            activeTimeSlot = slot;
          }
        });

        if (activeTimeSlot) {
          liveContests.push({
            ...contest,
            status: "live",
            timeSlots: activeTimeSlot,
          });
        } else if (contest.startDateTime > currentDateTime) {
          upcomingContests.push({
            ...contest,
            status: "upcoming",
            timeSlots: activeTimeSlot,
          });
        }
      });

      // console.log(`"Live Contests: " for ${category._id}`, liveContests);
      // console.log(`"Upcoming Contests:" for ${category._id}`, upcomingContests);

      if (liveContests.length > 0) {
        io.emit(`liveContests_${category._id}`, {
          categoryId,
          liveContests,
        });
      }

      if (upcomingContests.length > 0) {
        io.emit(`upcomingContests_${category._id}`, {
          categoryId,
          upcomingContests,
        });
      }
    }
  } catch (error) {
    console.error("Error fetching contests for categories:", error);
    throw new Error("Failed to fetch contests for categories");
  }
};

const getExpiredContestsForUser = async (req, res) => {
  const { categoryId } = req.body;
  const currentDateTime = new Date();
const userId=req.user._id
  try {
    const userContestDetails = await userContestHistory
    .find({ userId:userId })
    .populate({
        path: "contestId",
        populate: {
            path: "subcategoryId", 
            populate: { path: "auctioncategory", model: "category" } 
        }
    })
    .lean();

   

      const expiredContests = [];

      for (const detail of userContestDetails) {
          const contest = detail.contestId;
          if (
            contest.subcategoryId.auctioncategory._id.toString() ===
            categoryId.toString()
          ) {
           
          
            for (const timeSlot of contest.timeSlots) {
              if (timeSlot._id.toString() !== detail.timeslotId.toString()) {
                continue;
              }
              if (
                timeSlot.startTime < currentDateTime &&
                timeSlot.endTime < currentDateTime
              ) {
                expiredContests.push({
                  contestId: contest._id,
                  ...contest,
                  timeSlots: timeSlot,
                  userContestDetail: detail,
                });
              }
            }
          }
      }
      return res.status(200).json(expiredContests);

  } catch (error) {
      // console.error("Error fetching expired contests:", error);
      return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
    getAndEmitContestsByCategory,
    getAndEmitContestsForAllCategories,
    getExpiredContestsForUser
  };
