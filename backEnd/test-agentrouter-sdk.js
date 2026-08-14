const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: 'sk-7AgwiBt7vssWpdq920Jkbt5RKkTjq0VARgch2Z9Xmg3TeQLd',
  baseURL: 'https://agentrouter.org/v1',
});

async function testAgentRouter() {
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-5.5',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: 'What is this image?' },
          { type: 'image_url', image_url: { url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=' } }
        ]
      }]
    });
    console.log("Status gpt-5.5: 200 OK");
    console.log("Response:", response.choices[0].message.content);
  } catch (err) {
    console.error("Error:", err.status, err.message);
  }
}

testAgentRouter();
