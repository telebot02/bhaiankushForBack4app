const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const axios = require("axios");
const http = require("http");
const https = require("https"); 

const apiId = 23563414;
const apiHash = "b0d6b98b363839b22acb1fd056ab2a07";
const sessionKey = "1BQANOTEuMTA4LjU2LjE2MgG7Avu8Srkuxhm7TZVSbKAqO9EOO5MS8kuEOZiHPNco8bWX2o5iyT1NizsvwH6429qO4fEALIlaQobcGXIJXGctL3KnlpJQwRkcWQl81Ric6lhFoDnFDsWCqfsLpBfyFr8opOHneOsAoWr28LumIf9SfkpK+ZdTEDwKqk4/Di89N5Och5Kt+hErSX7L8lN3M8ZkK/y18loAk1CCB2nkGv7U6TBSCY39d32rPkJYXzXrhyR5oMWFgP8Ty03LYq5Y2zbK7LiCYFz7CLtfJM7DN6K3QFtnYid8ekHI7uEVrgs+G17ghu2J80VvYXoMX8K3EQtyIxTNrdmVCPPGPwmDzMKWVQ==";

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


const startBot = async () => {
    await client.connect();
    
    let lastMessageIds = { "@colorwiz_bonus": null, "@testinggroupbonustaken": null };

    while (true) {
        try {
            // Check messages from both channels
            for (const channel of ["@colorwiz_bonus", "@testinggroupbonustaken"]) {
                const messages = await client.getMessages(channel, { limit: 1 });

                if (messages.length > 0) {
                    const latestMessage = messages[0];

                    if (lastMessageIds[channel] === null || latestMessage.id > lastMessageIds[channel]) {
                        lastMessageIds[channel] = latestMessage.id;

                        const redeemCode = extractRedeemCode(latestMessage.message);

                        if (redeemCode) {
                            try {
                                const data = await sendRedeemRequest("+917015957516", redeemCode);
                                await handleRedeemResponse(client, data, "Ankush");
                            } catch (error) {
                                console.error(`Error handling redeem response: ${error.message}`);
                            }
                        }
                    }
                }
            }

            await delay(1000); // Adjust the delay as needed

        } catch (err) {
            console.error("Error fetching messages: ", err);
            // Handle errors or rate limit here
            await delay(5000); // Backoff strategy
        }
    }
};

const createHealthCheckServer = () => {
  http.createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("OK");
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
    }
  }).listen(8080, () => {
    console.log("Health check server is running on port 8080");
  });
};

// Self-ping to prevent app from sleeping
const keepAppAwake = () => {
  setInterval(() => {
    https.get("https://telebotankush6-gmjkpy5h.b4a.run/health", (res) => { // Changed from http to https
      console.log("Self-ping: ", res.statusCode);
    }).on("error", (err) => {
      console.error("Error in self-ping: ", err.message);
    });
  }, 10 * 60 * 1000); // Ping every 10 minutes
};

const init = async () => {
  createHealthCheckServer();
  keepAppAwake();
  await startBot();
};

init();

// const { TelegramClient } = require("telegram");
// const { StringSession } = require("telegram/sessions");
// const axios = require("axios");
// const http = require("http"); // Add HTTP for health check

// const apiId = 28596369;
// const apiHash = "f50cfe3b10da015b2c2aa0ad31414a55";
// const sessionKey = "1BQANOTEuMTA4LjU2LjE2MgG7Er6KEIrdNBy/2isic6Mp37b6Ijeopge0hE2lJJKMcrsoUUkYWPQCHOAeJvgpxUfKd3akRvQaz5HVNWaR5xdqpPkwrsEGMtaqZH9dij4f6lbXV/aCgkH34nBxykXZYfUhAQDH1lJ5/TMuNkgT6lS0V3nzURMR7nQxb5HZ5DjzWlUC/k8h/4askKGf+qGC85krCfqCtXlJt2plV3qKad5f6pJISIc7fyBNsphzZsknJFvTzDbOwOtjKIqRX+q0+V4fDrWZm5nIEmmK4yECMX2FSIzf4z8ug+xmuIYaFnFrw3cUrm1MxCOPgwYEkCk+v/8/3n4TapLEgBojPZa0Rz49Cw=="
// const stringSession = new StringSession(sessionKey);

// const apiUrl = "https://colorwiz.cyou/mana/receive_red_packet";
// const client = new TelegramClient(stringSession, apiId, apiHash, {});

// const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// const sendRedeemRequest = async (mobile, packetCode) => {
//   try {
//     const response = await axios.post(apiUrl, { mobile, packet_code: packetCode }, {
//       headers: { "Content-Type": "application/json", "Connection": "keep-alive" },
//       timeout: 30000, 
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
//   await client.connect();
//   let lastMessageId = null;

//   while (true) {
//     try {
//       const messages = await client.getMessages("@colorwiz_bonus", { limit: 1 });
//       if (messages.length > 0) {
//         const latestMessage = messages[0];
//         if (lastMessageId === null || latestMessage.id > lastMessageId) {
//           lastMessageId = latestMessage.id;
//           const redeemCode = extractRedeemCode(latestMessage.message);
//           if (redeemCode) {
//             try {
//               const data = await sendRedeemRequest("+917015957516", redeemCode);
//               await handleRedeemResponse(client, data, "Ankush");
//             } catch (error) {
//               console.error(`Error handling redeem response: ${error.message}`);
//             }
//           }
//         }
//       }
//       await delay(900); 
//     } catch (err) {
//       console.error("Error fetching messages: ", err);
//       await delay(5000); 
//     }
//   }
// })();

// // Minimal HTTP server for health checks
// const server = http.createServer((req, res) => {
//   if (req.url === "/health") {
//     res.writeHead(200, { "Content-Type": "text/plain" });
//     res.end("OK");
//   } else {
//     res.writeHead(404, { "Content-Type": "text/plain" });
//     res.end("Not Found");
//   }
// });

// server.listen(8080, () => {
//   console.log("Health check server is running on port 8080");
// });

// // Self-ping logic to prevent sleep
// const keepAppAwake = () => {
//   setInterval(async () => {
//     try {
//       http.get("http://telebotankush3-75ynqnx9.b4a.run/health", (res) => {
//         console.log("Self-ping: ", res.statusCode);
//       }).on("error", (err) => {
//         console.error("Error in self-ping: ", err.message);  // Improved error handling
//       });
//     } catch (err) {
//       console.error("Caught error during self-ping: ", err);
//     }
//   }, 25 * 60 * 1000); // Every 25 minutes
// };

// keepAppAwake();


