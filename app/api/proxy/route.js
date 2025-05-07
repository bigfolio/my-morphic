// app/api/proxy/route.js

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const query = body.query;

    const response = await fetch('https://my-morphic-nz1b2jjz0-bigfolio1s-projects.vercel.app/search?q=' + encodeURIComponent(query));
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Allow all origins
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: 'Proxy failed',
      message: err.message,
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://trendyline.net', // Allow all origins
      },
    });
  }
}
