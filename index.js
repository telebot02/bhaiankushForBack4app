const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
// const { NewMessage } = require("telegram/events");
const axios = require("axios");

// const testingChatId = "1493065360";
// const bonusChatId = "2247051543";
const apiId = 28596369;
const apiHash = "f50cfe3b10da015b2c2aa0ad31414a55";
const sessionKey = "1BQANOTEuMTA4LjU2LjE2MgG7eG+86rffrbVQla8pLlpfjwu1Jh9JKRpdGlYPcrlC+HJlt8QWnp/BTE/bl9sfMpGJ/nqjyrZsChWyRj8nf1kGxDsvmhNU0LCXhZaZiU4yM/EZ5EfBYASEo6F6m1FmixA6ZJPagbO2GScVhI7SLkZWr6RkBwzlTaL6+8SbbwYHcZF5+S+nGt8HFH+vSjNVx4hJh0E9cuuvS5H+lV7zwnQqV8kkDe6Pz62z+MfM0yAfBxfimmE7S/m+1N+R9DupN5WhUBGo4SjJwVE3K4eNC4SpaLnNimnVUhv5avGRL6Xg+lhl+DDzRs6wFt6PPzM4cBB/25d3Z/ucPGc7dvKT1546DQ==";
const stringSession = new StringSession(sessionKey);

const apiUrl = "https://colorwiz.cyou/mana/receive_red_packet";

const session = new StringSession(sessionKey); 
const client = new TelegramClient(session, apiId, apiHash, {});



const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const sendRedeemRequest = async (mobile, packetCode) => {
    // console.log("inside send")
  try {
    const response = await axios.post(apiUrl, { mobile, packet_code: packetCode }, {
      headers: { 
        "Content-Type": "application/json",
        "Connection": "keep-alive"
      },
      timeout: 30000, // Set a timeout to ensure requests don't hang indefinitely
    });
    // console.log(response.data)
    return response.data;
  } catch (error) {
    console.error(`Error sending POST request: ${error.message}`);
  }
};

const handleRedeemResponse = async (client, data, username) => {
  let responseMessage;
  if (data.msg) {
    responseMessage = `Not your luck ${username}: ${data.msg}`;
  } else if (data.price) {
    responseMessage = `Hurry ${username} WON: ${data.price}`;
  } else {
    responseMessage = "Response not received properly";
  }
  console.log(responseMessage);
  await client.sendMessage("me", { message: responseMessage });
};

const extractRedeemCode = (text) => {
  const codeMatch = text.match(/gift\?c=([A-Za-z0-9]{24})/);
  return codeMatch ? codeMatch[1] : null;
};

(async () => {
  await client.connect();
  
  let lastMessageId = null; // Initialize to track the latest message ID

  while (true) {
      try {
          // Fetch the latest message from the channel
          const messages = await client.getMessages("@colorwiz_bonus", { limit: 1 });

          if (messages.length > 0) {
              const latestMessage = messages[0];

              if (lastMessageId === null || latestMessage.id > lastMessageId) {
                  lastMessageId = latestMessage.id;

                  const redeemCode = extractRedeemCode(latestMessage.message);

                  if (redeemCode) {
                      // console.log(redeemCode)
                      try {
                      const data = await sendRedeemRequest("+917015957516", redeemCode);
                      await handleRedeemResponse(client, data, "Ankush");
                      } catch (error) {
                      console.error(`Error handling redeem response: ${error.message}`);
                      }
                  }
              }
          }
          await delay(900); 
      } catch (err) {
          console.error("Error fetching messages: ", err);
          // Handle errors or rate limit here
          await delay(5000); // Backoff strategy
      }
  }
})();





// const sendRedeemRequest = async (mobile, packetCode) => {
//   try {
//     const response = await axios.post(apiUrl, { mobile, packet_code: packetCode }, {
//       headers: { 
//         "Content-Type": "application/json",
//         "Connection": "keep-alive"
//       },
//       timeout: 30000, // Set a timeout to ensure requests don't hang indefinitely
//     });
//     return response.data;
//   } catch (error) {
//     console.error(`Error sending POST request: ${error.message}`);
//   }
// };

// const handleRedeemResponse = async (client, data, username) => {
//   let responseMessage;
//   if (data.msg) {
//     responseMessage = `Not your luck ${username}: ${data.msg}`;
//   } else if (data.price) {
//     responseMessage = `Hurry ${username} WON: ${data.price}`;
//   } else {
//     responseMessage = "Response not received properly";
//   }
//   console.log(responseMessage);
//   await client.sendMessage("me", { message: responseMessage });
// };

// const extractRedeemCode = (text) => {
//   const codeMatch = text.match(/gift\?c=([A-Za-z0-9]{24})/);
//   return codeMatch ? codeMatch[1] : null;
// };

// (async () => {
//   console.log("Starting bot...");
//   const client = new TelegramClient(stringSession, apiId, apiHash, {
//     connectionRetries: Infinity,
//     useWSS: true,
//     autoReconnect: true,
//     retryDelay: 1000,
//   });

//   await client.start();
//   console.log(`Listening for messages in channels: ${testingChatId}, ${bonusChatId}`);

//   client.addEventHandler(async (event) => {
//     const message = event.message;
//     const channelId = message.peerId.channelId.toString();

//     if (message && (channelId === testingChatId || channelId === bonusChatId)) {
//       const redeemCode = extractRedeemCode(message.message);

//       if (redeemCode) {
//         try {
//           const data = await sendRedeemRequest("+917015957516", redeemCode);
//           await handleRedeemResponse(client, data, "Ankush");
//         } catch (error) {
//           console.error(`Error handling redeem response: ${error.message}`);
//         }
//       }
//     }
//   }, new NewMessage({}));

//   console.log("Bot running...");
// })();