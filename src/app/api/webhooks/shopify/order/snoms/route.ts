import { shopify } from "@/app/actions/shopify"
import crypto from "node:crypto"

export async function POST(req: Request) {
  const body = await req.text()

  // Validate shopify hmac
  const hmac = req.headers.get("X-Shopify-Hmac-Sha256")
  if (!hmac) {
    return Response.json({ success: false, error: "Shopify HMAC not set" }, { status: 401 })
  }
  const shopifyWebhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET_ORDERS_UPDATED
  if (!shopifyWebhookSecret) {
    return Response.json({ success: false, error: "Shopify webhook secret not set" }, { status: 500 })
  }
  // Generate HMAC from secret and request body
  const generatedHmac = crypto.createHmac('sha256', shopifyWebhookSecret).update(body).digest('base64')

  // Compare hmacs
  const result = crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(generatedHmac))
  const payload = JSON.parse(body)
  console.log(`[${payload.name}] HMAC comparison result:`, result)

  if (!result) {
    return Response.json({ success: false, error: "Invalid HMAC" }, { status: 401 })
  }

  // Get the order from Shopify
  const order = await shopify.orders.get(payload.id)
  const now = new Date()
  const orderLastUpdated = new Date(order.updated_at)
  const orderFulfillmentStatus = order.fulfillment_status

  // Check if order has been updated in the last 24hrs
  if (orderLastUpdated.getTime() > (now.getTime() - (24 * 60 * 60 * 1000)) && orderFulfillmentStatus !== "fulfilled") {
    console.log(`[${order.name}] Order has been updated in the last 24hrs and is not fulfilled and paid`)
    console.log(JSON.stringify({
      ...payload,
      "X-Shopify-Hmac-Sha256": result,
    }))
    // Send update to SNOMS
    const res = await fetch("https://snoms.wecohospitality.com/wh/shopify/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Hmac-Sha256": "ukCsBYCdrDktlQNE",
        "X-Shopify-Topic": "orders/updated"
      },
      body: JSON.stringify({
        ...payload,
        "X-Shopify-Hmac-Sha256": "ukCsBYCdrDktlQNE",
      }),
    })
    console.log(`[${order.name}] sent to SNOMS - status:`, res.status)
    return Response.json({ success: true, updated: true, sentUpdateToSNOMS: true, res: res, order: order })
  } else {
    console.log(`[${order.name}] Order has not been updated in the last 24hrs or is fulfilled already`)
    return Response.json({ success: true, updated: false, sentUpdateToSNOMS: false, res: null, order: order })
  }
}