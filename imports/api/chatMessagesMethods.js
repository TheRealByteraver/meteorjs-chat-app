import { check } from 'meteor/check';
import { ChatRoomsCollection } from '../db/ChatRoomsCollection';
import { ChatMessagesCollection } from '../db/ChatMessagesCollection';

// Helper functions
const getUser = () => Meteor.user();

Meteor.methods({
  'chatMessages.insert'(chatRoomId, messageText) {
    check(messageText, String);

    // Check if message contains text
    if (!messageText || messageText == '') {
      throw new Meteor.Error('Message is empty.'); 
    }
  
    // Check if user is logged in
    if (!this.userId) {
      throw new Meteor.Error('Not authorized.'); 
    }

    // Check if user is part of this chatRoom
    const currentUser = getUser();

    const chatRoom = 
      ChatRoomsCollection.findOne({ _id: chatRoomId });
    
    // First, check if the chatRoom exists
    if (!chatRoom) {
      throw new Meteor.Error('ChatRoom does not exist.'); 
    }

    const user = 
      chatRoom.userIdList.filter(user => (user.userId === currentUser._id));

    // Second, check if the current user is included in this chatRoom
    if (!user) {
      throw new Meteor.Error('Access denied.'); 
    }

    // Save messsage to database
    ChatMessagesCollection.insert({
      chatRoomId: chatRoom._id,
      author: {
        userId: currentUser._id,   
        username: currentUser.username, 
      },
        createdAt: new Date(), 
        message: messageText
    });
  },
  'chatMessages.remove'(messageId) {
    const chatMessage = ChatMessagesCollection.findOne({ _id: messageId });

    // Check if message exists
    if (!chatMessage) {
      throw new Meteor.Error('Delete failed: message does not exist.'); 
    }

    // Check if user is the author of this message
    const currentUser = getUser();

    if (currentUser._id !== chatMessage.author.userId) {
      throw new Meteor.Error('Delete failed: you are not the author of this message.');
    }

    // Delete message
    ChatMessagesCollection.remove(messageId);
  },
});