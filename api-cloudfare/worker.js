/**
 * Combined API handler for transcribe, vision, and refine endpoints
 */

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });
    }

    // Route requests based on URL path
    const url = new URL(request.url);
    const path = url.pathname.split('/').pop();

    try {
      if (path === 'transcribe') {
        return await handleTranscribe(request, env);
      } else if (path === 'vision') {
        return await handleVision(request, env);
      } else if (path === 'refine') {
        return await handleRefine(request, env);
      } else {
        return new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: corsHeaders()
        });
      }
    } catch (error) {
      console.error(`API Error (${path}):`, error);
      return new Response(
        JSON.stringify({ error: `Failed to process ${path} request`, details: error.message }),
        { status: 500, headers: corsHeaders() }
      );
    }
  }
};

// Handle speech-to-text requests
async function handleTranscribe(request, env) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders()
    });
  }

  try {
    // Check for Deepgram API key
    const apiKey = env.DEEPGRAM_API_KEY
    if (!apiKey) {
      console.error('Deepgram API key is not set');
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Deepgram API key is missing' }),
        { status: 500, headers: corsHeaders() }
      );
    }

    // Get the audio data from the request
    const audioData = await request.arrayBuffer();

    if (!audioData || audioData.byteLength === 0) {
      console.error('Missing audio data in request');
      return new Response(
        JSON.stringify({ error: 'Missing audio data' }),
        { status: 400, headers: corsHeaders() }
      );
    }

    console.log(`Processing audio: ${audioData.byteLength} bytes`);

    // Call Deepgram API
    const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-3&language=en-US&smart_format=true&punctuate=true', {
      method: 'POST',
      headers: {
        'Content-Type': 'audio/wav',
        'Authorization': `Token ${apiKey}`
      },
      body: audioData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Deepgram API error (${response.status}):`, errorText);
      return new Response(
        JSON.stringify({ error: `Speech recognition failed: ${response.status}` }),
        { status: 500, headers: corsHeaders() }
      );
    }

    const data = await response.json();
    console.log('Deepgram response received');

    // Extract the transcript
    let transcript = '';

    // Check for results in the response
    if (data.results?.channels && data.results.channels.length > 0) {
      const alternatives = data.results.channels[0].alternatives;
      if (alternatives && alternatives.length > 0) {
        transcript = alternatives[0].transcript || '';
      }
    }

    if (!transcript || transcript.trim() === '') {
      console.warn('No transcript found in Deepgram response');
      return new Response(
        JSON.stringify({ error: 'No speech detected or recognized' }),
        { status: 400, headers: corsHeaders() }
      );
    }

    console.log('Transcript:', transcript);
    return new Response(JSON.stringify({ transcript }), {
      headers: corsHeaders()
    });
  } catch (error) {
    console.error('Error with speech-to-text:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process speech' }),
      { status: 500, headers: corsHeaders() }
    );
  }
}

// Handle vision API requests
async function handleVision(request, env) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders()
    });
  }

  try {
    const body = await request.json();
    const { image, query } = body;

    if (!image || !query) {
      return new Response(
        JSON.stringify({ error: 'Missing image or query' }),
        { status: 400, headers: corsHeaders() }
      );
    }

    console.log(`Processing image: ${image.length} bytes`);

    // Validate image data
    if (image.length < 1000) {
      return new Response(
        JSON.stringify({ error: 'Invalid image data (too small)' }),
        { status: 400, headers: corsHeaders() }
      );
    }

    // Prepare prompt with better instructions
    const enhancedQuery = `Analyze this image and describe what you see in detail. 
The user asked: "${query}"
Focus on main objects, people, text, and spatial relationships. 
Be factual and precise. Describe colors, shapes, and positions accurately.`;

    // OpenAI client configuration for Nebius Studio
    const response = await fetch('https://api.studio.nebius.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.NEBIUS_API_KEY || ''}`,
      },
      body: JSON.stringify({
        model: "llava-hf/llava-1.5-7b-hf",
        temperature: 0,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: enhancedQuery },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${image}`
                }
              }
            ]
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Vision API error (${response.status}):`, errorText);
      return new Response(
        JSON.stringify({ error: `Vision processing failed: ${response.status}`, details: errorText }),
        { status: response.status, headers: corsHeaders() }
      );
    }

    const data = await response.json();

    // Extract the response text
    const result = data.choices[0]?.message?.content || "Could not analyze the image.";
    console.log('LLaVA result:', result.substring(0, 100) + '...');

    return new Response(JSON.stringify({ result }), {
      headers: corsHeaders()
    });
  } catch (error) {
    console.error('Error processing image:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process image', details: error.message }),
      { status: 500, headers: corsHeaders() }
    );
  }
}

// Handle refine API requests
async function handleRefine(request, env) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders()
    });
  }

  try {
    const body = await request.json();
    const { llavaResponse, originalQuery, queryType = "general" } = body;

    let prompt = '';

    // If we have a LLaVA response, it's a vision query
    if (llavaResponse && llavaResponse.trim() !== '') {
      // Check for specific vision query contexts
      const lowerQuery = originalQuery.toLowerCase();

      if (lowerQuery.includes('holding') || lowerQuery.includes('hand')) {
        prompt = `Original user query: "${originalQuery}"
Raw image analysis: "${llavaResponse}"

The user is asking about an object they're holding. Focus on:
1. Identifying the object clearly and concisely
2. Mentioning key details about color, size, and distinctive features
3. Being very brief (30 words or less)
4. Using a friendly, conversational tone
5. Being direct and helpful`;
      } else if (lowerQuery.includes('read') || lowerQuery.includes('say') || lowerQuery.includes('text')) {
        prompt = `Original user query: "${originalQuery}"
Raw image analysis: "${llavaResponse}"

The user wants you to read text in the image. Focus on:
1. Sharing exactly what text is visible, clearly and accurately
2. Being direct and to the point
3. Organizing text logically if there are multiple sections
4. Using a friendly, conversational tone
5. Only mention text you're confident about`;
      } else {
        prompt = `Original user query: "${originalQuery}"
Raw image analysis: "${llavaResponse}"

Instructions for your response:
1. Be concise and focused - keep your response under 40 words
2. Use a friendly, conversational tone as if you're a helpful friend
3. Highlight the most relevant details from the image analysis
4. Mention potential hazards or important spatial information if present
5. Answer the user's question directly and clearly
6. Don't mention visual impairment, blindness, or that you're describing an image`;
      }
    } else {
      // For non-vision queries, handle different query types
      switch (queryType) {
        case "assistant_info":
          prompt = `The user asked: "${originalQuery}"
          
Provide a brief introduction about the SeeForMe assistant. Explain that you're a visual assistant that can describe what's around them, identify objects, read text, and help navigate spaces. Keep it friendly, brief (under 40 words), and conversational.`;
          break;

        case "usage_help":
          prompt = `The user asked: "${originalQuery}"
          
Provide a simple instruction on how to use the app. Tell them to press the Listen button and then speak their question about what they want to know about their surroundings. Keep it friendly, brief (under 40 words), and straightforward.`;
          break;

        case "gratitude":
          prompt = `The user said: "${originalQuery}"
          
Respond warmly to their thanks with a brief, friendly acknowledgment. Offer to continue helping if needed. Keep it under 20 words and conversational.`;
          break;

        case "greeting":
          prompt = `The user said: "${originalQuery}"
          
Respond with a warm, brief greeting. Mention you're their visual assistant and ready to help describe what's around them. Keep it under 20 words and friendly.`;
          break;

        default:
          prompt = `The user asked: "${originalQuery}"

Please respond to this query:
1. Be brief and direct - keep your response under 30 words
2. Use a friendly, conversational tone
3. If they're asking about visual information, gently suggest they ask what you can see or what's in front of them
4. Be helpful and positive`;
          break;
      }
    }

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY || ''}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ],
        generation_config: {
          temperature: 0.2,
          max_output_tokens: 150,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API error (${response.status}):`, errorText);
      return new Response(
        JSON.stringify({ error: `Refinement failed: ${response.status}` }),
        { status: response.status, headers: corsHeaders() }
      );
    }

    const data = await response.json();
    const refinedResponse = data.candidates[0]?.content?.parts[0]?.text || "Could not refine response.";
    console.log('Refined response:', refinedResponse);

    return new Response(JSON.stringify({ result: refinedResponse }), {
      headers: corsHeaders()
    });
  } catch (error) {
    console.error('Error refining response:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to refine response',
        details: error.message
      }),
      { status: 500, headers: corsHeaders() }
    );
  }
}

// CORS headers helper function
function corsHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}