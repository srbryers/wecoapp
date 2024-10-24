import { loop } from "@/app/actions/loop"
import { subscriptions } from "@/app/actions/subscriptions"
import { LoopSubscription } from "@/app/utils/types"

export async function POST(request: Request) {

  const json = await request.json()
  const subscription = json.payload as LoopSubscription
  const metadata = json.metaData as { myshopifyDomain: any }

  // console.log("Rescheduled Subscription Delivery Date", JSON.stringify(json))

  if (!metadata?.myshopifyDomain) {
    console.error("Invalid metadata", metadata)
    return Response.json({ error: "Invalid metadata" }, { status: 500 })
  }
  if (!subscription?.id) {
    console.error("Invalid subscription", subscription)
    return Response.json({ error: "Invalid subscription" }, { status: 500 })
  }

  /**
   * Update the delivery date for a subscription
   * - Fired from a Loop Webhooks
   * Actions taken:
   * 1. Get the enriched subscription with the new delivery date
   * 2. Calculate and update the Loop Subscription delivery date customAttributes
   * 3. Update Klaviyo customer profile with the new delivery date
   * 4. Update Shopify customer profile with the new delivery date
   */
  const enrichedSubscription = await subscriptions.enrichSubscription(subscription) as LoopSubscription

  // console.log("Enriched Subscription", JSON.stringify(enrichedSubscription))
  if (!enrichedSubscription?.nextDeliveryDate || enrichedSubscription?.nextDeliveryDateString == "Invalid Date") {
    console.error("Could not get nextDeliveryDate for subscription:", enrichedSubscription)
    return Response.json({ error: "Could not get nextDeliveryDate for subscription" }, { status: 500 })
  }

  // Update Loop customAttributes with the new delivery date
  await loop.subscriptions.patchCustomAttributes(subscription.id, [
    {
      "key": "Delivery Date",
      "value": enrichedSubscription.nextDeliveryDate?.toISOString().split("T")[0]
    }
  ])
  // Update Klaviyo and Shopify profiles (Shopify is done within the Klaviyo update)
  await subscriptions.actions.updateKlaviyoProfile(enrichedSubscription)

  return Response.json({ message: "Success" }, { status: 200})
}