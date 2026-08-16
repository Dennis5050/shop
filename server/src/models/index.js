export { User } from './User.js';
export { Contact } from './Contact.js';
export { Conversation } from './Conversation.js';
export { Message } from './Message.js';
export { Group } from './Group.js';
export { Post } from './Post.js';
export { Comment } from './Comment.js';
export { Notification } from './Notification.js';

export default {
  User: () => import('./User.js').then((m) => m.User),
  Contact: () => import('./Contact.js').then((m) => m.Contact),
  Conversation: () => import('./Conversation.js').then((m) => m.Conversation),
  Message: () => import('./Message.js').then((m) => m.Message),
  Group: () => import('./Group.js').then((m) => m.Group),
  Post: () => import('./Post.js').then((m) => m.Post),
  Comment: () => import('./Comment.js').then((m) => m.Comment),
  Notification: () => import('./Notification.js').then((m) => m.Notification),
};
