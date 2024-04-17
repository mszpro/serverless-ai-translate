import { Ai } from './vendor/@cloudflare/ai.js';

// List of valid tokens
// !!! WARNING !!!
// NOTICE! YOU SHOULD NEVER INCLUDE THIS IN THE CLIENT
// AS THERE IS THE DANGER THAT USER CAN EXTRACT THAT TOKEN AND USE YOUR
// TRANSLATION SERVICE AS THEY LIKE IN ANY APPS!
// YOU SHOULD ADD AUTHENTICATION CHECK (CHECK USER'S MEMORY LOGIN CREDENTIAL)
// BEFORE PERFORMING A REQUEST!!!
const validTokens = ['test-only'];

// List of allowed user agent keywords
// if empty, will not validate against user agents
const allowedUserAgents = [];

export default {
  async fetch(request, env) {
    const ai = new Ai(env.AI);
    const { headers } = request;

    // Check for valid Authorization token
    const authHeader = headers.get('Authorization');
    if (!authHeader || !validTokens.includes(authHeader.split(' ')[1])) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Check for valid user agent if allowedUserAgents array is not empty
    if (allowedUserAgents.length > 0) {
      const userAgent = headers.get('User-Agent');
      const isValidUserAgent = allowedUserAgents.some(agent => userAgent.includes(agent));
      if (!isValidUserAgent) {
        return new Response('Forbidden: Invalid User Agent', { status: 403 });
      }
    }

    // Attempt to parse the JSON input from the request
    try {
      const requestData = await request.json();
      const { text, source_lang, target_lang } = requestData;

      // Validate required fields
      if (!text || !source_lang || !target_lang) {
        return new Response('Missing required fields (text, source_lang, target_lang)', {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Run the AI model
      const inputs = {
        text: text,
        source_lang: source_lang,
        target_lang: target_lang
      };
      const response = await ai.run('@cf/meta/m2m100-1.2b', inputs);

      // Send back the response in JSON format
      return new Response(JSON.stringify({ inputs, response }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      });

    } catch (error) {
      // Handle JSON parsing errors or other exceptions
      return new Response('Invalid JSON format', {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
