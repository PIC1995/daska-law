exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let email;
  try {
    ({ email } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, body: 'Invalid email' };
  }

  const BREVO_KEY = process.env.BREVO_API_KEY;

  const res = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'api-key': BREVO_KEY
    },
    body: JSON.stringify({
      email,
      listIds: [2],
      updateEnabled: true,
      attributes: {
        SOURCE: 'Diagnostic Daska.law',
        DATE_INSCRIPTION: new Date().toISOString().split('T')[0]
      }
    })
  });

  const ok = res.ok || res.status === 204;
  return {
    statusCode: ok ? 200 : 500,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ success: ok })
  };
};
