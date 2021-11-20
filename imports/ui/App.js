import { Template } from 'meteor/templating';
import { ChatRoomsCollection } from '../api/ChatRoomsCollection';
import { ChatMessagesCollection } from '../api/ChatMessagesCollection';

import './App.html';
import './Login.js';

const getUser = () => Meteor.user();
const isUserLogged = () => !!getUser(); // force boolean

Template.mainContainer.helpers({
  chatRooms() {
    // get all chatRooms
    const chatRooms = ChatRoomsCollection.find({});

    // find all messages for this chatRoom based on the _id
    // of this chatRoom and remap the messages to an array 
    // of objects of the following format:
    // { author: username, message: 'message text' }
    return chatRooms.map(chatRoom => {

      // only keep the messages for this particular chatRoom
      const messageFilter = { chatRoomId: chatRoom._id };

      // sort: oldest messages first
      const messageSort = { sort: { createdAt: 1 } };

      const messages = ChatMessagesCollection.find(
        messageFilter, messageSort).fetch();

      // set it to undefined or 'disabled'
      // const disabledAttr = 'disabled';
      const disabledAttr = undefined; // TEMP

      return {
        ...chatRoom,
        messages: messages.map(message => ({
          // keep track of the Mongo _id so we can manipulate the message elsewhere
          _id: message._id, 
          disabledAttr,
          author: message.author.username,
          message: message.message
        }))
      };
    });
  },
  isUserLogged() {
    return isUserLogged();
  },
});

Template.form.events({
  'submit .chat-form'(event) {
    // Prevent default browser form submit
    event.preventDefault();

    // Get value from form element
    const target = event.target;
    const text = target.text.value;

    // Insert a task into the collection
    // Meteor.call('tasks.insert', text);
    const chatRoomId = target.previousElementSibling.dataset.chatroomindex;
    ChatMessagesCollection.insert({
      chatRoomId,
      author: {
        userId: 'unknown',   // TEMP
        username: 'unknown', // TEMP
      },
        createdAt: new Date(), 
        message: text
    });

    // Clear form
    target.text.value = '';
  },
});

Template.message.events({
  'click .delete'() {
    ChatMessagesCollection.remove(this._id);
  },
});