const userMainContestDetail = require("../model/admin/userContestDetailSchema");

const transformData = ( template,input) => {
    let userCounter = 0; // To keep track of user distribution
  
    return template
      // .filter(entry => entry.rank !== "7-10") // Filtering out rank "7-10" if it doesn't exist in the template
      .map((entry) => {

        if (typeof entry.rank === "number") {
          // Single rank, such as rank 1 or rank 2
          const user = input[userCounter] ? input[userCounter].users : [];

          userCounter += user.length;
          
          return { 
            // ...entry, 
            rank:entry.rank,
            prizeAmount:entry.amount,
            users: user // Assign users to the rank
          };
        } else if (typeof entry.rank === "string" && entry.rank.includes("-")) {
          // Rank range (e.g., "3-6")
          const [start, end] = entry.rank.split("-").map(Number);
          const users = [];
  
          // Collect users for the rank range (e.g., 3 to 6)
          for (let i = start - 1; i < end; i++) {
            if (input[userCounter]) {
              users.push(...input[userCounter].users);
              userCounter++;
            }
          }
  
          return { 
            rank:entry.rank,
            prizeAmount:entry.amount, users 
        };
        }

        return entry; // Fallback for unexpected cases
      });
};

const calculatePlayerRanking = async (contestId, timeSlot,prize,rankDistribution,currentFillObj) => {


   try {
    
     const userContestDetails = await userMainContestDetail.find({
       contestId: contestId,
       timeslotId: timeSlot,
     });

     const bidCountMap = new Map();
     userContestDetails.forEach((user) => {
       user.bids.forEach((bid) => {
         const amount = bid.Amount;
         bidCountMap.set(amount, (bidCountMap.get(amount) || 0) + 1);
       });
     });

     const usersData = userContestDetails.map((user) => {

       let totalBidAmount = 0;
       let uniqueBidCount = 0;

       user.bids.forEach((bid) => {
         const amount = bid.Amount;
         totalBidAmount += amount;

         if (bidCountMap.get(amount) === 1) {
           uniqueBidCount++;
         }
       });

       return {
         userId: user.userId,
         totalBidAmount,
         uniqueBidCount,
         winningAmount: 0,
         bids:user.bids
       };
     });

     usersData.sort((a, b) => {
      // First sort by uniqueBidCount (descending)
      if (b.uniqueBidCount !== a.uniqueBidCount) {
        return b.uniqueBidCount - a.uniqueBidCount;
      }
      // If uniqueBidCount is the same, sort by totalBidAmount (descending)
      return b.totalBidAmount - a.totalBidAmount;
    });
    
    const rankings = [];
    
    let currentRank = 1;
    let prevUser = null;
    
    usersData.forEach((user) => {
      // Check if rank should be updated based on uniqueBidCount and totalBidAmount
      if (
        prevUser &&
        (prevUser.uniqueBidCount !== user.uniqueBidCount ||
          prevUser.totalBidAmount !== user.totalBidAmount)
      ) {
        currentRank++;
      }
    
      let rankEntry = rankings.find((r) => r.rank === currentRank);
      if (!rankEntry) {
        rankEntry = {
          rank: currentRank,
          users: [],
          isInWinningRange: false,
          rankPrize: 0,
        };
        rankings.push(rankEntry);
      }
    
      rankEntry.users.push({
        userId: user.userId,
        totalBidAmount: user.totalBidAmount,
        uniqueBidCount: user.uniqueBidCount,
        winningAmount: 0,
        bids: user.bids,
      });
    
      prevUser = user;
    });

    //  usersData.sort((a, b) => {
    //    if (b.totalBidAmount !== a.totalBidAmount) {
    //      return b.totalBidAmount - a.totalBidAmount;
    //    }
    //    return b.uniqueBidCount - a.uniqueBidCount;
    //  });

    //  const rankings = [];

    //  let currentRank = 1;
    //  let prevUser = null;

    //  usersData.forEach((user) => {
    //    if (
    //      prevUser &&
    //      (prevUser.totalBidAmount !== user.totalBidAmount ||
    //        prevUser.uniqueBidCount !== user.uniqueBidCount)
    //    ) {
    //      currentRank++;
    //    }

    //    let rankEntry = rankings.find((r) => r.rank === currentRank);
    //    if (!rankEntry) {
    //      rankEntry = {
    //         rank: currentRank, 
    //         users: [],
    //         isInWniningRange:false,
    //         rankPrize:0 
    //        };
    //      rankings.push(rankEntry);
    //    }

    //    rankEntry.users.push({
    //      userId: user.userId,
    //      totalBidAmount: user.totalBidAmount,
    //      uniqueBidCount: user.uniqueBidCount,
    //      winningAmount: 0,
    //      bids:user.bids
    //    });

    //    prevUser = user;
    //  });

    await prize.forEach((el,i)=>{
     if(rankings?.[i]){
       rankings[i].isInWniningRange=true
       rankings[i].rankPrize=el.prizeAmount
     }
     })
   

     const currentFill = transformData(rankDistribution,rankings);

     const totalCurrentPrizeCount  = currentFillObj.prizeDistributionAmount

     const totalColected =  currentFillObj.slotsFill*currentFillObj.entryAmount

     const scalingFactor = totalColected/totalCurrentPrizeCount
     // const scalingFactor2 = (100 *200)/(1800+3600)

     // console.log("scalingFactor",scalingFactor)

     console.log("slotsFill",currentFillObj.slotsFill)
     // console.log("rankPercentage",currentFillObj.rankPercentage)
     // console.log("platformFeePercentage",currentFillObj.platformFeePercentage)
     console.log("entryAmount",currentFillObj.entryAmount)
     console.log("totalColected",totalColected)

     const currentFillModify = currentFill.map((el)=>({
       prizeAmount:Math.floor(el.prizeAmount*scalingFactor.toFixed(4)),
       rank:el.rank,
       users:el.users
     }))

     console.log("currentFill",currentFillModify)
     console.log("scalingFactor",scalingFactor.toFixed(4))
     
     // console.log("maxFill",currentFill.map((el)=>el.prizeAmount*scalingFactor2))

     return [rankings,currentFillModify];

   } catch (error) {
     console.error("Error calculating rankings:", error);
     throw error;
   }
 };

 module.exports = calculatePlayerRanking