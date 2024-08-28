import { shopify } from "@/app/actions/shopify"

export async function GET(request: Request) {
  const queryParams = new URL(request.url).searchParams
  const action = queryParams.get('action')

  const resConfig: ResponseInit = {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    }
  }

  if (request.method === 'OPTIONS') {
    // Send response to OPTIONS requests
    return new Response(null, resConfig)
  }

  if (!action) {
    return new Response('Invalid request', { status: 400 })
  }

  switch (action) {
    case 'getPublicProfile':
      const email = queryParams.get('email')
      if (!email) {
        return new Response('Email is required', { status: 400 })
      }
      const publicProfile = await shopify.customers.getPublicProfile(email)
      return new Response(JSON.stringify(publicProfile), { status: 200, ...resConfig })
    default:
      return new Response('Invalid action', { status: 400 })
  }

}