const uniqueById = (arr) => {
  const seen = new Set();
  return arr.filter((item) => {
    const duplicate = seen.has(item._id);
    seen.add(item._id);
    return !duplicate;
  });
};

const categorizeContestsForUpcoming = (contests) => {
  const now = new Date();
  let upcoming = [];
  contests?.forEach((contest) => {
    if (!contest.timeSlots || contest.timeSlots.length === 0) {
    
      return;
    }

    const validSlots = contest.timeSlots.filter((slot) => {
      const startTime = new Date(slot.startTime);
      const endTime = new Date(slot.endTime);
      return startTime > now && endTime > now;
    });

    if (validSlots.length > 0) {
      upcoming.push({
        ...contest,
        timeSlots: validSlots,
      });
    }
  });

  upcoming = uniqueById(upcoming);

  console.log(upcoming, "from handler function");

  return upcoming;
};
const categorizeContestsForLive = (contests) => {
  const now = new Date(); 

  let live = [];

  console.log(contests, "from handler function");

  contests?.forEach((contest) => {
    if (!contest.timeSlots || contest.timeSlots.length === 0) {
      console.log(
        `Contest with ID ${contest._id} has no time slots and will be skipped.`
      );
      return; 
    }

    const validSlots = contest.timeSlots.filter((slot) => {
      const startTime = new Date(slot.startTime);
      const endTime = new Date(slot.endTime);

      return startTime <= now && endTime >= now;
    });

    if (validSlots.length > 0) {
      live.push({
        ...contest,
        timeSlots: validSlots, // Keep only the valid time slots for live contests
      });
    }
  });

  // Remove duplicates based on contest ID while keeping the full contest data

  live = uniqueById(live);
  //   categorizedContests.dead = uniqueById(categorizedContests.dead);

  console.log(live, "from handler function");

  return live;
};
const categorizeContestsForWinning = (contests) => {
  const now = new Date(); 

  let winning = [];

  console.log(contests, "from handler function");

  contests?.forEach((contest) => {
    if (!contest.timeSlots || contest.timeSlots.length === 0) {
      console.log(
        `Contest with ID ${contest._id} has no time slots and will be skipped.`
      );
      return;
    }

    const validSlots = contest.timeSlots.filter((slot) => {
      const endTime = new Date(slot.endTime);

      return endTime < now;
    });

    if (validSlots.length > 0) {
      winning.push({
        ...contest,
        timeSlots: validSlots, // Keep only the valid time slots for winning contests
      });
    }
  });

  // Remove duplicates based on contest ID while keeping the full contest data
  winning = uniqueById(winning);

  console.log(winning, "from handler function");

  return winning;
};
// const categorizeContests = (contests) => {
//   const now = new Date(); // Get the current date and time

//   const categorizedContests = {
//     upcoming: [],
//     live: [],
//     dead: [],
//   };

//   console.log(contests, "from handler function");

//   contests?.forEach((contest) => {
//     if (!contest.timeSlots || contest.timeSlots.length === 0) {
//       console.log(
//         `Contest with ID ${contest._id} has no time slots and will be skipped.`
//       );
//       return; // Skip contests with no time slots
//     }
//     contest.timeSlots.forEach((slot) => {
//       const startTime = new Date(slot.startTime);
//       const endTime = new Date(slot.endTime);

//       if (startTime > now) {
//         categorizedContests.upcoming.push(contest);
//       } else if (startTime <= now && endTime >= now) {
//         categorizedContests.live.push(contest);
//       } else if (endTime < now) {
//         categorizedContests.dead.push(contest);
//       }
//     });
//   });

//   // Remove duplicates based on contest ID while keeping the full contest data
//   categorizedContests.upcoming = uniqueById(categorizedContests.upcoming);
//   categorizedContests.live = uniqueById(categorizedContests.live);
//   categorizedContests.dead = uniqueById(categorizedContests.dead);

//   console.log(categorizedContests, "from handler function");

//   return categorizedContests;
// };

//every 1 min will call this funtion
// const checkAndUpdateContests = (contests) => {
//   setInterval(async () => {
//     try {
//       await categorizeContestsForUpcoming(contests);
//       await categorizeContestsForLive(contests);
//       await categorizeContestsForWinning(contests);
//     } catch (err) {
//       console.error("Error updating contests:", err);
//     }
//   }, 60000);
// };
// checkAndUpdateContests();

module.exports = {
  //   checkAndUpdateContests,
  categorizeContestsForUpcoming,
  categorizeContestsForLive,
  categorizeContestsForWinning,
};
