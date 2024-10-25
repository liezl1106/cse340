const pool = require("../database/");

/* ****************************************
 *  Get messages sent to account ID
 * ************************************ */
async function getMessagesToId(accountId, archived = false) {
  const query = `
    SELECT message_id, message_subject, message_body, message_created, 
           message_to, message_from, message_read, message_archived,
           account_firstname, account_lastname
    FROM public.messages
    JOIN public.account ON public.messages.message_from = public.account.account_id
    WHERE message_to = $1 AND message_archived = $2
    ORDER BY message_created DESC`

  try {
    const result = await pool.query(query, [accountId, archived])
    return result.rows
  } catch (error) {
    console.error("Failed to get messages:", error.message)
    throw error
  }
}

/* ****************************************
 *  Get a message by ID
 * ************************************ */
async function getMessageById(messageId) {
  const query = `
    SELECT message_id, message_subject, message_body, 
           message_created, message_to, message_from, 
           message_read, message_archived
    FROM public.messages
    WHERE message_id = $1`

  try {
    const result = await pool.query(query, [messageId])
    return result.rows[0]
  } catch (error) {
    console.error("Failed to get message by ID:", error.message)
    throw error
  }
}

/* ****************************************
 *  Send a message
 * ************************************ */
async function sendMessage({ message_subject, message_body, message_to, message_from }) {
  const query = `INSERT INTO public.messages (message_subject, message_body, message_to, message_from)
                 VALUES ($1, $2, $3, $4)`;

  try {
    await pool.query(query, [message_subject, message_body, message_to, message_from])
    return true // Indicate success
  } catch (error) {
    console.error("Failed to send message", error)
    throw error; // Propagate the error
  }
}

/* ****************************************
 *  Count messages for an account
 * ************************************ */
async function getMessageCountById(accountId, archived = false) {
  const query = `SELECT COUNT(*) FROM public.messages
                 WHERE message_to = $1 AND message_archived = $2`

  try {
    const result = await pool.query(query, [accountId, archived])
    return parseInt(result.rows[0].count, 10)
  } catch (error) {
    console.error("Failed to count messages", error)
    throw error;
  }
}

/* ****************************************
 *  Toggle a message's read status
 * ************************************ */
async function toggleRead(messageId) {
  const query = `UPDATE public.messages SET message_read = NOT message_read 
                 WHERE message_id = $1 RETURNING message_read`

  try {
    const result = await pool.query(query, [messageId])
    return result.rows[0].message_read;
  } catch (error) {
    console.error("Failed to toggle read status", error)
    throw error;
  }
}

/* ****************************************
 *  Toggle a message's archived status
 * ************************************ */
async function toggleArchived(messageId) {
  const query = `UPDATE public.messages SET message_archived = NOT message_archived 
                 WHERE message_id = $1 RETURNING message_archived`

  try {
    const result = await pool.query(query, [messageId])
    return result.rows[0].message_archived
  } catch (error) {
    console.error("Failed to toggle archived status", error)
    throw error
  }
}

/* ****************************************
 *  Delete a message
 * ************************************ */
async function deleteMessage(messageId) {
  const query = `DELETE FROM public.messages WHERE message_id = $1`

  try {
    await pool.query(query, [messageId])
  } catch (error) {
    console.error("Failed to delete message", error)
    throw error
  }
}

module.exports = {
  getMessagesToId,
  getMessageById,
  sendMessage,
  getMessageCountById,
  toggleRead,
  toggleArchived,
  deleteMessage,
}