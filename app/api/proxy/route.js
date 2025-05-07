// app/api/proxy/route.js

export async function POST(req) {
  try {
    const body = await req.json();
    const query = body.query;

    const response = await fetch('https://my-morphic-take2-km7tjbgbq-bigfolio1s-projects.vercel.app/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Proxy failed', message: err.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}
