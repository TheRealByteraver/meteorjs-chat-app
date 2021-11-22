import { Meteor } from 'meteor/meteor';
import { ChatRoomsCollection } from '../db/ChatRoomsCollection';
import { ChatMessagesCollection } from '../db/ChatMessagesCollection';

// note: do not use an arrow function for 'publishChatMessages' here
// or 'this' will not work
Meteor.publish('chatMessages', function publishChatMessages() {
  console.log('this.userId inside ChatMessagesPublications = ', this.userId);

  // get all chatRooms in which the user participates
  const chatRooms = ChatRoomsCollection.find( 
    { 'userIdList.userId': { $eq: this.userId } } );

  // keep only the _id's of the chatRooms...
  const idList = chatRooms.map(chatRoom => chatRoom._id);

  // ... and return the messages associated with these chatRoom id's:
  return ChatMessagesCollection.find( 
    { 'chatRoomId': { $in: idList } } );
});