import { Template } from 'meteor/templating';
import { ChatRoomsCollection } from '../db/ChatRoomsCollection';
import { ChatMessagesCollection } from '../db/ChatMessagesCollection';
import { ReactiveDict } from 'meteor/reactive-dict';

import './App.html';
import './Login.js';

const SELECTED_CHATROOM_STRING = 'selectedChatRoom';

// Helper functions
const getUser = () => Meteor.user();

const isUserLogged = () => !!getUser(); // force boolean

const getTalkingToStr = (chatRoom) => {
  const currentUser = getUser();
  if (!chatRoom || !chatRoom.userIdList) {
    return '';
  }
  return chatRoom.userIdList
    .map(user => user.username)
    .filter(username => (username !== currentUser.username))
    .join(', ');
}

/*
find all messages for this chatRoom based on the _id
of this chatRoom and remap the messages to an array 
of objects of the following format:
{ 
  _id,              // Mongo Id of the message
  disabledAttr,     // undefined or equal to 'disabled'
  author,           // username, empty if 'own' message
  message: 'message text' 
}
*/
const getMessages = (chatRoom) => {
  const currentUser = getUser();

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

// get all chatRooms in which this user is taking part
const getCurrentUserChatRooms = () => {
  const currentUser = getUser();
  return ChatRoomsCollection.find(
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
}

Template.mainContainer.onCreated(function mainContainerOnCreated() {
  this.state = new ReactiveDict();
});

Template.mainContainer.events({
  'click .chatroom-title'(event, instance) {

    instance.state.set(SELECTED_CHATROOM_STRING, event.target.dataset.chatroomindex);

    // debug:
    // const currentSelectedChatRoom = instance.state.get(SELECTED_CHATROOM_STRING);
    // console.log('chatroom id: ', event.target.dataset.chatroomindex);
    // console.log('currently selected chatroom id: ', currentSelectedChatRoom);
  },
  'click .logout'() {
    Meteor.logout();
  }
});

Template.mainContainer.helpers({
  chatRoomTitles() {
    const chatRooms = getCurrentUserChatRooms();

    return chatRooms.map(chatRoom => ({
      talkingTo: getTalkingToStr(chatRoom),
      _id: chatRoom._id
    }));
  },
  chatRooms() { // not used
    const chatRooms = getCurrentUserChatRooms();
    return chatRooms.map(chatRoom => {
      return {
        ...chatRoom,   
        talkingTo: getTalkingToStr(chatRoom),
        messages: getMessages(chatRoom),
      };
    });
  },
  activeChatRoom() {
    const currentSelectedChatRoom = 
      Template.instance().state.get(SELECTED_CHATROOM_STRING);

    // console.log('currentSelectedChatRoom: ', currentSelectedChatRoom);
    if (!currentSelectedChatRoom) {
      return [{
        _id: 0,   
        talkingTo: '',
        messages: [],
      }];
    }
    const chatRoom = ChatRoomsCollection.findOne( { _id: currentSelectedChatRoom } );
    // console.log('found chatRoom: ', chatRoom);

    const retObj = {
      ...chatRoom,   
      talkingTo: getTalkingToStr(chatRoom),
      messages: getMessages(chatRoom),
    };
    return [retObj];
  },
  isUserLogged() {
    return isUserLogged();
  },
  getUsername() {
    const user = getUser();
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
    // const chatRoomId = target.previousElementSibling.dataset.chatroomindex;
    const chatRoomId = 
      Template.instance().data._id; // ??? why does this work?

    Meteor.call('chatMessages.insert', chatRoomId, text);

      // Clear form
    target.text.value = '';
  },
});

Template.message.events({
  'click .delete-message'() {
    Meteor.call('chatMessages.remove', this._id);
  },
});