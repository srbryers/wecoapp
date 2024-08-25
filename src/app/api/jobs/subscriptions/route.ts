import { loop } from "@/app/actions/loop"
import { subscriptions } from "@/app/actions/subscriptions"
import { delay } from "@/app/utils/helpers"
import { LoopSubscription } from "@/app/utils/types"

const actions = {
  sendUpcomingSubscriptionEmail: async (days?: number) => {
    let result = []
    // Get all upcoming subscriptions
    const upcomingSubscriptions = (await subscriptions.getUpcomingSubscriptions({
      days: days
    }))
    console.log("upcomingSubscriptions", upcomingSubscriptions?.length)
    
    // Loop through the upcoming subscriptions and trigger the email in Klaviyo
    for (const subscription of upcomingSubscriptions) {
      console.info("Sending upcoming subscription email to customer:", subscription?.lastOrder?.email)
      await delay(200)
      result.push(await subscriptions.actions.sendUpcomingSubscriptionEmail(subscription))
    }
    return result
  },
  updateSubscriptions: async (days?: number) => {
    let result = {
      updated: [],
      failed: []
    } as any
    // Set start date to now, set the end date to today plus the number of days provided
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + (days || 2))

    const upcomingSubscriptions = (await subscriptions.getUpcomingSubscriptions({
      startDate: startDate,
      endDate: endDate
    }))
    console.log("upcomingSubscriptions", upcomingSubscriptions?.length)
    
    for (const subscription of upcomingSubscriptions) {
      console.info("Updating customer profile and Loop subscription:", subscription?.lastOrder?.email)
      await delay(200)
      const enrichedSubscription = await subscriptions.enrichSubscription(subscription) as LoopSubscription

      // console.log("Enriched Subscription", JSON.stringify(enrichedSubscription))
      if (!enrichedSubscription?.nextDeliveryDate || enrichedSubscription?.nextDeliveryDateString == "Invalid Date") {
        console.error("Could not get nextDeliveryDate for subscription:", enrichedSubscription)
        result.failed.push({ error: "Could not get nextDeliveryDate for subscription", subscription: subscription })
      }

      // Update Loop customAttributes with the new delivery date
      await loop.subscriptions.patchCustomAttributes(subscription.id, [
        {
          "key": "Delivery Date",
          "value": enrichedSubscription.nextDeliveryDate?.toISOString().split("T")[0] || ""
        }
      ])
      // Update Klaviyo and Shopify profiles (Shopify is done within the Klaviyo update)
      result.updated.push(await subscriptions.actions.updateKlaviyoProfile(subscription))
    }

    return result
  }
}

export async function POST(request: Request) {
  
  const json = await request.json()
  let result;

  if (!json?.action) {
    Response.json({ "error": "Please provide a valid action" }, { status: 400 })
  }

  console.log("Subscription Job", json)

  switch (json.action) {
    case 'sendUpcomingSubscriptionEmail':
      /**
       * Send upcoming subscription emails to customers
       * - Fired by a scheduled job every day at 4:00am EST in Cloud Scheduler
       */
      result = await actions.sendUpcomingSubscriptionEmail(json?.days || 2)
      return Response.json(result, { status: 200 })
    case 'updateSubscriptions':
      /**
       * Update Klaviyo profiles for upcoming subscriptions
       * - Fired by a scheduled job every day at 3:00am EST in Cloud Scheduler
       */
      result = await actions.updateSubscriptions(json?.days || 2)
      return Response.json(result, { status: 200 })
    default: 
      Response.json({ "error": "Could not find the provided action" }, { status: 404 })
  }

  return Response.json({ "error": "An error occurred" }, { status: 500 })

}