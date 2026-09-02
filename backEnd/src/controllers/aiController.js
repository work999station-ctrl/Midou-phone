/**
 * POST /api/ai/specs
 * Body: { productName: "Poco X3 Pro 8/256" }
 * Returns: { specs: "...", description: "..." }
 *
 * Powered by Google Gemini API / Groq LLM API
 */
exports.generateSpecs = async (req, res) => {
  const { productName, apiKey: userProvidedApiKey } = req.body;

  if (!productName || productName.trim().length < 2) {
    return res.status(400).json({ message: 'Product name is required.' });
  }

  const geminiApiKey = userProvidedApiKey || process.env.GEMINI_API_KEY;
  const groqApiKey = process.env.GROQ_API_KEY;

  const prompt = `You are a professional electronics tech spec writer.
Given the device name: "${productName.trim()}", generate a comprehensive, accurate technical spec sheet based on your knowledge.

Return ONLY a plain text block with specs in this EXACT format (key: value, one per line):
Display Type: <value>
Display Size: <value>
Display Resolution: <value>
Display Protection: <value>
OS: <value>
Chipset: <value>
CPU: <value>
GPU: <value>
Main Camera: <value>
Camera Features: <value>
Selfie Camera: <value>
Battery Capacity: <value>
Charging: <value>
NFC: <value>
USB: <value>
Bluetooth: <value>
Wi-Fi: <value>
SIM: <value>
Colors: <value>
Dimensions: <value>
Weight: <value>

Do NOT include RAM or Storage lines as they will be specified manually by the user.

Then on a new line write exactly this separator: ---DESCRIPTION---
Then write a single concise paragraph product description suitable for a shop listing.

Do not include any markdown, headers, asterisks, or extra formatting. Only the plain text spec list and description.`;

  try {
    let responseText = '';

    // 1. Try Gemini API if key is available
    if (geminiApiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey.trim()}`;
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } else {
          console.warn('[Gemini API warning]', await response.text());
        }
      } catch (geminiErr) {
        console.warn('[Gemini API error, falling back to Groq]', geminiErr.message);
      }
    }

    // 2. Fallback to Groq API if Gemini produced no text
    if (!responseText && groqApiKey) {
      const groqModels = [
        'openai/gpt-oss-20b',
        'openai/gpt-oss-120b',
        'qwen/qwen3.6-27b',
        'llama-3.3-70b-versatile',
        'llama-3.1-8b-instant'
      ];

      for (const model of groqModels) {
        try {
          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${groqApiKey.trim()}`
            },
            body: JSON.stringify({
              model,
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.2
            })
          });

          if (response.ok) {
            const data = await response.json();
            let content = data.choices?.[0]?.message?.content || '';
            content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
            if (content.length > 20) {
              responseText = content;
              break;
            }
          } else {
            console.warn(`[Groq ${model} status ${response.status}]`, (await response.text()).slice(0, 150));
          }
        } catch (groqErr) {
          console.warn(`[Groq ${model} error]`, groqErr.message);
        }
      }
    }

    if (!responseText) {
      throw new Error('No AI provider available or valid response returned. Check your API key in .env file.');
    }

    // Split on separator
    const parts = responseText.trim().split('---DESCRIPTION---');
    let specsRaw = (parts[0] || '').trim();
    const description = (parts[1] || '').trim();

    // Filter out any auto-generated RAM/Storage values and prepend blank RAM: & Storage: keys at top
    specsRaw = specsRaw
      .split('\n')
      .filter((line) => {
        const lower = line.toLowerCase().trim();
        return !lower.startsWith('ram:') && !lower.startsWith('storage:');
      })
      .join('\n');

    // Place RAM: and Storage: keys at the top so user can fill them
    specsRaw = `RAM: \nStorage: \n${specsRaw}`;

    res.status(200).json({ specs: specsRaw, description });
  } catch (err) {
    console.error('[AI Specs Error]', err.message);
    res.status(500).json({ message: err.message || 'Failed to generate specs.' });
  }
};

