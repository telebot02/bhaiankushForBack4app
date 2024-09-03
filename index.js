const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const axios = require("axios");
const http = require("http"); // Add HTTP for health check

const apiId = 28596369;
const apiHash = "f50cfe3b10da015b2c2aa0ad31414a55";
const sessionKey = "1BQANOTEuMTA4LjU2LjE2MgG7C9kUIMEb3dYbI75rlRg8fhlo7UU5/IrT8q+Igxoq2YHGsHp7Slbu9VLLzCLEABCJWqkd6EODXCHStrIgMFcNf7BULHMBtFmOLk+/rZTgPVP2czo2rVlKPsT72GUtaa0L+lOmkQlMgptd6r5yaelGkzFKp+hIXJMywojYeUhKrtcZAwy2P5XS7QUOlQ/CQSI1PN0SvwdPRk5NmTUtz6wcAV3OgkkVkmd1FmlOCGYYbr3jctxtINuauC27ep/hoThzCfQghwBX13liKmV5C90k02teK2q6rFQEr7nNgDiI9ws5dMYv3/jI5Ou08EYYi69angfTGXJO5hLqMAPTkVM80Q=="
const stringSession = new StringSession(sessionKey);

const apiUrl = "https://colorwiz.cyou/mana/receive_red_packet";
const client = new TelegramClient(stringSession, apiId, apiHash, {});

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const sendRedeemRequest = async (mobile, packetCode) => {
  try {
    const response = await axios.post(apiUrl, { mobile, packet_code: packetCode }, {
      headers: { "Content-Type": "application/json", "Connection": "keep-alive" },
      timeout: 30000, 
    });
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
  let lastMessageId = null;

  while (true) {
    try {
      const messages = await client.getMessages("@colorwiz_bonus", { limit: 1 });
      if (messages.length > 0) {
        const latestMessage = messages[0];
        if (lastMessageId === null || latestMessage.id > lastMessageId) {
          lastMessageId = latestMessage.id;
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
      await delay(900); 
    } catch (err) {
      console.error("Error fetching messages: ", err);
      await delay(5000); 
    }
  }
})();

// Minimal HTTP server for health checks
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is running');
});

server.listen(8080, () => {
  console.log('Health check server running on port 8080');
});
