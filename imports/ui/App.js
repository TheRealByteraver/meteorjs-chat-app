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
    let authorStr = '';
    // let disabledAttr = undefined;
    let floatRightClass = 'float-message-right';
    if (message.author.userId !== currentUser._id) {
      authorStr = `${message.author.username}:`;
      // disabledAttr = 'disabled';
      floatRightClass = undefined;
    }

    return {
      // keep track of the Mongo _id so we can delete the message elsewhere
      _id: message._id, 
      // disabledAttr,
      authorStr,
      floatRightClass,
      message: message.message
    };
  });
}

Template.mainContainer.onCreated(function mainContainerOnCreated() { 
    this.state = new ReactiveDict();

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
  // user logout functionality
  'click .logout-button'() {
    Meteor.logout();
  }
});

Template.mainContainer.helpers({
  chatRoomTitles() {
    const currentUser = getUser();
    const chatRooms = ChatRoomsCollection.find(
      // filter: only select chatRooms where this user is taking part
      { 'userIdList.userId': currentUser._id },
      // oldest first
      { sort: { createdAt: 1 } }
    );
    return chatRooms.map(chatRoom => ({
      chatRoomTitle: getTalkingToStr(chatRoom),
      chatRoomId: chatRoom._id
    }));
  },
  activeChatRoomId(){
    const currentSelectedChatRoom = 
      Template.instance().state.get(SELECTED_CHATROOM_STRING);
    return currentSelectedChatRoom;
  },
  talkingTo(){
    const currentSelectedChatRoom = 
    Template.instance().state.get(SELECTED_CHATROOM_STRING);
    const chatRoom = ChatRoomsCollection.findOne( { _id: currentSelectedChatRoom } );
    return getTalkingToStr(chatRoom);
  },
  messages() {
    const currentSelectedChatRoom = 
    Template.instance().state.get(SELECTED_CHATROOM_STRING);
    const chatRoom = ChatRoomsCollection.findOne( { _id: currentSelectedChatRoom } );
    return getMessages(chatRoom);
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

    // I guess this is called cheating
    const chatRoomId = target.nextElementSibling.dataset.chatroomindex;

    Meteor.call('chatMessages.insert', chatRoomId, text);

      // Clear form
    target.text.value = '';
  },
});

Template.message.events({
  'click .delete-message-button'() {
    Meteor.call('chatMessages.remove', this._id);
  },
});