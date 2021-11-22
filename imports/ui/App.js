import { Template } from 'meteor/templating';
import { ChatRoomsCollection } from '../db/ChatRoomsCollection';
import { ChatMessagesCollection } from '../db/ChatMessagesCollection';
import { ReactiveDict } from 'meteor/reactive-dict';

import './App.html';
import './Login.js';

const SELECTED_CHATROOM_STRING = 'selectedChatRoom';
const IS_CHATMESSAGE_LOADING_STRING = 'isChatMessageLoading';
const IS_CHATROOM_LOADING_STRING = 'isChatRoomLoading';

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
    { 'userIdList.userId': currentUser._id },
    // oldest first
    { sort: { createdAt: 1 } }
  );
}

Template.mainContainer.onCreated(function mainContainerOnCreated() { 
  this.state = new ReactiveDict();

  // ?
  const chatMessageHandler = Meteor.subscribe('chatMessages');
  const chatRoomHandler = Meteor.subscribe('chatRooms');
  Tracker.autorun(() => {
    this.state.set(IS_CHATMESSAGE_LOADING_STRING, !chatMessageHandler.ready()); 
  });
  Tracker.autorun(() => {
    this.state.set(IS_CHATROOM_LOADING_STRING, !chatRoomHandler.ready()); 
  });

});

Template.mainContainer.events({
  'click .chatroom-title'(event, instance) {
    // set active chatroom to the one selected by the user
    instance.state.set(SELECTED_CHATROOM_STRING, 
      event.target.dataset.chatroomindex);
  },
  'click .logout'() {
    Meteor.logout();
  }
});

Template.mainContainer.helpers({
  isLoading() { // ??? not used
    const instance = Template.instance();
    return instance.state.get(IS_LOADING_STRING);
  },
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

    if (!currentSelectedChatRoom) {
      return [{
        _id: 0,   
        talkingTo: '',
        messages: [],
      }];
    }
    const chatRoom = ChatRoomsCollection.findOne( { _id: currentSelectedChatRoom } );
    // todo: don't return array of chatRooms, it's always only one chatRoom
    return [{
      ...chatRoom,   
      talkingTo: getTalkingToStr(chatRoom),
      messages: getMessages(chatRoom),
    }];
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