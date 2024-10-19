const utilities = require("../utilities");
const accountModel = require("../models/account-model");
const messageModel = require("../models/message-model");

/**
 * Deliver inbox view
 */
async function buildInbox(req, res) {
  const accountId = res.locals.accountData.account_id;
  const nav = await utilities.getNav();
  const messages = await messageModel.getMessagesToId(accountId);
  const archivedMessages = await messageModel.getMessageCountById(accountId, true);
  
  res.render("message/inbox", {
    title: `${res.locals.accountData.account_firstname} Inbox`,
    nav,
    inboxTable: utilities.buildInbox(messages),
    archived: false,
    archivedMessages,
  });
}

/**
 * Deliver archive view
 */
async function buildArchive(req, res) {
  const accountId = res.locals.accountData.account_id;
  const nav = await utilities.getNav();
  const messages = await messageModel.getMessagesToId(accountId, true);
  const unarchivedMessages = await messageModel.getMessageCountById(accountId, false);

  res.render("message/inbox", {
    title: `${res.locals.accountData.account_firstname} Inbox: Archived Messages`,
    nav,
    inboxTable: utilities.buildInbox(messages),
    archived: true,
    unarchivedMessages,
  });
}

/**
 * Deliver message view
 */
async function buildMessageView(req, res) {
  const messageId = req.params.messageId;
  const messageData = await messageModel.getMessageById(messageId);

  if (messageData.message_to === res.locals.accountData.account_id) {
    const nav = await utilities.getNav();
    res.render("message/message-view", {
      title: "Message: " + messageData.message_subject,
      nav,
      messageData,
    });
  } else {
    req.flash("notice", "You aren't authorized to view that message.");
    res.redirect("/message");
  }
}

/**
 * Deliver compose view
 */
async function buildCompose(req, res) {
  const nav = await utilities.getNav();
  const recipientData = await accountModel.getAccountList();
  let title = "Compose";
  let recipientList = "";

  if (req.params.messageId) {
    const replyTo = await messageModel.getMessageById(req.params.messageId);
    title = `Reply to ${replyTo.account_firstname} ${replyTo.account_lastname}`;
    res.locals.Subject = "Re: " + replyTo.message_subject;
    res.locals.Body = `\n\n\nOn ${replyTo.message_created.toLocaleString()} from ${replyTo.account_firstname} ${replyTo.account_lastname}:\n${replyTo.message_body}`;
    recipientList = utilities.buildRecipientList(recipientData, replyTo.account_id);
  } else {
    recipientList = utilities.buildRecipientList(recipientData);
  }

  res.render("message/compose", {
    title,
    nav,
    recipientList,
  });
}

/**
 * Process send message
 */
async function sendMessage(req, res) {
  await messageModel.sendMessage({
    message_from: res.locals.accountData.account_id,
    message_to: req.body.message_to,
    message_subject: req.body.message_subject,
    message_body: req.body.message_body,
  });

  res.redirect("/message");
}

/**
 * Deliver delete confirmation view
 */
async function buildDelete(req, res) {
  const nav = await utilities.getNav();
  const messageData = await messageModel.getMessageById(req.params.messageId);

  res.render("message/delete", {
    title: "Confirm Deletion",
    nav,
    messageData,
  });
}

/**
 * Process delete message
 */
async function deleteMessage(req, res) {
  await messageModel.deleteMessage(req.body.message_id);
  req.flash("notice", "Message deleted");
  res.redirect("/message");
}

/**
 * Toggle a message's read status
 */
async function toggleRead(req, res) {
  const messageReadStatus = await messageModel.toggleRead(req.params.messageId);
  res.json(messageReadStatus);
}

/**
 * Toggle a message's archived status
 */
async function toggleArchived(req, res) {
  const messageArchivedStatus = await messageModel.toggleArchived(req.params.messageId);
  res.json(messageArchivedStatus);
}

module.exports = {
  buildInbox,
  buildArchive,
  buildMessageView,
  buildCompose,
  sendMessage,
  buildDelete,
  deleteMessage,
  toggleRead,
  toggleArchived,
};