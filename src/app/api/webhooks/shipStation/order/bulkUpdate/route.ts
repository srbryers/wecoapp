// Call the /created route for each order in the bulk update
import { shopify } from "@/app/actions/shopify"

interface Result {
  success: boolean
  updated: string[]
  errors: string[]
}

export async function POST(request: Request) {
  const json = await request.json()
  const result: Result = {
    success: true,
    updated: [],
    errors: []
  }

  // console.log("ShipStation Order Bulk Update Webhook", JSON.stringify(json))

  // Get the last x days of orders from Shopify
  const days = json.days || 1
  const startDate = json.startDate || null
  const endDate = json.endDate || null
  // Get the created at min date in YYYY-MM-DD format
  const createdAtMin = startDate ? startDate : new Date(new Date().getTime() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const createdAtMax = endDate ? endDate : new Date().toISOString().split('T')[0]
  console.log("Created At Min:", createdAtMin)
  console.log("Created At Max:", createdAtMax)
  const orders = (await shopify.orders.list('query: "created_at:>=' + createdAtMin + ' AND created_at:<=' + createdAtMax + ' AND tag:Subscription AND status:open"'))?.orders?.nodes

  console.log("Order Count:", orders.length)

  for (const order of orders) {
    console.info("Update order:", order.name)
    // Update the order with the shipStation order id
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/webhooks/shipStation/order/created`, {
      method: "POST",
      body: JSON.stringify({
        "resource_url": `https://ssapi.shipstation.com/orders?orderNumber=${order.name}`,
        "resource_type": "ORDER_NOTIFY"
      })
    })
    if (response.status === 200) {
      result.updated.push(order.name)
    } else {
      result.errors.push(order.name)
      result.success = false
    }
  }

  // console.log("Shopify Orders", orders)

  return Response.json(result, { status: 200 })
}