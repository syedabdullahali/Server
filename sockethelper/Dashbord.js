const contestModel = require("../model/contestModel");
const userContestDetailSchema = require("../model/admin/userContestDetailSchema");
const userModel = require("../model/user/user");
const contestHistory = require("../model/contesthistory");
// const { dropSearchIndex } = require('../model/admin/category')

const hnadleDashBord = async () => {
  const dashbordDetail = {
    totalAuctions: {},
    totalBids: {},
    totalUser: {},
    auctionOverview: {},
    AuctionWiner: {},
  };

  try {
    const pipeline = [
      {
        // Step 1: Project 'createdAt' field and extract year and session
        $project: {
          createdAt: 1,
        },
      },
      {
        // Step 2: Add 'session' (grouping by quarters) and 'year'
        $addFields: {
          session: {
            $cond: [
              { $in: [{ $month: "$createdAt" }, [1, 2, 3, 4]] },
              "Jan-Apr", // January to April
              {
                $cond: [
                  { $in: [{ $month: "$createdAt" }, [5, 6, 7, 8]] },
                  "May-Aug", // May to August
                  "Sep-Dec", // September to December
                ],
              },
            ],
          },
          year: { $year: "$createdAt" }, // Extract the year from 'createdAt'
        },
      },
      {
        $group: {
          _id: { year: "$year", session: "$session" }, // Group by session name
          totalAuctionCount: { $sum: 1 }, // Count auctions in each session
        },
      },

      {
        $addFields: {
          isCurrentYear: { $eq: ["$_id.year", new Date().getFullYear()] }, // Check if the year is the current year
        },
      },
      {
        $addFields: {
          ispreviousYear: { $eq: ["$_id.year", new Date().getFullYear() - 1] }, // Check if the year is the current year
        },
      },
      {
        $match: {
          $or: [{ isCurrentYear: true }, { ispreviousYear: true }],
        },
      },
      // Group by session to aggregate counts
      {
        $group: {
          _id: "$_id.session", // Group by session
          currentYearCount: {
            $sum: {
              $cond: [
                { $eq: ["$isCurrentYear", true] },
                "$totalAuctionCount",
                0,
              ],
            },
          },
          previousYearCount: {
            $sum: {
              $cond: [
                { $eq: ["$ispreviousYear", true] },
                "$totalAuctionCount",
                0,
              ],
            },
          },
          totalCount: { $sum: "$totalAuctionCount" },
        },
      },
      // Create the session object with session name as the key and count as the value
      {
        $group: {
          _id: null,
          currentYearCount: { $sum: "$currentYearCount" },
          previousYearCount: { $sum: "$previousYearCount" },
          totalCount: { $sum: "$totalCount" },
          session: {
            $push: {
              k: "$_id", // Session name (e.g. "Jan-Apr")
              v: "$totalCount", // Session count (sum of totalAuctionCount)
            },
          },
        },
      },
      {
        $project: {
          currentYearCount: 1,
          previousYearCount: 1,
          totalCount: 1,
          session: { $arrayToObject: "$session" },
          _id: 0,
        },
      },
    ];

    // const pipeline = [
    //     {
    //       // Step 1: Project 'createdAt' field and extract year and session
    //       $project: {
    //         createdAt: 1
    //       }
    //     },
    //     {
    //       // Step 2: Add 'session' (grouping by quarters) and 'year'
    //       $addFields: {
    //         session: {
    //           $cond: [
    //             { $in: [{ $month: "$createdAt" }, [1, 2, 3, 4]] }, "Jan-Apr",  // January to April
    //             {
    //               $cond: [
    //                 { $in: [{ $month: "$createdAt" }, [5, 6, 7, 8]] }, "May-Aug", // May to August
    //                 "Sep-Dec"  // September to December
    //               ]
    //             }
    //           ]
    //         },
    //         year: { $year: "$createdAt" }  // Extract the year from 'createdAt'
    //       }
    //     },
    //       {
    //         $group: {
    //           _id: {year:"$year",session:"$session" }, // Group by session name
    //           totalAuctionCount: { $sum: 1 },  // Count auctions in each session
    //         }
    //       },

    //       {
    //         $addFields: {
    //           isCurrentYear: { $eq: ["$_id.year", new Date().getFullYear()] },  // Check if the year is the current year
    //         }
    //       },
    //       {
    //         $addFields: {
    //           ispreviousYear: { $eq: ["$_id.year", new Date().getFullYear()-1] },  // Check if the year is the current year
    //         }
    //       },
    //       {
    //         $match: {
    //           $or: [
    //             { "isCurrentYear": true },
    //             { "ispreviousYear": true }
    //           ]
    //         }
    //       },
    //       // Group by session to aggregate counts
    //       {
    //         $group: {
    //           _id: "$_id.session", // Group by session
    //           currentYearCount: {
    //             $sum: {
    //               $cond: [{ $eq: ["$isCurrentYear", true] }, "$totalAuctionCount", 0]
    //             }
    //           },
    //           previousYearCount: {
    //             $sum: {
    //               $cond: [{ $eq: ["$ispreviousYear", true] }, "$totalAuctionCount", 0]
    //             }
    //           },
    //           totalCount: { $sum: "$totalAuctionCount" }
    //         }
    //       },
    //       // Create the session object with session name as the key and count as the value
    //       {
    //         $group: {
    //           _id: null,
    //           currentYearCount: { $sum: "$currentYearCount" },
    //           previousYearCount: { $sum: "$previousYearCount" },
    //           totalCount: { $sum: "$totalCount" },
    //           session: {
    //             $push: {
    //               k: "$_id",  // Session name (e.g. "Jan-Apr")
    //               v: "$totalCount" // Session count (sum of totalAuctionCount)
    //             }
    //           }
    //         }
    //       },
    //       {
    //         $project: {
    //           currentYearCount: 1,
    //           previousYearCount: 1,
    //           totalCount: 1,
    //           session: { $arrayToObject: "$session" },
    //           _id: 0
    //         }
    // }]

      const response = await contestModel.aggregate(pipeline)
      const response2 = await userContestDetailSchema.aggregate([
        {
            $unwind:"$bids"
        },
        {
            $limit:16000,
        },
        {
        $lookup:{
            from:"users",
            foreignField:"_id",
            localField:"userId",
            as:"userInfo"
        }
        },
       {
        $unwind:"$userInfo"
       },
       {
        // Step 2: Add 'session' (grouping by quarters) and 'year'
        $addFields: {
            year: { $year: "$bids.bidTimeDate" },
          month: { $month: "$bids.bidTimeDate" },

        }
      },
      {
        $addFields:{
            type:"$userInfo.type",
            Amount:"$bids.Amount"

        }
      }
      ,{
        $project:{
                year:1,
                month: 1,
                type: 1,
                Amount:1
        }
      },
      {
       $group:{
        _id:"$month",
        totalUserBidCount: { $sum:{
            $cond:[
                {$eq:["$type","user"]},
                "$Amount",
                0
            ]
        } },
        totalbotBidCount: { $sum:{
            $cond:[
                {$eq:["$type","bot"]},
                "$Amount",
                0
            ]
        } },
       }
      },
      {
        $match: {
          _id: { $ne: null }  // Only include documents where _id is not null
        }
      },
      ])
      const response3 = await userModel.aggregate([
        {
            $match: {type:"user"}
          },
        ...pipeline,
      ])
      const response4 = await userContestDetailSchema.aggregate([
      {
        $unwind: "$bids",
      },
      {
        $skip: 1000,
      },
      {
        $limit: 956000,
      },
      {
        // Step 2: Add 'session' (grouping by quarters) and 'year'
        $addFields: {
          session: {
            $cond: [
              { $in: [{ $month: "$bids.bidTimeDate" }, [1, 2, 3, 4]] },
              "Jan-Apr", // January to April
              {
                $cond: [
                  { $in: [{ $month: "$bids.bidTimeDate" }, [5, 6, 7, 8]] },
                  "May-Aug", // May to August
                  "Sep-Dec", // September to December
                ],
              },
            ],
          },
          year: { $year: "$bids.bidTimeDate" }, // Extract the year from 'createdAt'
        },
      },
               {
                $group: {
                  _id: {year:"$year",session:"$session" }, // Group by session name
                  totalAuctionCount: { $sum:"$bids.Amount" },  // Count auctions in each session
                }
              },

              {
                $addFields: {
                  isCurrentYear: { $eq: ["$_id.year", new Date().getFullYear()] },  // Check if the year is the current year
                }
              },
              {
                $addFields: {
                  ispreviousYear: { $eq: ["$_id.year", new Date().getFullYear()-1] },  // Check if the year is the current year
                }
              },
              {
                $match: {
                  $or: [
                    { "isCurrentYear": true },
                    { "ispreviousYear": true }
                  ]
                }
              },
              // Group by session to aggregate counts
              {
                $group: {
                  _id: "$_id.session", // Group by session
                  currentYearCount: {
                    $sum: {
                      $cond: [{ $eq: ["$isCurrentYear", true] }, "$totalAuctionCount", 0]
                    }
                  },
                  previousYearCount: {
                    $sum: {
                      $cond: [{ $eq: ["$ispreviousYear", true] }, "$totalAuctionCount", 0]
                    }
                  },
                  totalCount: { $sum: "$totalAuctionCount" }
                }
              },
              // Create the session object with session name as the key and count as the value
              {
                $group: {
                  _id: null,
                  currentYearCount: { $sum: "$currentYearCount" },
                  previousYearCount: { $sum: "$previousYearCount" },
                  totalCount: { $sum: "$totalCount" },
                  session: {
                    $push: {
                      k: "$_id",  // Session name (e.g. "Jan-Apr")
                      v: "$totalCount" // Session count (sum of totalAuctionCount)
                    }
                  }
                }
              },
              {
                $project: {
                  currentYearCount: 1,
                  previousYearCount: 1,
                  totalCount: 1,
                  session: { $arrayToObject: "$session" },
                  _id: 0
                }
        }
      ]);

    const response5 = await contestModel.aggregate([
    //   {
    //     ranks: { $ne: [] },
    //   },
      {
        $skip:100
      },
      {
        $limit:200
      },
    //   {
    //     $project:{
    //         _id: 1,
    //         contestId: 1,
    //         timeslotId: 1,
    //         companyProfit: 1,
    //         actualPrizePool: 1,
    //         totalbid: 1,
    //         totalbidsAmount: 1,
    //         ranks: 1,
    //     }
    //   },
    {
        $unwind:"$bids"
    },
    //   {

    //   }
    ]);

    const AuctionJoinBidCount = [
        {
            name: 'Use Bid Count',
            data: [0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
        {
            name: 'Bot Bid Count',
            data: [0,0,0,0, 0,0,0,0, 0,0,0,0],
        },
    ]

    response2.forEach((el,i)=>{
            AuctionJoinBidCount[0].data[el._id-1]=el.totalUserBidCount
            AuctionJoinBidCount[1].data[el._id-1]=el.totalbotBidCount
    })

    dashbordDetail.totalAuctions =response[0]
    dashbordDetail.totalBids =response4[0]
    dashbordDetail.totalUser = response3[0]
    dashbordDetail.auctionOverview = AuctionJoinBidCount

    // dashbordDetail.AuctionWiner = response5;

    return dashbordDetail;
  } catch (error) {
    throw error;
  }
};

module.exports = { hnadleDashBord };
