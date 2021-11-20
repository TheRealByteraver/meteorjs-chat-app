import { Template } from 'meteor/templating';
import { ChatRoomsCollection } from '../api/ChatRoomsCollection';
import { ChatMessagesCollection } from '../api/ChatMessagesCollection';

import './App.html';
import './Login.js';

const getUser = () => Meteor.user();
const isUserLogged = () => !!getUser(); // force boolean

Template.mainContainer.events({
  'click .logout'(){
    Meteor.logout();
  }
});

Template.mainContainer.helpers({
  chatRooms() {
    // get all chatRooms in which this user is taking part
    const currentUser = getUser();
    const chatRooms = ChatRoomsCollection.find(
      // filter: only select chatRooms where this user is taking part
      { userIdList: 
        { 
          "userId" : currentUser._id, 
          "username" : currentUser.username 
        } 
      },
      // oldest first
      { sort: { createdAt: 1 } }
    );

    // find all messages for this chatRoom based on the _id
    // of this chatRoom and remap the messages to an array 
    // of objects of the following format:
    // { 
    //   _id,              // Mongo Id of the message
    //   disabledAttr,     // undefined or equal to 'disabled'
    //   author,           // username, empty if 'own' message
    //   message: 'message text' 
    // }
    const getMessages = (chatRoom) => {
      // Select the messages for this particular chatRoom
      const messageFilter = { chatRoomId: chatRoom._id };

      // sort: oldest messages first
      const messageSort = { sort: { createdAt: 1 } };

      const messages = ChatMessagesCollection.find(
        messageFilter, messageSort).fetch();

      return messages.map(message => {
        const author = (message.author.username === currentUser.username) 
          ? ''
          : `${message.author.username} says:`;

        return {
          // keep track of the Mongo _id so we can manipulate the message elsewhere
          _id: message._id, 
          // disable message delete button for messages that are not from the
          // current User:
          disabledAttr: (message.author.username === currentUser.username) 
            ? undefined 
            : 'disabled',
          author,
          message: message.message
        };
      });
    }

    const getTalkingToStr = (chatRoom) => (
      chatRoom.userIdList
        .map(user => user.username)
        .filter(username => (username !== currentUser.username))
        .join(', '));

    return chatRooms.map(chatRoom => {

      // const messages = getMessages(chatRoom);

      return {
        ...chatRoom,   
        talkingTo: getTalkingToStr(chatRoom),
        messages: getMessages(chatRoom),
      };
    });
  },
  isUserLogged() {
    return isUserLogged();
  },
  getUsername() {
    const user = getUser();
    // console.log('user: ', user);
    return user
      ? ` ${user.username}`
      : ''; 
  },
});

Template.form.events({
  'submit .chat-form'(event) {
    // Prevent default browser form submit
    event.preventDefault();

    // Get value from form element
    const target = event.target;
    const text = target.text.value;

    // don't add empty messages to the chat
    if(text == '') {
      return;
    }
    // console.log(`text: #${text}#`);

    // Insert a task into the collection
    // Meteor.call('tasks.insert', text);
    const chatRoomId = target.previousElementSibling.dataset.chatroomindex;
    const currentUser = getUser();

    ChatMessagesCollection.insert({
      chatRoomId,
      author: {
        userId: currentUser._id,   
        username: currentUser.username, 
      },
        createdAt: new Date(), 
        message: text
    });

    // Clear form
    target.text.value = '';
  },
});

Template.message.events({
  'click .delete-message'() {
    ChatMessagesCollection.remove(this._id);
  },
});