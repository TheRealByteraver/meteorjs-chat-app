import { Meteor } from 'meteor/meteor';
import { ChatRoomsCollection } from '../db/ChatRoomsCollection';

// note: do not use an arrow function for 'publishChatMessages' here
// or 'this' will not work
Meteor.publish('chatRooms', function publishChatRooms() {
  return ChatRoomsCollection.find( 
    { 'userIdList.userId': { $eq: this.userId } } ); 
});