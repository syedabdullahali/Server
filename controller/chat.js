const { Types } = require('mongoose');
const ChatSession = require('../model/chat');
const userDetail =  require('../model/user/user')


// async function addMessage(chatId, senderId, messageContent, messageType = 'text') {
//     const message = new Message({
//       chatId,
//       senderId,
//       message: messageContent,
//       type: messageType,
//     });
//     await message.save();
// }

// async function getMessages(chatId) {
//     const messages = await Message.find({ chatId }).sort({ createdAt: 1 }); // Sort by time
//     console.log('Messages:', messages);
//     return messages;

// }

// async function getPaginatedMessages(chatId, page, limit) {
//     const messages = await Message.find({ chatId })
//       .sort({ createdAt: 1 })
//       .skip((page - 1) * limit)
//       .limit(limit);
//     return messages;
// }

async function getUserDetail(chatId, page, limit) {
    try{
        const messages = await userDetail.find({type:"user"})
        return messages;
    }catch (error){
        return error
    }
}

async function getChatUserDetail(chatId, page, limit) {
    try{
        const messages = await ChatSession.aggregate([
            {
              $lookup: {
                from: "users", // Replace with the actual participants' collection name
                localField: "participants",
                foreignField: "_id",
                as: "user",
              },
            },
            {$unwind:"$user"},
            {
                $project:{
                    user:1,
                    latestMessage: {
                        $reduce: {
                          input: "$messages",
                          initialValue: null,
                          in: {
                            $cond: [
                              { 
                                $gt: ["$$this.timestamp", { $ifNull: ["$$value.timestamp", new Date(0)] }]
                              },
                              "$$this",
                              "$$value"
                            ]
                          }
                        }
                      } 
                }
            }
        
          ]);
          
        return messages;
    }catch (error){
        return error
    }
}

async function sendMessageToClient(clientId,message,participantId,role) {
  try {
    console.log(clientId, participantId)
    const chatSession = await ChatSession.findOne({
      participants: clientId,
    });

    if (!chatSession) {
      const temp = new ChatSession({
        participants: clientId,
        participantsArray: [clientId,participantId],
        messages: [
          {
            senderId: role!="user"?clientId:participantId,
            receiverId:role=="user"?clientId:participantId,
            message: message,
            type: "text",
          },
        ],
      });
      await temp.save();
    } else {
      chatSession.messages.push({
        senderId: role!="user"?clientId:participantId,
        receiverId:role=="user"?clientId:participantId,
        message: message,
        type: "text",
      });
      await chatSession.save()
    }
  } catch (error) {
    console.log(error)
    return error;
  }
}

async function handleJoinRoom(clientId,adminId){    
    try{
        const chatSession = await ChatSession.aggregate([
            {
              $match: {
                participants: new Types.ObjectId(clientId),
              },
            },
            {
              $unwind: "$messages", // Unwind the messages array
            },
            {
              $replaceRoot: {
                newRoot: "$messages", // Replace the root with the message object
              },
            },
            {
                $addFields: {
                  sent: {
                    $eq: ["$receiverId", new Types.ObjectId(clientId)], // Compare senderId and clientId
                  },
                },
              },
          ]);

      if (!chatSession) {
        const temp = new ChatSession({
          participants: clientId,
          participantsArray: [clientId,participantId],
          messages: [
            {
              senderId: role=="user"?clientId:participantId,
              receiverId:role!="user"?clientId:participantId,
              message: message,
              type: "text",
            },
          ],
        });
        await temp.save();
        return []
      }
      return chatSession
    }catch(error){
        return error
    }
}

async function createChatSession(clientId,id){
    try{ 
      const messages = await ChatSession.findOne({participants:clientId});
    //   console.log(messages)
      if(!messages){
        const temp = new ChatSession({
            participants: clientId,
            participantsArray: [clientId,id],
            messages: [],
        });
        await temp.save()
      }
      return messages
    }catch(error){
        console.log(error)
        return error
    }
}

  
  

module.exports ={getUserDetail,sendMessageToClient,getChatUserDetail,
handleJoinRoom,createChatSession}