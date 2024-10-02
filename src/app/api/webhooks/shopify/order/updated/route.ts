import { shopify } from "@/app/actions/shopify"

export async function POST(req: Request) {
  const payload = await req.json()
  // Get the order from Shopify
  const order = await shopify.orders.get(payload.id)
  const now = new Date()
  const orderLastUpdated = new Date(order.updated_at)
  const orderFulfillmentStatus = order.fulfillment_status

  // Log headers
  console.log("Headers", req.headers)

  // Check if order has been updated in the last 24hrs
  if (orderLastUpdated.getTime() > (now.getTime() - (24 * 60 * 60 * 1000)) && orderFulfillmentStatus !== "fulfilled") {
    console.log("Order has been updated in the last 24hrs and is not fulfilled and paid")
    // Send update to SNOMS
    // const res = await fetch("https://snoms.wecohospitality.com/wh/shopify/order/updated/", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     "X-Shopify-Hmac-Sha256": "0f3b396e62cd80368c8d5c207efa292b93866b5dce1cad4150f53b9d677b6656"
    //   },
    //   body: JSON.stringify(order),
    // })
    // console.log("res", res)
    return Response.json({ success: true, updated: true, sentUpdateToSNOMS: true, res: null, order: order })
  } else {
    console.log("Order has not been updated in the last 24hrs")
    return Response.json({ success: true, updated: false, sentUpdateToSNOMS: false, res: null, order: order })
  }
}