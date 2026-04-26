exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) {
    return {
      statusCode: 503,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Paiement temporairement indisponible' })
    };
  }

  const host = event.headers.host;
  const origin = host
    ? (host.includes('localhost') ? `http://${host}` : `https://${host}`)
    : 'https://daska.law';

  // Use a pre-configured Stripe Price ID if set, otherwise build inline price
  const PRICE_ID = process.env.STRIPE_CLEAN_CAPITAL_PRICE_ID;

  const params = PRICE_ID
    ? new URLSearchParams({
        'line_items[0][price]': PRICE_ID,
        'line_items[0][quantity]': '1',
        'mode': 'payment',
        'success_url': `${origin}/?payment=success`,
        'cancel_url': `${origin}/?payment=cancel#offres`,
        'locale': 'fr',
      })
    : new URLSearchParams({
        'line_items[0][price_data][currency]': 'eur',
        'line_items[0][price_data][product_data][name]': 'Clean Capital',
        'line_items[0][price_data][product_data][description]':
          'Mise en conformité capitalistique — rapport de conformité + table de capitalisation certifiée + 30 min avocat spécialisé',
        'line_items[0][price_data][unit_amount]': '99900',
        'line_items[0][quantity]': '1',
        'mode': 'payment',
        'success_url': `${origin}/?payment=success`,
        'cancel_url': `${origin}/?payment=cancel#offres`,
        'locale': 'fr',
      });

  let res, session;
  try {
    res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });
    session = await res.json();
  } catch (err) {
    console.error('Stripe fetch error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Erreur réseau Stripe' })
    };
  }

  if (!res.ok) {
    console.error('Stripe API error:', session.error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: session.error?.message || 'Erreur Stripe' })
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: session.url })
  };
};
