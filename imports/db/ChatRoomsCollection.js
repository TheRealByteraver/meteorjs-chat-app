import { Mongo } from 'meteor/mongo';

/*
  Document structure:
  {
    - _id (given by Mongo),
    - userIdList: an array of user objects, each of these objects contains:
      - userId
      - username
    - createdAt timeStamp (of chatRoom creation)
  }

Example:
  { 
    "_id" : "etSPm5xHmRAR7YCTk", 
    "userIdList" : [ 
      { "userId" : "xcdFdDxJ4zJxZhgMm", "username" : "Glenn" }, 
      { "userId" : "jQLrFrPt5kZRidR7P", "username" : "Erland" } 
    ], 
    "createdAt" : ISODate("2021-11-18T20:42:38.523Z") 
  }
*/

export const ChatRoomsCollection = new Mongo.Collection('chatRooms');