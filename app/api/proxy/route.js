export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(req) {
  try {
    const { query, id } = await req.json();

    const chatId = id || `chat-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const url = `https://my-morphic-alpha.vercel.app/api/chat`;

    // ✅ Define messages with system prompt
    const messages = [
      {
        role: 'system',
        content: `You are a direct, informative AI assistant. 
Your job is to immediately and confidently explain or expand on the user's query — even if it's just one word — without asking follow-up questions. 
If the word is a topic, provide a clear, concise, and insightful explanation. Be helpful and proactive. 
Do not ever reply with requests for clarification or say the query is too broad.`,
      },
      {
        role: 'user',
        content: query
      }
    ];

    console.log('📤 Sending messages to upstream AI:', messages); // ✅ Log the payload

    const upstreamResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        id: chatId,
      }),
    });

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: {
        ...corsHeaders,
        'Content-Type': upstreamResponse.headers.get('Content-Type') || 'application/octet-stream',
      },
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Proxy failed', message: err.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
}



const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
