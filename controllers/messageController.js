const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
require("dotenv").config()
const utilities = require("../utilities")
const accountModel = require("../models/account-model")
const messageModel = require("../models/message-model")

/* ****************************************
 *  Build inbox view get
 * ************************************ */
async function buildInbox(req, res, next) {
  try {
    const nav = await utilities.getNav()
    const messages = await messageModel.getMessagesToId(res.locals.accountData.account_id)
    const archivedMessages = await messageModel.getMessageCountById(res.locals.accountData.account_id, true)

    const inboxTable = utilities.buildInbox(messages)

    res.render("message/inbox", {
      title: `${res.locals.accountData.account_firstname} Inbox`,
      nav,
      errors: null,
      inboxTable,
      archived: false,
      archivedMessages,
    })
  } catch (error) {
    next(error)
  }
}

/* ****************************************
 *  Build archive view get
 * ************************************ */
async function buildArchive(req, res, next) {
  try {
    const nav = await utilities.getNav()
    const messages = await messageModel.getMessagesToId(res.locals.accountData.account_id, true)
    const unarchivedMessages = await messageModel.getMessageCountById(res.locals.accountData.account_id, false)
    const inboxTable = utilities.buildInbox(messages)

    res.render("message/inbox", {
      title: `${res.locals.accountData.account_firstname} Inbox: Archived Messages`,
      nav,
      errors: null,
      inboxTable,
      archived: true,
      unarchivedMessages,
    })
  } catch (error) {
    next(error)
  }
}

/* ****************************************
 *  Build message view get
 * ************************************ */
async function buildMessageView(req, res, next) {
  try {
    const messageId = req.params.messageId
    const messageData = await messageModel.getMessageById(messageId)

    if (messageData.message_to === res.locals.accountData.account_id) {
      const nav = await utilities.getNav()
      res.render("message/message-view", {
        title: "Message: " + messageData.message_subject,
        nav,
        errors: null,
        messageData,
      })
    } else {
      req.flash("notice", "You aren't authorized to view that message.")
      res.redirect("/message")
    }
  } catch (error) {
    next(error)
  }
}

/* ****************************************
 *  Build compose view get
 * ************************************ */
async function buildCompose(req, res, next) {
  try {
    const nav = await utilities.getNav()
    const recipientData = await accountModel.getAccountList()
    let title = "Compose"
    let recipientList = ""

    if (req.params.messageId) {
      // Reply path
      const replyTo = await messageModel.getMessageById(req.params.messageId);
      title = `Reply to ${replyTo.account_firstname} ${replyTo.account_lastname}`
      res.locals.Subject = "Re: " + replyTo.message_subject + " "
      res.locals.Body = `\n\n\nOn ${replyTo.message_created.toLocaleString()} from ${replyTo.account_firstname} ${replyTo.account_lastname}:\n${replyTo.message_body}`
      recipientList = utilities.buildRecipientList(recipientData, replyTo.message_from)
    } else {
      // Compose new path
      recipientList = utilities.buildRecipientList(recipientData)
    }

    res.render("message/compose", {
      title,
      nav,
      errors: null,
      recipientList,
    });
  } catch (error) {
    next(error);
  }
}

/* ****************************************
 *  Process send message post
 * ************************************ */
async function sendMessage(req, res, next) {
  try {
    await messageModel.sendMessage({
      message_from: res.locals.accountData.account_id,
      message_to: req.body.message_to,
      message_subject: req.body.message_subject,
      message_body: req.body.message_body,
    });
    res.redirect("/message")
  } catch (error) {
    next(error)
  }
}

/* ****************************************
 *  Deliver delete confirmation view get
 * ************************************ */
async function buildDelete(req, res, next) {
  try {
    const nav = await utilities.getNav()
    const messageData = await messageModel.getMessageById(req.params.messageId)

    res.render("message/delete", {
      title: "Confirm Deletion",
      nav,
      errors: null,
      messageData,
    })
  } catch (error) {
    next(error)
  }
}

/* ****************************************
 *  Process delete post
 * ************************************ */
async function deleteMessage(req, res, next) {
  try {
    await messageModel.deleteMessage(req.body.message_id)
    req.flash("notice", "Message deleted");
    res.redirect("/message")
  } catch (error) {
    next(error)
  }
}

/* ****************************************
 *  Process toggle read post
 * ************************************ */
async function toggleRead(req, res, next) {
  try {
    const message_read = await messageModel.toggleRead(req.params.messageId); // Returns the new value of message_read
    return res.json(message_read)
  } catch (error) {
    next(error)
  }
}

/* ****************************************
 *  Toggle a message's archived flag
 * ************************************ */
async function toggleArchived(req, res, next) {
  try {
    const message_archived = await messageModel.toggleArchived(req.params.messageId); // Returns the new value of message_archived
    return res.json(message_archived)
  } catch (error) {
    next(error)
  }
}

module.exports = {
  buildInbox,
  buildMessageView,
  buildCompose,
  sendMessage,
  buildArchive,
  buildDelete,
  deleteMessage,
  toggleRead,
  toggleArchived,
}