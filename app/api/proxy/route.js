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

    const body = JSON.stringify({
  messages: [
    { role: 'system', content: "IMPORTANT: You must always provide a complete, informative, and confident answer to every query — even if the input is a single word or vague..." },
    { role: 'user', content: query }
  ],
  id: chatId
});

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
