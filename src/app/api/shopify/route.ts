

export async function POST(request: Request) {
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN || ''
  const shop = process.env.SHOPIFY_SHOP_NAME || ''
  const apiVersion = process.env.SHOPIFY_API_VERSION || '2024-01'

  const req = await request.json()

  if (!req.method || !req.path) {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }

  const url = `https://${shop}.myshopify.com/admin/api/${apiVersion}${req.path}`
  const options = {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
      'Accept': 'application/json'
    }
  } as RequestInit
  if (req.data) {
    options.body = JSON.stringify(req.data)
  }
  try {
    console.log("[shopifyRestApi] url:", url)
    console.log("[shopifyRestApi] options:", options)
    const response = await fetch(url, options)
    const data = await response.json()
    console.log("[shopifyRestApi response]:", data)
    if (data.errors) {
      console.error('[shopifyRestApi] errors:', data.errors)
    }
    return Response.json(data)
  } catch (error) {
    console.error('[shopifyRestApi] error:', error)
    return Response.json({ error: error }, { status: 500 })
  }
}