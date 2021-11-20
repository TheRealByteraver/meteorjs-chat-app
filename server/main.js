import { Meteor } from 'meteor/meteor';
import { ChatRoomsCollection } from '../imports/api/ChatRoomsCollection';
import { ChatMessagesCollection } from '../imports/api/ChatMessagesCollection';

/*
  The 'insertChatRoom' function takes in an array of user objects. 
  Example of a User object:
  { 
    "_id" : "frSwFDAA63ABg9jXb", 
    "createdAt" : ISODate("2021-11-18T19:46:28.648Z"), 
    "services" : { "password" : { "bcrypt" : "$2b$10$8eJXsVoRV26W4O82w5aml.PTNCikbcUljRQnAdLx9WdJLdH4iTs4S" } }, 
    "username" : "Glenn" 
  }

  The 'insertChatRoom' function then saves a 'chatRoom' document (see 
  imports/api/ChatRoomsCollection.js for a full description).
*/
const insertChatRoom = userList => ChatRoomsCollection.insert({
  userIdList: [
    ...userList.map(user => (
      {
        userId: user._id,
        username: user.username
      })
    )
  ],
  createdAt: new Date(),
});

// Small userlist to get started
const userList = [
  {
    username: 'Glenn',
    password: 'glenn123',
  },
  {
    username: 'Yuri',
    password: 'yuri123',
  },
  {
    username: 'Maryna',
    password: 'maryna123',
  },
  {
    username: 'Erland',
    password: 'erland123',
  },
];

// code to run on server at startup
Meteor.startup(() => {

  // insert some users in case database is empty
  userList.forEach(user => {
    if (!Accounts.findUserByUsername(user.username)) {
      Accounts.createUser(user);
    }
  });
 
  // insert some chat rooms in case there aren't any
  if (ChatRoomsCollection.find().count() === 0) {
    [
      ['Glenn', 'Erland'],
      ['Erland', 'Maryna'],
      ['Yuri', 'Glenn'],
      ['Yuri', 'Erland'],
      ['Yuri', 'Glenn', 'Erland'],
    ].forEach(chatRoom => {

      // get user objects for every given username
      const userList = chatRoom.map(username => 
        Accounts.findUserByUsername(username));

      // filter undefined users (superfluous check for dummy data but ok)
      const validUserList = userList.filter(user => user !== undefined);

      if (validUserList.length > 1) {
        insertChatRoom(validUserList);
      } else {
        console.error('Error: chat room found with less than two users');
      }
    });
  }  

  // create a few messages if there aren't any yet
  if (ChatMessagesCollection.find().count() === 0) {

    // get chatRooms:
    const chatRooms = 
      ChatRoomsCollection.find({}, { sort: { createdAt: 1 } }).fetch();   
    if (chatRooms.length < 5) {
      console.error('Error: Not enough chatRooms found!');
    } else {
      [
        {
          chatRoomId: chatRooms[0]._id,
          author: chatRooms[0].userIdList[0], // object with { user_id, username }
          createdAt: new Date(),
          message: `This is a message from ${chatRooms[0].userIdList[0].username}`
        },
        {
          chatRoomId: chatRooms[0]._id,
          author: chatRooms[0].userIdList[1], // object with { user_id, username }
          createdAt: new Date(),
          message: `This is a message from ${chatRooms[0].userIdList[1].username}`
        }
      ].forEach(chatMessage => ChatMessagesCollection.insert(chatMessage));

      // and another set of messages (dummy data):
      [
        {
          chatRoomId: chatRooms[4]._id,
          author: chatRooms[4].userIdList[0], // object with { user_id, username }
          createdAt: new Date(),
          message: `This is a message from ${chatRooms[4].userIdList[0].username}`
        },
        {
          chatRoomId: chatRooms[4]._id,
          author: chatRooms[4].userIdList[1], // object with { user_id, username }
          createdAt: new Date(),
          message: `This is a message from ${chatRooms[4].userIdList[1].username}`
        },
        {
          chatRoomId: chatRooms[4]._id,
          author: chatRooms[4].userIdList[2], // object with { user_id, username }
          createdAt: new Date(),
          message: `This is a message from ${chatRooms[4].userIdList[2].username}`
        }
      ].forEach(chatMessage => ChatMessagesCollection.insert(chatMessage));
    }
  }
});