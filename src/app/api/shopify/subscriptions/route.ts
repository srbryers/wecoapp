/**
 * Create a subscription order in our chosen platform
 * - Fired by the creation of a new Shopify order with a "Delivery Date" and "_productVariantIds" customAttribute
 */

import { loop } from "@/app/actions/loop"
import { Order } from "@/app/utils/types"

export async function POST(request: Request) {
  const json = await request.json()
  const order = json?.order as Order

  if (!order) {
    return Response.json({ message: "No order found" }, { status: 400 })
  }
  if (!order.customer) {
    return Response.json({ message: "No customer found" }, { status: 400 })
  }
  if (!order.note_attributes?.find((note) => note.name === "Delivery Date")) {
    return Response.json({ message: "No delivery date found" }, { status: 400 })
  }

  // Create a subscription order in Loop
  const interval = "WEEK"
  const intervalCount = 1
  // Get the delivery date from the order
  const deliveryDate = order.note_attributes.find((note) => note.name === "Delivery Date")?.value
  // set next billing date to created at + 1 week
  // const nextBillingDate = new Date(order.created_at || new Date()).getTime() + (7 * 24 * 60 * 60 * 1000)
  // const nextBillingDateEpoch = nextBillingDate / 1000 

  // Create the subscription
  // const subscription = await loop.subscriptions.create({
  //   customerShopifyId: order.customer.id,
  //   nextBillingDateEpoch: nextBillingDateEpoch,
  //   currencyCode: order.currency || "USD",
  //   paymentMethodId: order.payment_gateway_names[0],
  //   deliveryPolicy: {
  //     interval: "weekly",
  //     intervalCount: 1
  //   },
    
  // })

  console.log("json", json)
  return Response.json({ message: json }, { status: 200 })
}