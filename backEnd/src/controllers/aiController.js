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

/**
 * POST /api/ai/analyze-image
 * Body: { imageBase64: "data:image/png;base64,..." }
 * Returns: { productName: "...", specs: "...", description: "..." }
 *
 * Uses Groq vision model to identify the product from the image
 * and generate a complete spec sheet automatically.
 */
exports.analyzeProductImage = async (req, res) => {
  const { imageBase64 } = req.body;

  if (!imageBase64 || !imageBase64.startsWith('data:image/')) {
    return res.status(400).json({ message: 'A valid base64 image is required.' });
  }

  const baiApiKey = process.env.BAI_API_KEY || process.env.GLM_API_KEY || 'sk-1emdv6jjrvz7il7q0xj40ofsgt4uwmxx';
  const nvidiaApiKey = process.env.NVIDIA_API_KEY;

  if (!baiApiKey && !nvidiaApiKey) {
    return res.status(500).json({ message: 'No AI Vision API key is configured.' });
  }

  const visionPrompt = `You are an expert electronics product analyst with deep knowledge of smartphones, tablets, wearables, and accessories.

Look at this product image carefully and:
1. Identify the exact device model (brand, model name, variant if visible)
2. Identify the device category (one of: phone, feature-phone, tablet, watch, headphones, charger, cable, case, screen-protector)
3. Generate a comprehensive technical spec sheet

Return your response in this EXACT plain text format with no markdown, no asterisks, no headers:

PRODUCT_NAME: <exact identified model name, e.g. "Samsung Galaxy S24 Ultra">
CATEGORY: <category code>
---SPECS---
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
---DESCRIPTION---
<one concise paragraph suitable for a shop product listing>

If you cannot identify the exact model, make your best estimate based on visible design elements. Never leave a field blank — use "N/A" if truly unknown.`;

  try {
    let rawText = '';

    // 1. Try B.AI Vision models (glm-5.3-flash, deepseek-v4-flash-vision-exp)
    if (baiApiKey) {
      const baiModels = ['glm-5.3-flash', 'deepseek-v4-flash-vision-exp'];
      for (const model of baiModels) {
        if (rawText) break;
        try {
          const response = await fetch('https://api.b.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${baiApiKey.trim()}`
            },
            body: JSON.stringify({
              model,
              messages: [
                {
                  role: 'user',
                  content: [
                    { type: 'text', text: visionPrompt },
                    { type: 'image_url', image_url: { url: imageBase64 } }
                  ]
                }
              ],
              temperature: 0.2,
              max_tokens: 1500
            }),
            signal: AbortSignal.timeout(30000)
          });

          if (response.ok) {
            const data = await response.json();
            const content = (data.choices?.[0]?.message?.content || '').trim();
            if (content && content.length > 20) {
              rawText = content;
              break;
            }
          } else {
            console.warn(`[B.AI Vision Error - ${model}]`, response.status, (await response.text()).slice(0, 150));
          }
        } catch (baiErr) {
          console.warn(`[B.AI Vision Exception - ${model}]`, baiErr.message);
        }
      }
    }

    // 2. Fallback to NVIDIA Vision API if B.AI returned nothing
    if (!rawText && nvidiaApiKey) {
      try {
        const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${nvidiaApiKey.trim()}`
          },
          body: JSON.stringify({
            model: 'meta/llama-3.2-90b-vision-instruct',
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: visionPrompt },
                  { type: 'image_url', image_url: { url: imageBase64 } }
                ]
              }
            ],
            temperature: 0.2,
            max_tokens: 1024
          }),
          signal: AbortSignal.timeout(20000)
        });

        if (response.ok) {
          const data = await response.json();
          rawText = (data.choices?.[0]?.message?.content || '').trim();
        }
      } catch (nvErr) {
        console.warn('[NVIDIA Vision Exception]', nvErr.message);
      }
    }

    if (!rawText) {
      throw new Error('Could not analyze the image. Please verify your API key or try another photo.');
    }

    // Strip any markdown tags or thinking tokens
    rawText = rawText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    // Parse PRODUCT_NAME
    const nameMatch = rawText.match(/PRODUCT_NAME:\s*(.+)/i);
    const productName = nameMatch ? nameMatch[1].trim() : '';

    // Parse CATEGORY
    const catMatch = rawText.match(/CATEGORY:\s*(.+)/i);
    let category = catMatch ? catMatch[1].trim().toLowerCase() : 'phone';
    const validCategories = ['phone', 'feature-phone', 'tablet', 'watch', 'headphones', 'charger', 'cable', 'case', 'screen-protector'];
    if (!validCategories.includes(category)) {
      category = 'phone';
    }

    // Parse specs block
    const specsPart = rawText.split('---SPECS---')[1] || '';
    let specsRaw = (specsPart.split('---DESCRIPTION---')[0] || '').trim();

    // Filter out auto-generated RAM/Storage lines and prepend blank RAM & Storage keys for user entry
    specsRaw = specsRaw
      .split('\n')
      .filter((line) => {
        const lower = line.toLowerCase().trim();
        return !lower.startsWith('ram:') && !lower.startsWith('storage:') && !lower.startsWith('category:');
      })
      .join('\n');

    specsRaw = `RAM: \nStorage: \n${specsRaw}`;

    // Parse description block
    const descPart = rawText.split('---DESCRIPTION---')[1] || '';
    const description = descPart.trim();

    res.status(200).json({ productName, category, specs: specsRaw, description });
  } catch (err) {
    console.error('[AI Vision Error]', err.message);
    res.status(500).json({ message: err.message || 'Failed to analyze image.', error: err.message });
  }
};

