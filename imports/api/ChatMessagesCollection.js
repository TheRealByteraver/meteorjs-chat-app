import { Mongo } from 'meteor/mongo';

/*
  Document structure:
  {
    _id (given by Mongo),
    chatRoom _id,
    chat message author: an object with a user _id and a username
    timeStamp,
    chatMessage (text)
  }

Example:
  { 
    "_id" : "Zebq4FaLbXi9DcZEh", 
    "chatRoomId" : "etSPm5xHmRAR7YCTk", 
    "author" : 
      { 
        "userId" : "xcdFdDxJ4zJxZhgMm", 
        "username" : "Glenn" 
      }, 
    "createdAt" : ISODate("2021-11-18T21:34:21.257Z"), 
    "message" : "This is a message from Glenn" 
  }
*/
export const ChatMessagesCollection = new Mongo.Collection('chatMessages');