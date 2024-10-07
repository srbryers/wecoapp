import { shopify } from "@/app/actions/shopify"

const resConfig: ResponseInit = {
  status: 200,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  }
}

export async function OPTIONS() {
  return new Response(null, resConfig)
}

export async function GET(request: Request) {
  const queryParams = new URL(request.url).searchParams
  const action = queryParams.get('action')

  if (!action) {
    return new Response('Invalid request', { status: 400, headers: resConfig.headers })
  }

  switch (action) {
    case 'getPublicProfile':
      const email = queryParams.get('email')
      if (!email) {
        return new Response('Email is required', { status: 400 , headers: resConfig.headers })
      }
      // Wait for 1 second so we don't get rate limited by Klaviyo or shopify
      await new Promise(resolve => setTimeout(resolve, 1000));
      const publicProfile = await shopify.customers.getPublicProfile(email)
      return new Response(JSON.stringify(publicProfile), { status: 200, headers: resConfig.headers })
    default:
      return new Response('Invalid action', { status: 400, headers: resConfig.headers })
  }

}