export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(req) {
  try {
    const { query, id } = await req.json();

    // Fallback to a random chat ID if not provided
    const chatId = id || `chat-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const url = `https://my-morphic-alpha.vercel.app/api/chat`;
    const body = JSON.stringify({
      messages: [{ role: 'user', content: query }],
      id: chatId
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body
    });

    const text = await response.text();

    try {
      const data = JSON.parse(text);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    } catch (jsonErr) {
      return new Response(
        JSON.stringify({
          error: 'Invalid JSON from upstream',
          preview: text.slice(0, 300),
        }),
        {
          status: 502,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }
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
