// app/api/proxy/route.js

export async function POST(req) {
  try {
    const { query } = await req.json();

    const morphicRes = await fetch('https://my-morphic-take2-km7tjbgbq-bigfolio1s-projects.vercel.app/search?q=' + encodeURIComponent(query), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await morphicRes.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Proxy failed', details: error.message }), {
      status: 500
    });
  }
}
// end of file
