const { Server } = require("socket.io");
const { getGroupedContestsByStatus } = require("./content");
const {
  checkAndCompleteMainContests,
  mycontestMainCategory,
  mycontestBycategoryId,
  winingUser,
} = require("../controller/upcomingLiveWinningController");
const {
  getPrivateContestData,
  checkAndCompleteContests,
  getSubContestByCatgroyId,
  PrivateContestCategory,
  GetPrivateContests,
  ParticipantCategory,
  getUserContestsByCategoryAndStatus,
  private_Contest_Info,
  private_Contest_Info_wining,
} = require("./privateContest");
const {
  getAndEmitContestsForAllCategories,
} = require("../sockethelper/mainContest");

const cron = require("node-cron");
const { users } = require("./socketUsers");
const {
  getMainCategoryData,
  getMainCategoryDataContestData,
} = require("./mainContest2");
// const { handaleBots } = require("../Bots/Bots");
const { hnadleDashBord } = require("./Dashbord");
const {
  winningLeaderBoard,
  LiveWinningLeaderBoard,
  winningLeaderBoardAdmin,
} = require("./winingLeaderBord");
const {
  getUserDetail,
  sendMessageToClient,
  getChatUserDetail,
  handleJoinRoom,
  createChatSession,
} = require("../controller/chat");
// const { handaleBotsBiddingRange } = require("../Bots2/Bots2");

// Schema to watch changes 
const contesthistory = require("../model/contesthistory");
const PrivateContest = require("../model/privatecontest"); 


// function to watch 

const watchCategoryChanges = (callback) => {
  contesthistory.watch().on('change', (change) => {
    //change.operationType === 'insert'or'update'or 'delete'
    callback()
  });
};

const wathPrivateContestChanges =(callback)=>{
  PrivateContest.watch().on('change', (change) => {
    //change.operationType === 'insert'or'update'or 'delete'
    callback()
  })
}




const initializeSocket = (server, app) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });
  app.use((req, res, next) => {
    req.io = io;
    next();
  });

  const userSockets = new Map();
  const adminSockets = new Map();



  io.on("connection", async (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId) {
      users[userId] = socket.id;
    }

    let roomData = {}; // Object to store room metadata
    
//------------------------------------------ Main Contest --------------------------------------------
    let mainCategoryData ={}
    let mainContestPrevData = {}

//------------------------------------------ Private Contest --------------------------------------------
    let prevPrivateContestCategory = {}
    let prevPrivateContestCategorySocketId=''
    let previousPrivateContestData = {}
    let previousFilterPrivateData ={}    
    let activePrivateRoom = {};
    let activePrivateCronsId = {}; 
    let prevprivateWiningData = {}
    let activeCronsId = {}; 
// ----------------------------------------- My Contest --------------------------------------------------
   let prevMyContestcategory ={}
    


//------------------------------------------ Main Contest --------------------------------------------

    // Fetch Category For Live Upcoming and Winning 

    function handleMainContest() {

      let allTimeDuration = [];
    
      // Function to fetch and emit main contest data
      const fetchAndEmitMainCategoryData = async (isMenual) => {
        try {
          const response = await getMainCategoryData();
    
          // Update allTimeDuration with unique time slot end times
          allTimeDuration = [
            ...response[0].live,
            ...response[0].upcoming,
          ].reduce((uniqueTimes, el) => {
            const endTime = new Date(el?.timeSlots?.endTime).toISOString();
            if (endTime && !uniqueTimes.includes(endTime)) {
              uniqueTimes.push(endTime);
            }
            return uniqueTimes;
          }, []);
    
          // Emit data only if it has changed from the previous state
          if ((JSON.stringify(mainCategoryData) !== JSON.stringify(response)||isMenual)) {
            mainCategoryData = response; // Update the previous data
            socket.emit("get-main-contest-data", response);
          }
    
          console.log("Updated allTimeDuration:", allTimeDuration);
        } catch (error) {
          console.error("Error fetching main contest data:", error);
        }
      };
    
      // Timer management based on time slot end times
      const initializeTimers = () => {
        allTimeDuration.forEach((endTime) => {
          const endDate = new Date(endTime);
          const now = new Date();
          const milliseconds = endDate - now;
    
          if (milliseconds > 0) {
            setTimeout(async () => {
              console.log(`Timer completed for endTime: ${endTime}`);
              await fetchAndEmitMainCategoryData(false).then(initializeTimers)
            }, milliseconds);
          }          
        });
      };
    
      // Initial fetch and emit
      fetchAndEmitMainCategoryData(true).then(initializeTimers);
    }
    watchCategoryChanges(()=>{handleMainContest(true)})
    handleMainContest()

    // Fetch Category wise main contest Data 

    socket.on("Join_Category", (categoryData) => {
      const roomId = categoryData.joinCategoryId + "___" + categoryData.categoryStatus;

      let roomData = {};
      let allTimeDuration = [];

      if (!roomData[roomId]) {
        roomData[roomId] = {
          ...categoryData,
        };
      }

      roomData[roomId].userCount += 1;
      socket.join(roomId);

     const fetchMainCategoryContestData = async (isMenual)=>{
        try{
        const data = await   getMainCategoryDataContestData(
        categoryData.joinCategoryId, categoryData.categoryStatus,
        userId,categoryData.filterObj)

           if(["live","upcoming"].includes(categoryData.categoryStatus)){
          allTimeDuration=  data.reduce((uniqueTimesParent, el) => {
            const contests = el?.contests;
            if (contests.length) {
             const FlterTimeSlot=   contests.reduce((uniqueTimes, el) => {
                const endTime = new Date(el?.timeSlots?.endTime).toISOString();
                if (endTime && !uniqueTimes.includes(endTime)&&!uniqueTimesParent.includes(endTime)) {
                  uniqueTimes.push(endTime);
                }
                return uniqueTimes;
              }, [])
              if(FlterTimeSlot.length){
                uniqueTimesParent.push(...FlterTimeSlot)
              }
            }
            return uniqueTimesParent;
          }, []);
        }
                 // Emit data only if it has changed from the previous state
          if (JSON.stringify(mainContestPrevData[roomId]) !== JSON.stringify(data)||isMenual) {         
          if (categoryData.categoryStatus === "live") {
            io.to(roomId).emit("categoryLiveContestList", data);
          } else if (categoryData.categoryStatus === "upcoming") {
            io.to(roomId).emit("categoryUcomingContestList", data);
          } else if (categoryData.categoryStatus === "wining") {
            io.to(roomId).emit("categoryWiningContestList", data);
          }
          mainContestPrevData[roomId]=data
          }
        }catch(err){
          console.error("Initial fetch error:", err)
        };
      }

     const initializeTimers = () => {
          allTimeDuration.forEach((endTime) => {
            const endDate = new Date(endTime);
            const now = new Date();
            const milliseconds = endDate - now;
      
            if (milliseconds > 0) {
              setTimeout(async () => {
                console.log(`Timer completed for endTime: ${endTime}`);
                await fetchMainCategoryContestData(false).then(initializeTimers)
              }, milliseconds);
            }
          });
      };

      watchCategoryChanges(()=>{fetchMainCategoryContestData(true)})
      fetchMainCategoryContestData(true).then(initializeTimers)
    });
    

    socket.on("get-winninguser", (data) => {
      const socketId = users[data.userId]?.toString();
      const roomId = `${data.contestId}___${data.timeSlotId}___${socketId}`;

      // Join the socket room
      socket.join(roomId);

      // Stop and clean up any existing cron job for the same roomId
      if (activeCronsId[roomId]) {
        activeCronsId[roomId].stop();
        delete activeCronsId[roomId];
      }

      // Emit initial winning user data
     const handaleWiningUser =()=>{
        winingUser(data.contestId, data.timeSlotId, userId).then((response) => {
           io.to(roomId).emit("user-winning", response);
        });
     }
      handaleWiningUser()
      watchCategoryChanges(handaleWiningUser)
    });

  //------------------------------------------ Private Contest --------------------------------------------

    socket.on("get-privatecategory", (data) => {
      const { userId } = data;
      socket.join(userId);
      prevPrivateContestCategorySocketId = userId ;
      if (!prevPrivateContestCategorySocketId) {
        console.error("Invalid userId or socketId not found.");
        return;
      }
  
      let allTimeDuration = [];
    
      const emitCategories = async (isMenual) => {
        try {
          const response = await PrivateContestCategory(userId);
    
          // Collect unique endDateTime values from live and upcoming categories
          allTimeDuration = [...response.live,...response.upcoming]
          .reduce((crr, el) => {
            if (new Date(el.endDateTime)?.toISOString() && !crr.includes(new Date(el.endDateTime)?.toISOString())) {
              crr.push(new Date(el.endDateTime)?.toISOString());
            }
            return crr;
          }, []);

          if (JSON.stringify(prevPrivateContestCategory[prevPrivateContestCategorySocketId]) !== JSON.stringify(response)||isMenual) {
            io.to(prevPrivateContestCategorySocketId).emit("private-live-category", response.live);
            io.to(prevPrivateContestCategorySocketId).emit("private-upcoming-category", response.upcoming);
            io.to(prevPrivateContestCategorySocketId).emit("private-expired-category", response.expired);
            prevPrivateContestCategory[prevPrivateContestCategorySocketId] = response
          }

        } catch (error) {
          console.error("Error emitting category updates:", error);
        }
      };
    
      const initializeTimers = () => {
        allTimeDuration.forEach((endDateTime) => {
          const endTime = new Date(endDateTime);
          const now = new Date();
          const milliseconds = endTime - now;
    
          if (milliseconds > 0) {
            setTimeout(async () => {
              await emitCategories(false).then(initializeTimers);
            }, milliseconds);
          }
        });
      };
    
      // Initial category emission
      emitCategories(true).then(initializeTimers);
      wathPrivateContestChanges(()=>{emitCategories(false)})

      // Disconnect cleanup
      socket.on("disconnect", () => {
        socket.leave(userId);
        prevPrivateContestCategory={}
        prevPrivateContestCategorySocketId=''
        console.log(`Socket disconnected for userId: ${userId}`);
      });
    });

    socket.on("get-private-contest-by-category", (data) => {
      const { userId, categoryId } = data;
      const filterObj = data?.filterObj || {};
      let allTimeDuration = [];

    
      socket.join(userId, categoryId);
      const socketId = users[userId]?.toString();
    
      if (!socketId) {
        console.error(`Invalid userId: ${userId}`);
        return;
      }
    
      previousFilterPrivateData[userId] = filterObj;
    
      const emitCategories = async (categoryId, userId, filterObj,isMenual) => {
        try {
          const response = await GetPrivateContests(
            categoryId,
            userId,
            filterObj
          );
          // Compare new data with the previous data
          if ((
            !previousFilterPrivateData[userId] || 
            JSON.stringify(previousPrivateContestData[userId]) !== JSON.stringify(response)
            ||isMenual
          )) {
            // Save the new data
            previousPrivateContestData[userId] = response;
    
            allTimeDuration = [
              ...response.live,
              ...response.upcoming,
            ].reduce((uniqueTimes, el) => {
              const endTime = new Date(el?.endDateTime)?.toISOString();
              if (endTime && !uniqueTimes.includes(endTime)) {
                uniqueTimes.push(endTime);
              }
              return uniqueTimes;
            }, []);
    
            // Emit only if data has changed
            io.to(socketId).emit("private-live-contest", response.live || []);
            io.to(socketId).emit("private-upcoming-contest", response.upcoming || []);
            io.to(socketId).emit("private-expired-contest", response.expired || []);
          } else {
            console.log("No changes detected, skipping emit for userId:", userId);
          }
        } catch (error) {
          console.error("Error emitting category updates:", error);
        }
      };
    
      const initializeTimers = () => {
        allTimeDuration.forEach((endDateTime) => {
          const endTime = new Date(endDateTime);
          const now = new Date();
          const milliseconds = endTime - now;
    
          if (milliseconds > 0) {
            setTimeout(async () => {
              await  emitCategories(categoryId,userId,previousFilterPrivateData[userId],false).then(initializeTimers);
            }, milliseconds);
          }
        });
      };

      emitCategories(categoryId,userId,previousFilterPrivateData[userId],true)
      .then(initializeTimers);
    

    
      socket.on("disconnect", () => {
        socket.leave(userId);
        delete previousPrivateContestData[userId]; // Clean up previous data for the user
      });
    });
    socket.on("private_contest_info", async (data) => {
      try {
        socket.join(data.privateContestId);

        if (activePrivateRoom[data.privateContestId]) {
          activePrivateRoom[data.privateContestId].stop();
          delete activePrivateRoom[data.privateContestId];
        }
        const fetchPrivateContestInfo= async (data)=>{
          const contestData = await private_Contest_Info(data.privateContestId);
           socket.emit("Get_private_contest_info", contestData);
        }
        fetchPrivateContestInfo(data)
        wathPrivateContestChanges(()=>{fetchPrivateContestInfo(data)})

      } catch (error) {
        console.error("Error handling private_contest_info event:", error);
      }
    });

    socket.on("private-winninguser", async  (data) => {
      const socketId = users[data.userId]?.toString();
      const roomId = `${data.contestId}`;

      // Join the socket room
      socket.join(roomId);

      // Stop and clean up any existing cron job for the same roomId
      if (activePrivateCronsId[roomId]) {
        activePrivateCronsId[roomId].stop();
        delete activePrivateCronsId[roomId];
      }

      // Emit initial winning user data
      const fetchPrivateContestInfo =async (data)=>{
      const response = await private_Contest_Info_wining(data.contestId, userId)
      prevprivateWiningData[roomId]=response
      io.to(roomId).emit("get-private-user-winning", response);
      }
      fetchPrivateContestInfo(data)
      // Set up a new cron job for the current roomId
   
      wathPrivateContestChanges(()=>{fetchPrivateContestInfo(data)})

    });



//--------------------------------------------Unresolve Socket --------------------------------    

    socket.on("my-contestcategory", (data) => {
      const { userId } = data;
      let allTimeDuration = [];

      socket.join(userId);
      const socketId = users[userId].toString();
      
      const emitCategories = async (isMenual) => {
        try {

          const response = await mycontestMainCategory(userId);
          
          allTimeDuration = [...response.live,...response.upcoming].reduce((crr, el) => {
            if (new Date(el.endTime)?.toISOString() && !crr.includes(new Date(el.endTime)?.toISOString())) {
              crr.push(new Date(el.endTime)?.toISOString());
            }
            return crr;
          }, [])

          if (JSON.stringify(prevMyContestcategory) !== JSON.stringify(response)||isMenual) {         
            
            io.to(socketId).emit("mycontest-live-category", response.live);
            io.to(socketId).emit( "mycontest-upcoming-category", response.upcoming);
            io.to(socketId).emit("mycontest-expired-category", response.winning);

            prevMyContestcategory = response

          }
        
        } catch (error) {
          console.error("Error emitting category updates:", error);
        }
      };

      const initializeTimers = () => {
        allTimeDuration.forEach((endDateTime) => {
          const endTime = new Date(endDateTime);
          const now = new Date();
          const milliseconds = endTime - now;
    
          if (milliseconds > 0) {
            setTimeout(async () => {
              await emitCategories(false).then(initializeTimers);
            }, milliseconds);
          }
        });
      };
    
      // Initial category emission
      emitCategories(true).then(initializeTimers);

      socket.on("disconnect", () => {
        socket.leave(userId);
      });
    });

    socket.on("get-my-contest", (data) => {
      const { userId, categoryId } = data;
      socket.join(userId, categoryId);
      const socketId = users[userId];
      const emitContests = async () => {
        try {
          const response = await mycontestBycategoryId(userId, categoryId);
          io.to(socketId).emit("mycontest-live-contest", response.liveContests);
          io.to(socketId).emit(
            "mycontest-upcoming-contest",
            response.upcomingContests
          );
          io.to(socketId).emit(
            "mycontest-expired-contest",
            response.expiredContests
          );
        } catch (error) {
          console.error("Error emitting category updates:", error);
        }
      };
      emitContests();
  
      socket.on("disconnect", () => {
        socket.leave(userId);
      });
    });



  
   


    // socket.on("send update", ({ room, userId, message }) => {
    //   const socketId = userSocketMap[userId];
    //   if (socketId) {
    //     io.to(socketId).emit("update", { room, message });
    //     // console.log(`Update sent to ${userId} in room ${room}: ${message}`);
    //   } else {
    //     console.log(`User ${userId} not found`);
    //   }
    // });

    // main contest
    cron.schedule(
      `*/${process.env.EVENT_TRIGGER_TIME_SECOND} * * * * *`,
      () => {
        checkAndCompleteMainContests(io);
      }
    );

    hnadleDashBord()
      .then((data) => {
        socket.emit("get-dashbord-data", {
          status: "success",
          statusCode: 200,
          data,
        });
      })
      .catch((err) => {
        socket.emit("get-dashbord-data", {
          status: "somthing went wrong",
          statusCode: 500,
          data: err,
        });
      });

    cron.schedule(
      `*/${process.env.EVENT_TRIGGER_TIME_SECOND} * * * * *`,
      () => {
        hnadleDashBord()
          .then((data) => {
            socket.emit("get-dashbord-data", {
              status: "success",
              statusCode: 200,
              data,
            });
          })
          .catch((err) => {
            socket.emit("get-dashbord-data", {
              status: "somthing went wrong",
              statusCode: 500,
              data: err,
            });
          });
      }
    );

    cron.schedule(
      `*/${process.env.EVENT_TRIGGER_TIME_SECOND} * * * * *`,
      () => {
        getAndEmitContestsForAllCategories(io);
      }
    );

    cron.schedule(
      `*/${process.env.EVENT_TRIGGER_TIME_SECOND} * * * * *`,
      async () => {
        const updatedData = await getGroupedContestsByStatus();
        socket.emit("get_Rank_Toper", updatedData);
      }
    );

    socket.on("disconnect", () => {
      delete users[userId];
    });

  
    socket.on("postWiningLeaderBord", async (obj) => {
      try {
        const userId = socket.userId; // Ensure `userId` is available in the socket context
        const roomId = `${obj.contestId}${obj.timeSlotId}${userId}`;

        socket.join(roomId);


        const getWiningUser= async ()=>{
          const initialResponse = await winningLeaderBoard(obj);
          // Emit the initial leaderboard data to the room
          io.to(roomId).emit("getWiningLeaderBord", initialResponse);
         }
        // Join the user to the specific room

        // Fetch the initial leaderboard response
        watchCategoryChanges(()=>{getWiningUser()})
        getWiningUser()

        // Handle room cleanup on socket disconnect
        socket.on("disconnect", () => {
          socket.leave(roomId); // Remove the socket from the room
        });
      } catch (error) {
        console.error("Error in postWiningLeaderBord:", error.message);
        socket.emit("error", {
          message: "Failed to process leaderboard request.",
        });
      }
    });

    socket.on("postWiningLeaderBordAdmin", async (obj) => {
      try {
        const userId = socket.userId; // Ensure `userId` is available in the socket context
        const roomId = `${obj.contestId}${obj.timeSlotId}${userId}`;

        // Join the user to the specific room
        socket.join(roomId);

        // Fetch the initial leaderboard response
        const getWiningUser =async ()=>{
          const initialResponse = await winningLeaderBoardAdmin(obj);
          // Emit the initial leaderboard data to the room
          io.to(roomId).emit("getWiningLeaderBordAdmin", initialResponse);
        }
        watchCategoryChanges(()=>{getWiningUser()})
        getWiningUser()

        // Schedule the leaderboard updates at intervals

        // Handle room cleanup on socket disconnect
        socket.on("disconnect", () => {
          socket.leave(roomId); // Remove the socket from the room
        });
      } catch (error) {
        console.error("Error in postWiningLeaderBord:", error.message);
        socket.emit("error", {
          message: "Failed to process leaderboard request.",
        });
      }
    });

    socket.on("postLiveWiningLeaderBord", async (obj) => {
      try {
        const userId = socket.userId; // Ensure `userId` is available in the socket context
        const roomId = `${obj.contestId}${obj.timeSlotId}${userId}`;

        // Join the user to the specific room
        socket.join(roomId);

        // Fetch the initial leaderboard response
        const getWiningUser= async()=>{
        const initialResponse = await LiveWinningLeaderBoard(obj);

        // Emit the initial leaderboard data to the room
        io.to(roomId).emit("getLiveWiningLeaderBord", initialResponse);
        }

        watchCategoryChanges(()=>{getWiningUser()})
        getWiningUser()

        // Schedule the leaderboard updates at intervals
       

        // Handle room cleanup on socket disconnect
        socket.on("disconnect", () => {
          socket.leave(roomId); // Remove the socket from the room
        });
      } catch (error) {
        console.error("Error in postWiningLeaderBord:", error.message);
        socket.emit("error", {
          message: "Failed to process leaderboard request.",
        });
      }
    });

  //--------------------------------------------User and Admin Chat---------------------------------------

    socket.on("userList", async (obj) => {
      try {
        const response = await getUserDetail();
        socket.emit("userListData", {
          data: response,
          success: true,
          message: "Successfully Fetched User Data",
        });
      } catch (error) {
        socket.emit("userListData", {
          data: error,
          success: false,
          message: "Failed to Fetched User Data",
        });
      }
    });

    socket.on("chatUserList", async (obj) => {
      try {
        const response = await getChatUserDetail();
        socket.emit("chatUserListData", {
          data: response,
          success: true,
          message: "Successfully Fetched User Data",
        });
      } catch (error) {
        socket.emit("chatUserListData", {
          data: error,
          success: false,
          message: "Failed to Fetched User Data",
        });
      }
    });

    socket.on("join-user", async ({ userId, adminId }) => {
      socket.join(userId); // Join the specified room
      const messages = await handleJoinRoom(userId, adminId);
      io.to(userId).emit("message", { data: messages, success: true });
    });

    socket.on("admin-to-user", async ({ clientId, message, adminId }) => {
      try {
        await sendMessageToClient(clientId, message, adminId, "admin");
        const messages = await handleJoinRoom(clientId, adminId);
        io.to(clientId).emit("message", { data: messages, success: true });
      } catch (error) {
        io.to(clientId).emit("message-error", {
          from: "admin",
          message: "Failed to send admin message.",
        });
      }
    });

    socket.on("user-to-admin", async ({ clientId, message, adminId }) => {
      try {
        await sendMessageToClient(clientId, message, adminId, "user");
        const messages = await handleJoinRoom(clientId, adminId);
        io.to(clientId).emit("message", { data: messages, success: true });
      } catch (error) {
        io.to(clientId).emit("message-error", {
          from: "user",
          message: "Failed to send user message.",
        });
      }
    });

    socket.on("createChatsession", async ({ clientId, adminId }) => {
      try {
        const messages = await createChatSession(clientId, adminId);
        io.to(clientId).emit("createChatsessionStatus", {
          data: messages,
          success: true,
        });
      } catch (error) {
        io.to(clientId).emit("createChatsessionStatus-error", {
          from: "user",
          message: "Failed to send user message.",
        });
      }
    });

    //---------------------------------------------------------Not Approved Sockets---------------------------------------

    socket.on("get-participant-contest-by-category", (data) => {
      const { userId, categoryId } = data;
      socket.join(userId, categoryId);
      const socketId = users[userId].toString();
      const emitCategories = async () => {
        try {
          const response = await getUserContestsByCategoryAndStatus(
            userId,
            categoryId
          );
          io.to(socketId).emit("participant-live-contest", response.live);
          io.to(socketId).emit(
            "participant-upcoming-contest",
            response.upcoming
          );
          io.to(socketId).emit("participant-expired-contest", response.expired);
        } catch (error) {
          console.error("Error emitting category updates:", error);
        }
      };
      emitCategories();
      const cronJob = cron.schedule(
        `*/${process.env.EVENT_TRIGGER_TIME_SECOND} * * * * *`,
        emitCategories
      );
      socket.on("disconnect", () => {
        cronJob.stop();
        socket.leave(userId);
      });
    });

    socket.on("get-participant-category", (data) => {
      const { userId } = data;
      socket.join(userId);
      const socketId = users[userId].toString();
      const emitCategories = async () => {
        try {
          const response = await ParticipantCategory(userId);
          io.to(socketId).emit("participant-live-category", response.live);
          io.to(socketId).emit(
            "participant-upcoming-category",
            response.upcoming
          );
          io.to(socketId).emit(
            "participant-expired-category",
            response.expired
          );
        } catch (error) {
          console.error("Error emitting category updates:", error);
        }
      };
      emitCategories();
      const cronJob = cron.schedule(
        `*/${process.env.EVENT_TRIGGER_TIME_SECOND} * * * * *`,
        emitCategories
      );
      socket.on("disconnect", () => {
        cronJob.stop();
        socket.leave(userId);
      });
    });
    socket.on("get-private-contest-ByID", (data) => {
      getSubContestByCatgroyId(data.categoryId, io);
    });

    getPrivateContestData()
      .then((data) => {
        socket.emit("private_contest", data);
      })
      .catch((err) => {
        console.error("Error fetching private contests:", err);
    });

    cron.schedule(
      `*/${process.env.EVENT_TRIGGER_TIME_SECOND} * * * * *`,
      async () => {
        const updatedData = await getGroupedContestsByStatus();
        socket.emit("contests-data", updatedData);
      }
    );

    cron.schedule(
      `*/${process.env.EVENT_TRIGGER_TIME_SECOND} * * * * *`,
      async () => {
        const data = await getPrivateContestData();
        socket.emit("private_contest", data);
      }
    );
 
    getGroupedContestsByStatus()
      .then((data) => {
        socket.emit("contests-data", data);
      })
      .catch((err) => {
        console.error("Error fetching contests:", err);
      });
  });
  

};

module.exports = initializeSocket;

