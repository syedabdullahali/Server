const { Types } = require("mongoose");
const userMainContestDetail = require("../model/admin/userContestDetailSchema");



const calculatePlayerRankingTest = async (contestId, timeSlot,
    prize,rankDistribution,currentFillObj
) => {

    const prizeDistributionAmount = currentFillObj.prizeDistributionAmount
    const entryAmount = currentFillObj.entryAmount



   try {
    
     const userContestDetails = await userMainContestDetail.aggregate([
    { 
    $match:{
         contestId: new Types.ObjectId(contestId),
         timeslotId:  new Types.ObjectId(timeSlot)
       }
    },
    {$addFields:{
        totalUserBids:{$size:"$bids"}	
     }
    },

    {$unwind:"$bids"},
    {
        $group:{
            _id:"$bids.Amount",
            duplicateCount:{
                $sum:1
            },
            users:{
                $push:{
                    userId:"$userId",
                    totalUserBids:"$totalUserBids",
                    bidTimeDate:"$bids.bidTimeDate"
                }
            }
        },
    },

  { 
    $sort: { duplicateCount: 1, _id: -1 } 
  },
]);


     const totalCurrentPrizeCount  = prizeDistributionAmount
     const totalColected =  currentFillObj.slotsFill * entryAmount
     const scalingFactor = totalColected/totalCurrentPrizeCount

     const currentFillModify = prize.map((el,i)=>({
       prizeAmount:Math.floor(el.prizeAmount*scalingFactor.toFixed(4)),
       rank:el.rank,
       users:userContestDetails[i]?.users
     }))

     const userList = userContestDetails.reduce((crr,el,i)=>{
        crr.push(el.users.map((el2)=>(
           {
               rank:i+1,
               userId:el2.userId,
               bid:el._id,
               totalBids:el2.totalUserBids,
               biddingTime:el2.bidTimeDate,
               WinningAmount:(currentFillModify[i]?.prizeAmount/el2.totalUserBids?
                currentFillModify[i]?.prizeAmount/el.users.length:0),
               isInWiningRange:(currentFillModify[i]?true:false),
               duplicateCount:el.duplicateCount
          }
       )))
        return crr
       },[]).flat(1)
       
     return [userList,currentFillModify];

   } catch (error) {
     console.error("Error calculating rankings:", error);
     throw error;
   }
 };

module.exports = calculatePlayerRankingTest