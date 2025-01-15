const { Types } = require("mongoose");
const contestHistory = require("../model/contesthistory");
const walletSchema = require("../model/walletSchema");
const TransactionHistory =require("../model/transactionhistory")

const handlaeAllContestPrizeDistribution  = async (contest, session) => {
    try{
    const winningUsers = contest?.userranks
        .filter((rank) => rank.isInWiningRange && rank.WinningAmount > 0)
        .map((rank) => ({
            userId: rank.userId,
            WinningAmount: rank.WinningAmount,
        }));



    const bulkOperations = winningUsers.map((user) => ({
        updateOne: {
            filter: { user: user.userId },
            update: { $inc: { winningbalance: user.WinningAmount } },
            maxTimeMS: 60000,  // Set a max time (in ms) for the operation to run

        },
    }));


    // // Perform both bulk updates within the same session
    const response =  walletSchema.bulkWrite(bulkOperations);
    const response1 =contestHistory.findByIdAndUpdate(contest._id,{isPrizeDistributed: true},{new:true});


   const transactions = winningUsers.map(user => ({
        user: user.userId,
        type: "winning",
        amount: user.WinningAmount,
        description: `${user.WinningAmount} credited to your wallet as a prize for winning the contest`
   }));

   const response3 = await TransactionHistory.insertMany(transactions);
   return Promise.all([response,response1,response3])

} catch (error){
    throw error
}
};

async function handalePrizeDistribution(req, res) {
    // const session = await userDetail.startSession(); // Start a new session
    // session.startTransaction(); // Begin the transaction

    try {
        const currentTime = new Date();

        const contest = await contestHistory.aggregate([
            { $match: { contestId: new Types.ObjectId("675d27bd213255726d8f1e57") } },
            {
                $lookup: {
                    from: "timesheduleschemas",
                    localField: "timeslotId",
                    foreignField: "_id",
                    as: "timeslotId",
                },
            },
            { $unwind: "$timeslotId" },
            {
                $addFields: {
                    status: {
                        $cond: [
                            {
                                $and: [
                                    { $lte: ["$timeslotId.startTime", currentTime] },
                                    { $gte: ["$timeslotId.endTime", currentTime] },
                                ],
                            },
                            "active",
                            "stopped",
                        ],
                    },
                },
            },
            { $match: { status: "stopped",isPrizeDistributed:false } },
        ]);

        // Execute all prize distribution operations in parallel, passing the session
       const bulkResponse =   await Promise.all(contest.map(async (el) => await handlaeAllContestPrizeDistribution(el, 'session')));

        // Commit the transaction if all operations succeed
        // await session.commitTransaction();

        // res.status(200).json({ success: true, message: "Winnings distributed successfully!", data: bulkResponse[0][0] });
    } catch (error) {
        // If any error occurs, abort the transaction
        // await session.abortTransaction();
        // res.status(500).json({ success: false, message: "Failed to distribute winnings", data: error });
    } finally {
        // End the session
        // session.endSession();
    }
}

module.exports = { handalePrizeDistribution };
