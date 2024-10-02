import { cigo } from "@/app/actions/cigo"
import { shopify } from "@/app/actions/shopify"
import crypto from "node:crypto"

export async function POST(req: Request) {
  const payload = await req.json()
  // Get the order from Shopify
  const order = await shopify.orders.get(payload.id)
  const now = new Date()
  const orderLastUpdated = new Date(order.updated_at)
  const orderFulfillmentStatus = order.fulfillment_status

  // Validate shopify hmac
  const hmac = req.headers.get("X-Shopify-Hmac-Sha256")
  if (!hmac) {
    return Response.json({ success: false, error: "Shopify HMAC not set" }, { status: 401 })
  }
  const shopifyWebhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET_ORDERS_UPDATED
  if (!shopifyWebhookSecret) {
    return Response.json({ success: false, error: "Shopify webhook secret not set" }, { status: 500 })
  }
  const generatedHmac = crypto.createHmac('sha256', shopifyWebhookSecret).update(JSON.stringify(payload)).digest('base64')

  console.log("generatedHmac", generatedHmac)
  console.log("hmac", hmac)
  console.log("Payload", JSON.stringify(payload))
  // Compare hmacs
  const result = crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(generatedHmac))
  console.log("HMAC comparison result", result)
  // if (!result) {
  //   return Response.json({ success: false, error: "Invalid HMAC" }, { status: 401 })
  // }

  // Check if order has been updated in the last 24hrs
  if (orderLastUpdated.getTime() > (now.getTime() - (24 * 60 * 60 * 1000)) && orderFulfillmentStatus !== "fulfilled") {
    console.log("Order has been updated in the last 24hrs and is not fulfilled and paid")
    // Add/update the job in CIGO
    // const job = await cigo.jobs.create()
    //Send update to SNOMS
    const res = await fetch("https://snoms.wecohospitality.com/wh/shopify/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Hmac-Sha256": hmac,
        "X-Shopify-Topic": "orders/updated"
      },
      body: JSON.stringify(payload),
    }).then((res) => res.text())
    console.log("res", res)
    return Response.json({ success: true, updated: true, sentUpdateToSNOMS: true, res: res, order: order })
  } else {
    console.log("Order has not been updated in the last 24hrs")
    return Response.json({ success: true, updated: false, sentUpdateToSNOMS: false, res: null, order: order })
  }
}