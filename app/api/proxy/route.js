const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(req) {
  console.log('🔄 Proxy POST called');

  try {
    const { query, id } = await req.json();

    console.log('📥 Incoming query:', query);

    const chatId = id || `chat-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const systemPrompt = {
      role: 'system',
      content:
        `You are a highly intelligent AI assistant. Respond with clear, direct, informative answers — even when the user only types one word. Do not ask for clarification. Do not ask questions. Just explain the concept clearly. Keep the tone confident and helpful.`,
    };

    const userPrompt = {
      role: 'user',
      content: query,
    };

    const messages = [systemPrompt, userPrompt];

    console.log('📤 Forwarding messages array to /api/chat:\n', JSON.stringify(messages, null, 2));

    const url = `https://my-morphic-alpha.vercel.app/api/chat`;

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

    if (!upstreamResponse.ok) {
      const errorText = await upstreamResponse.text();
      console.error('❌ Error from /api/chat:', errorText);
    }

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: {
        ...corsHeaders,
        'Content-Type': upstreamResponse.headers.get('Content-Type') || 'application/octet-stream',
      },
    });
  } catch (err) {
    console.error('🚨 Proxy failed:', err);

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
