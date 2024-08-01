

export async function POST(request: Request) {
  const apiKey = process.env.KLAVIYO_API_KEY
  const apiVersion = process.env.KLAVIYO_REVISION || '2024-02-15'

  const req = await request.json()

  if (!req.method || !req.path) {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }

  const url = `https://a.klaviyo.com/api/${req.path}`
  const options = {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Klaviyo-API-Key ${apiKey}`,
      'Revision': apiVersion,
      'Accept': 'application/json'
    }
  } as RequestInit
  if (req?.data) {
    options.body = JSON.stringify(req.data)
  }
  try {
    const response = await fetch(url, options)
    const data = await response.json()
    if (data.errors) {
      console.error('[klaviyoApi] errors:', data.errors)
    }
    return Response.json(data)
  } catch (error) {
    console.error('[klaviyoApi] error:', error)
    return Response.json({ error: error }, { status: 500 })
  }
}