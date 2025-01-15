const SubCategory = require("../model/admin/subCategory");
const Category=require("../model/admin/category");
const contestModel = require("../model/contestModel");
const subCategoryModel = require("../model/admin/subCategory");
const { Schema,Types } = require("mongoose");


const getMainCategoryData = async (filterObj) => {
  try {
    const currentTime = new Date();
    const response = await contestModel.aggregate([
      {
        $addFields: {
          currentTime: currentTime,
        },
      },
      {
        $lookup:{
         from:"timesheduleschemas",
         localField:"_id",
         foreignField:"contestId",
         as:"timeSlots2"
        }
      },
      {
        $addFields: {
          currentTime: {
            $dateToString: {
              format: "%Y-%m-%d %H:%M:%S", // Define the date format
              date: new Date(), // Current date and time
              timezone: "Asia/Kolkata", // Set timezone to IST (Indian Standard Time)
            },
          },
          contestStatus: {
            $reduce: {
              input: {
                $map: {
                  input: "$timeSlots2", // Iterate over each timeSlot
                  as: "slot",
                  in: {
                    $cond: {
                      if: {
                        $and: [
                          { $lte: ["$$slot.startTime", "$currentTime"] }, // Check if the start time is before or equal to current time
                          { $gte: ["$$slot.endTime", "$currentTime"] },   // Check if the end time is after or equal to current time
                        ],
                      },
                      then: "live", // If the time slot is live
                      else: {
                        $cond: {
                          if: { $gte: ["$currentTime", "$$slot.endTime"] }, // If the current time is after the slot's end time
                          then: "wining", // If the contest has ended
                          else: "upcoming", // If the contest is upcoming
                        },
                      },
                    },
                  },
                },
              },
              initialValue: [], // Start with an empty array
              in: {
                $cond: {
                  if: { $in: ["$$this", "$$value"] }, // Check if the current status is already in the accumulated array
                  then: "$$value", // If it already exists, keep the array as it is
                  else: { $concatArrays: ["$$value", ["$$this"]] }, // Otherwise, add the current status to the array
                },
              },
            },
          },
        },
      },

      {$unwind:"$contestStatus"},

          {
                        $match:{
                    subcategoryId: { $ne: null, $ne: false, $ne: "", $ne: 0, $ne: undefined }
                }
              },
              {
                $group: {
                  _id: "$subcategoryId",
                  contests: { $push: "$$ROOT" }, // Collect all fields of each contest into an array
                },
              },
              {
                $lookup: {
                  from: "sub-categories",
                  localField: "_id",
                  foreignField: "_id",
                  as: "subCategoryDetails",
                },
              },
              {
                $unwind: {
                  path: "$subCategoryDetails",
                  preserveNullAndEmptyArrays: true, // Keeps results even if subCategoryDetails not found
                },
              },
              {
                $lookup: {
                  from: "categories",
                  localField: "subCategoryDetails.auctioncategory",
                  foreignField: "_id",
                  as: "auctionCategoryDetails",
                },
              },
              {
                $unwind: {
                  path: "$auctionCategoryDetails",
                  preserveNullAndEmptyArrays: true, // Keeps results even if auctionCategoryDetails not found
                },
              },
              {
                $unwind: {
                  path: "$contests",
                  preserveNullAndEmptyArrays: true, // Keeps results even if contests array is empty
                },
              },
              {$project:{
                auctionCategoryDetails:1,
                contests:1,
                timeSlots: {
                  $let: {
                    vars: {
                      currentSlot: {
                        $filter: {
                          input: "$contests.timeSlots2",
                          as: "slot",
                          cond: {
                            $and: [
                              { $lte: ["$$slot.startTime", new Date()] },
                              { $gt: ["$$slot.endTime", new Date()] }
                            ]
                          }
                        }
                      },
                      expiredSlots: {
                        $filter: {
                          input: "$contests.timeSlots2",
                          as: "slot",
                          cond: { $lt: ["$$slot.endTime", new Date()] }
                        }
                      },
                      upcomingSlots: {
                        $filter: {
                          input: "$contests.timeSlots2",
                          as: "slot",
                          cond: { $gt: ["$$slot.startTime", new Date()] }
                        }
                      }
                    },
                    in: {
                      $cond: {
                        if: { $eq: ["$contestStatus", "wining"] }, // Check if contestStatus is "wining"
                        then: {
                          $cond: {
                            if: { $gt: [{ $size: "$$expiredSlots" }, 0] }, // If expired slots exist
                            then: { $arrayElemAt: ["$$expiredSlots", { $subtract: [{ $size: "$$expiredSlots" }, 1] }] }, // Return the last expired slot
                            else: null // No expired slots found
                          }
                        },
                        else: {
                          $cond: {
                            if: { $eq: ["$contestStatus", "upcoming"] }, // Check if contestStatus is "upcoming"
                            then: {
                              $cond: {
                                if: { $gt: [{ $size: "$$upcomingSlots" }, 0] }, // If upcoming slots exist
                                then: { $arrayElemAt: ["$$upcomingSlots", 0] }, // Return the first upcoming slot
                                else: null // No upcoming slots found
                              }
                            },
                            else: {
                              $cond: {
                                if: { $gt: [{ $size: "$$currentSlot" }, 0] }, // If there's a current slot
                                then: { $arrayElemAt: ["$$currentSlot", 0] }, // Return the current slot
                                else: {
                                  $cond: {
                                    if: { $gt: [{ $size: "$contests.timeSlots2" }, 0] }, // If contests.timeSlots2 is not empty
                                    then: { $arrayElemAt: ["$contests.timeSlots2", { $subtract: [{ $size: "$contests.timeSlots2" }, 1] }] }, // Return the last slot
                                    else: null // No slots exist
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }

              }},
              {
                $lookup:{
                  from:"contesthistories",
                  localField:"contests._id",
                  foreignField:"contestId",
                  as:"contestCount"
                }
              },
              {
                $group: {
                  _id: "$auctionCategoryDetails._id", // Grouping by auction category ID
                  auctionCategory: { $first: "$auctionCategoryDetails" }, // Get the auction category details
                  megaCount: { 
                    $sum: "$contests.prizeDistributionAmount"  // Summing up the prizeDistributionAmount for each contest in the group
                  },
                  contests: { 
                    $push: {
                      state: "$contests.contestStatus",                    // Include the state field
                      endDate: "$contests.endDateTime",           // Include the end date field
                      startDate: "$contests.startDateTime",
                      prizeDistributionAmount:"$contests.prizeDistributionAmount",
                      timeSlots: "$timeSlots",        // Include the start date field
                      firstContest: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$contestCount",  // Input array: contestCount
                              as: "contest",           // Alias for each item in contestCount
                              cond: { 
                                $eq: ["$$contest.timeslotId", "$timeSlots._id"]  // Filter by timeslotId
                              }
                            }
                          },
                          0  // Take the first element (index 0) from the filtered result
                        ]
                      }
                           // Include the start date field
                    }
                  
                  }, // Collect contests related to this auction category
                },
              },
          
              { $unwind: "$contests" },
              {
                $addFields: {
                  playerCount: {
                    $size: { 
                      $ifNull: ["$contests.firstContest.slotsFill", []]  // Safely handle the case where firstContest.slotsFill may be null or missing
                    }
                  }
                }
              },
              {
                $group: {
                    _id: {
                        auctionCategoryId: "$auctionCategory._id",
                        state: "$contests.state"
                    },
                    auctionCategory: { $first: "$auctionCategory" },
                    megaCount:{$first:"$megaCount"},
                    contests: {
                        $push: {
                            _id: "$_id",
                            title: "$auctionCategory.title",
                            timeSlots: "$contests.timeSlots",
                            sortingNumber: "$auctionCategory.sortingNumber",
                            duration: "$auctionCategory.duration",
                            createdAt: "$auctionCategory.createdAt",
                            updatedAt: "$auctionCategory.updatedAt",
                            __v: "$auctionCategory.__v",
                            maxStartDate: { $max: "$contests.startDate" },
                            maxEndDate: { $max: "$contests.endDate" },
                            state: "$contests.state",
                            megaCount:"$megaCount", 
                            playerCount:"$playerCount"
                        }
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    upcoming: {
                        $push: {
                            $cond: [{ $eq: ["$_id.state", "upcoming"] }, { $arrayElemAt: ["$contests", 0] }, null]
                        }
                    },
                    live: {
                        $push: {
                            $cond: [{ $eq: ["$_id.state", "live"] }, { $arrayElemAt: ["$contests", 0] }, null]
                        }
                    },
                    wining: {
                        $push: {
                            $cond: [{ $eq: ["$_id.state", "wining"] }, { $arrayElemAt: ["$contests", 0] }, null]
                        }
                    }
                }
            },
            {

                $project: {
                  upcoming: {
                    $let: {
                      vars: {
                        filteredUpcoming: {
                          $filter: {
                            input: "$upcoming",
                            as: "contest",
                            cond: { $ne: ["$$contest", null] }
                          }
                        }
                      },
                      in: {
                        $sortArray: {
                          input: "$$filteredUpcoming",
                          sortBy: { sortingNumber: -1 } // Change 'startDate' to your desired sorting field
                        }
                      }
                    }
                  },
                  live: {
                    $let: {
                      vars: {
                        filteredLive: {
                          $filter: {
                            input: "$live",
                            as: "contest",
                            cond: { $ne: ["$$contest", null] }
                          }
                        }
                      },
                      in: {
                        $sortArray: {
                          input: "$$filteredLive",
                          sortBy: { sortingNumber: -1 } // Change 'startDate' to your desired sorting field
                        }
                      }
                    }
                  },
                  wining: {
                    $let: {
                      vars: {
                        filteredWining: {
                          $filter: {
                            input: "$wining",
                            as: "contest",
                            cond: { $ne: ["$$contest", null] }
                          }
                        }
                      },
                      in: {
                        $sortArray: {
                          input: "$$filteredWining",
                          sortBy: { sortingNumber: -1 } // Change 'startDate' to your desired sorting field
                        }
                      }
                    }
                  }
                }
     
            }    
    ]);

    return  response
  } catch (error) {
    console.error(error);
    throw error
  }
};

const getMainCategoryDataContestData = async (joinCategoryId,status,userId,filterObj)=>{

  const sortfilterObj = filterObj?.sortfilterObj||{}
  const sortByRangeFilterObj = filterObj?.sortByRangeFilterObj||{}


  const sortStage = {
    $sort: {entryAmount:-1,_id:-1}
  };
  
  const sortStage2 = {
    $sort: {sortByEntryAmount:-1,_id:-1}
  };

  if(sortfilterObj?.sortByEntryAmount){
   sortStage.$sort.entryAmount=sortfilterObj.sortByEntryAmount==="min"?1:-1,
   sortStage2.$sort.sortByEntryAmount=sortfilterObj.sortByEntryAmount==="min"?1:-1
  }

  if(sortfilterObj?.sortBywiningPercentage){
    sortStage.$sort.rankPercentage=sortfilterObj.sortBywiningPercentage==="min"?1:-1
    sortStage2.$sort.sortBywiningPercentage=sortfilterObj.sortBywiningPercentage==="min"?1:-1
   }

  if(sortfilterObj?.sortBySlotSize){
    sortStage.$sort.slots=sortfilterObj.sortBySlotSize==="min"?1:-1
    sortStage2.$sort.sortBySlotSize=sortfilterObj.sortBySlotSize==="min"?1:-1
  }

  if(sortfilterObj?.contestType){
    sortStage.$sort.type=sortfilterObj.contestType
    sortStage2.$sort.contestType=sortfilterObj.contestType
  }
  if(sortfilterObj?.sortByPrizePoll){
    sortStage.$sort.prizeDistributionAmount = sortfilterObj.sortByPrizePoll==="min"?1:-1
    sortStage2.$sort.sortByPrizePoll=sortfilterObj.sortByPrizePoll==="min"?1:-1
  }

  try {    
    const currentTime = new Date();
    const response = contestModel.aggregate([
    {
        $addFields: {
          currentTime: currentTime,
        },
    },
    {
      $lookup:{
       from:"timesheduleschemas",
       localField:"_id",
       foreignField:"contestId",
       as:"timeSlots2"
      }
    },
  {
  $addFields: {
    currentTime: {
      $dateToString: {
        format: "%Y-%m-%d %H:%M:%S", // Define the date format
        date: new Date(), // Current date and time
        timezone: "Asia/Kolkata", // Set timezone to IST (Indian Standard Time)
      },
    },
    contestStatus: {
      $reduce: {
        input: {
          $map: {
            input: "$timeSlots2", // Iterate over each timeSlot
            as: "slot",
            in: {
              $cond: {
                if: {
                  $and: [
                    { $lte: ["$$slot.startTime", "$currentTime"] }, // Check if the start time is before or equal to current time
                    { $gte: ["$$slot.endTime", "$currentTime"] },   // Check if the end time is after or equal to current time
                  ],
                },
                then: "live", // If the time slot is live
                else: {
                  $cond: {
                    if: { $gte: ["$currentTime", "$$slot.endTime"] }, // If the current time is after the slot's end time
                    then: "wining", // If the contest has ended
                    else: "upcoming", // If the contest is upcoming
                  },
                },
              },
            },
          },
        },
        initialValue: [], // Start with an empty array
        in: {
          $cond: {
            if: { $in: ["$$this", "$$value"] }, // Check if the current status is already in the accumulated array
            then: "$$value", // If it already exists, keep the array as it is
            else: { $concatArrays: ["$$value", ["$$this"]] }, // Otherwise, add the current status to the array
          },
        },
      },
    },
  },
},
{$unwind:"$contestStatus"},
  {
    $match:{
        subcategoryId: { $ne: null, $ne: false, $ne: "", $ne: 0, $ne: undefined }
    }
  },
  {
    $lookup:{
      from:"sub-categories",
      localField:"subcategoryId",
      foreignField:"_id",
      as:"subcategoryDetails"
    }
  }, // lookup into sub-categories schema is there collection that hold id of current doc 
  {
    $unwind:{
      path:"$subcategoryDetails"
    }
  },// unwind accrodengly to group them in futcher 
  {
    $match: {
        "subcategoryDetails.auctioncategory": new Types.ObjectId(joinCategoryId), // Match by the subcategory ID in contests
        "contestStatus":status
    },
  }, 
  {
    $match: {
      ...(sortByRangeFilterObj?.dateFilter?.startDate?.trim() && sortByRangeFilterObj?.dateFilter?.endDate?.trim() && {
        startDateTime: { $gte: new Date(sortByRangeFilterObj?.dateFilter?.startDate) },
        endDateTime: { $lte: new Date(sortByRangeFilterObj?.dateFilter?.endDate) }
      })
    }
  },
  {
    $match: {
      ...(sortByRangeFilterObj?.slotFilter?.min&& sortByRangeFilterObj?.slotFilter?.max && {
        slots: {
          $gte: Number(sortByRangeFilterObj?.slotFilter?.min), 
          $lte: Number(sortByRangeFilterObj?.slotFilter?.max)
        },
      })
    }
  },
  {
    $match: {
      ...(sortByRangeFilterObj?.prizePoolFilter?.min&& sortByRangeFilterObj?.prizePoolFilter?.max && {
        prizeDistributionAmount: {
          $gte: Number(sortByRangeFilterObj?.prizePoolFilter?.min), 
          $lte: Number(sortByRangeFilterObj?.prizePoolFilter?.max)
        },
      })
    }
  },
  sortStage ,
  {
    $project: {
      isUserBookMarked:1,
      isNotificationActive:1,
      _id: 1,
      entryAmount: 1,
      state:1,
      slots: 1,
      upto: 1,
      totalAmount: 1,
      type: 1,
      isBotActive:1,
      typeCashBonus: 1,
      bonusCashPercentage: 1,
      bonusCashAmount: 1,
      subcategoryId: 1,
      platformFeePercentage: 1,
      platformFeeAmount: 1,
      prizeDistributionPercentage: 1,
      prizeDistributionAmount: 1,
      rankDistribution: 1,
      prizeDistribution: 1,
      rankCount: 1,
      subcategoryDetails:1,
      startDateTime:1,
      endDateTime:1,
      rankPercentage: 1,
      favorite:1,
        timeSlots: {
          $let: {
            vars: {
              currentSlot: {
                $filter: {
                  input: "$timeSlots2",
                  as: "slot",
                  cond: {
                    $and: [
                      { $lte: ["$$slot.startTime", new Date()] },
                      { $gt: ["$$slot.endTime", new Date()] }
                    ]
                  }
                }
              },
              expiredSlots: {
                $filter: {
                  input: "$timeSlots2",
                  as: "slot",
                  cond: { $lt: ["$$slot.endTime", new Date()] }
                }
              },
              upcomingSlots: {
                $filter: {
                  input: "$timeSlots2",
                  as: "slot",
                  cond: { $gt: ["$$slot.startTime", new Date()] }
                }
              }
            },
            in: {
              $cond: {
                if: { $eq: ["$contestStatus", "wining"] }, // Check if contestStatus is "wining"
                then: {
                  $cond: {
                    if: { $gt: [{ $size: "$$expiredSlots" }, 0] }, // If expired slots exist
                    then: { $arrayElemAt: ["$$expiredSlots", { $subtract: [{ $size: "$$expiredSlots" }, 1] }] }, // Return the last expired slot
                    else: null // No expired slots found
                  }
                },
                else: {
                  $cond: {
                    if: { $eq: ["$contestStatus", "upcoming"] }, // Check if contestStatus is "upcoming"
                    then: {
                      $cond: {
                        if: { $gt: [{ $size: "$$upcomingSlots" }, 0] }, // If upcoming slots exist
                        then: { $arrayElemAt: ["$$upcomingSlots", 0] }, // Return the first upcoming slot
                        else: null // No upcoming slots found
                      }
                    },
                    else: {
                      $cond: {
                        if: { $gt: [{ $size: "$$currentSlot" }, 0] }, // If there's a current slot
                        then: { $arrayElemAt: ["$$currentSlot", 0] }, // Return the current slot
                        else: {
                          $cond: {
                            if: { $gt: [{ $size: "$timeSlots2" }, 0] }, // If timeSlots2 is not empty
                            then: { $arrayElemAt: ["$timeSlots2", { $subtract: [{ $size: "$timeSlots2" }, 1] }] }, // Return the last slot
                            else: null // No slots exist
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      
  }
  },
  {
    $lookup:{
      from:"contesthistories",
      localField:"_id",
      foreignField:"contestId",
      as:"contestCount"
    }
  },
  {
    $lookup: {
      from: "users", // Collection name for UserModel
      let: { contestId: "$_id" }, // Pass the contest ID to the sub-pipeline
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                {
                  $in: [
                    "$$contestId",
                    {
                      $map: {
                        input: "$contestnotify", // Iterate through the contestnotify array
                        as: "notify",
                        in: "$$notify.contestId", // Extract contestId from each notify object
                      },
                    },
                  ],
                },
                // Uncomment the below line to filter by userId if required
                { $eq: ["$_id", new Types.ObjectId(userId)] },
              ],
            },
          },
        },
      ],
      as: "userData", // Store the result of the lookup in this field
    },
  },
  {
    $addFields: {
      isUserBookMarked: {
        $in: [
          {
            contestId: "$_id",
            subcategoryId: "$subcategoryId",
          },
          {
            $map: {
              input: {
                $ifNull: [{ $arrayElemAt: ["$userData.contestnotify", 0] }, []],
              },
              as: "notify",
              in: {
                contestId: "$$notify.contestId",
                subcategoryId: "$$notify.subcategoryId",
              },
            },
          },
        ],
      },
    },
  },
  {
    $lookup: {
      from: "users", // Collection name for UserModel
      let: { contestId: "$_id" }, // Pass the contest ID to the sub-pipeline
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                {
                  $in: [
                    "$$contestId",
                    {
                      $map: {
                        input: "$contestNotification", // Iterate through the contestnotify array
                        as: "notify",
                        in: "$$notify.contestId", // Extract contestId from each notify object
                      },
                    },
                  ],
                },
                // Uncomment the below line to filter by userId if required
                { $eq: ["$_id", new Types.ObjectId(userId)] },
              ],
            },
          },
        },
      ],
      as: "userData2", // Store the result of the lookup in this field
    },
  },
  {
    $addFields: {
      isNotificationActive: {
        $in: [
          {
            contestId: "$_id",
            subcategoryId: "$subcategoryId",
          },
          {
            $map: {
              input: {
                $ifNull: [{ $arrayElemAt: ["$userData2.contestNotification", 0] }, []],
              },
              as: "notify",
              in: {
                contestId: "$$notify.contestId",
                subcategoryId: "$$notify.subcategoryId",
              },
            },
          },
        ],
      },
    },
  },
  {
    $project: {
      _id: 1,
      entryAmount: 1,
      isUserBookMarked:1,
      isNotificationActive:1,
      isBotActive:1,
      state:1,
      slots: 1,
      upto: 1,
      totalAmount: 1,
      type: 1,
      typeCashBonus: 1,
      bonusCashPercentage: 1,
      bonusCashAmount: 1,
      subcategoryId: 1,
      platformFeePercentage: 1,
      platformFeeAmount: 1,
      prizeDistributionPercentage: 1,
      prizeDistributionAmount: 1,
      rankDistribution: 1,
      prizeDistribution: 1,
      rankCount: 1,
      rankPercentage: 1,
      timeSlots: 1,
      subcategoryDetails:1,
      startDateTime:1,
      endDateTime:1,
      favorite:1,
      contestCount: {
        $filter: {
          input: "$contestCount",
          as: "contest",
          cond: { $eq: ["$$contest.timeslotId", "$timeSlots._id"] } // Filter based on timeSlots ID
        }
      }
    }
  },
  {
    $addFields: {
      slotsContestFillInfo: {
        $map: {
          input: {
            $filter: {
              input: "$contestCount",
              as: "contest",
              cond: { $eq: ["$$contest.timeslotId", "$timeSlots._id"] }
            }
          },
          as: "contest",
          in: {
            slotsFillCount: { $size: "$$contest.userranks" } // Count of slotsFill array
            // bids will count in slot fill 
          }
        }
      }
    }
  },
  {
    $addFields: {
      isUserJoinContest: {
        $reduce: {
          input: {
            $filter: {
              input: "$contestCount",
              as: "contest",
              cond: { $eq: ["$$contest.timeslotId", "$timeSlots._id"] }
            }
          },
          initialValue: false,
          in: {
            $or: [
              "$$value", // Keep previous result if true
              {
                $in: [
                  { $toObjectId: userId }, // Ensure userId is converted to ObjectId
                  "$$this.slotsFill" // Check if userId exists in slotsFill (array of ObjectIds)
                ]
              }
            ]
          }
        }
      }
    }
  },
  {
    $addFields: {
      favoriteCount: { 
        $size: { $ifNull: ["$favorite", []] } 
      }
    }
  },
  {
    $addFields: {
      currentFillInfo: {
        $map: {
          input: {
            $filter: {
              input: "$contestCount",
              as: "contest",
              cond: { $eq: ["$$contest.timeslotId", "$timeSlots._id"] }
            }
          },
          as: "contest",
          in: "$$contest.currentFill"
        }
      }
    }
  },
  {
    $addFields: {
      isUserJoinContest: {
        $reduce: {
          input: {
            $filter: {
              input: "$contestCount",
              as: "contest",
              cond: { $eq: ["$$contest.timeslotId", "$timeSlots._id"] }
            }
          },
          initialValue: false,
          in: {
            $or: [
              "$$value", // Keep previous result if true
              {
                $in: [
                  { $toObjectId: userId }, // Ensure userId is converted to ObjectId
                  "$$this.slotsFill" // Check if userId exists in slotsFill (array of ObjectIds)
                ]
              }
            ]
          }
        }
      }
    }
  },
 
  {
    $group:{
      _id:"$subcategoryDetails._id",  
      category:{$first:"$subcategoryDetails"},
      sortByEntryAmount: { $first: "$entryAmount" }, // Capture smallest or largest entryAmount for sorting groups
      sortBywiningPercentage: { $first: "$rankPercentage" },
      sortBySlotSize:{ $first: "$slots" },
      sortByPrizePoll:{$first:"$prizeDistributionAmount"},
      contestType:{$first:"$type"},
      contests: {
        $push: {
          entryAmount: "$entryAmount",
          state:"$state",
          isBotActive:"$isBotActive",
          slots: "$slots",
          isUserBookMarked: "$isUserBookMarked",
          isNotificationActive: "$isNotificationActive",
          upto: "$upto",
          totalAmount: "$totalAmount",
          type: "$type",
          typeCashBonus: "$typeCashBonus",
          bonusCashPercentage: "$bonusCashPercentage",
          bonusCashAmount: "$bonusCashAmount",
          favoriteCount:"$favoriteCount",
          // Exclude subcategoryId here if you don’t need it
          platformFeePercentage: "$platformFeePercentage",
          platformFeeAmount: "$platformFeeAmount",
          prizeDistributionPercentage: "$prizeDistributionPercentage",
          prizeDistributionAmount: "$prizeDistributionAmount",
          rankDistribution: "$rankDistribution",
          prizeDistribution: "$prizeDistribution",
          rankCount: "$rankCount",
          rankPercentage: "$rankPercentage",
          startDateTime: "$startDateTime",
          endDateTime: "$endDateTime",
          _id:"$_id",
          slotsContestFillInfo: { $arrayElemAt: ["$slotsContestFillInfo", 0] }, // First element of slotsContestFillInfo
          timeSlots:"$timeSlots",
          isUserJoinContest:"$isUserJoinContest",
          currentFillInfo: { $arrayElemAt: ["$currentFillInfo", 0] },
        
  }, 
      }
    }
  },
  sortStage2,

    ])

  return response
} catch (error) {
  console.error(error);
  throw error}}

module.exports = {getMainCategoryData,getMainCategoryDataContestData}