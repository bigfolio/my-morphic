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

    const messages = [
      {
        role: 'system',
        content: `IMPORTANT: You must always provide a complete, informative, and confident answer to every query — even if the input is a single word or vague.

For example, if the input is "Acne", explain:
- What acne is (definition)
- Why it occurs (context)
- Different types
- Treatments
- Related concepts

NEVER ask for clarification. NEVER say “I need more info.” Assume the user wants everything you can tell them. You are a brilliant explainer AI.`
      },
      {
        role: 'user',
        content: query
      }
    ];

    // ✅ Log the payload to verify it's correct
    console.log('Sending to AI:', body); // <- Add this

    const url = `https://my-morphic-alpha.vercel.app/api/chat`;

    const upstreamResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages, id: chatId }),
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
