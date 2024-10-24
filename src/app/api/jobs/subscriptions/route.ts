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
  updateSubscriptions: async ({
    days,
    subscriptionIds,
    startDate,
    endDate
  }: {
    days?: number,
    subscriptionIds?: number[],
    startDate?: Date,
    endDate?: Date
  }) => {
    let result = {
      updated: [],
      skipped: [],
      failed: []
    } as any
    // Set start date to now, set the end date to today plus the number of days provided
    let start = startDate ? new Date(startDate) : new Date()
    let end = endDate ? new Date(endDate) : new Date(startDate || new Date())
    // If no end date is provided, set it to today plus the number of days provided
    if (!endDate) end = new Date(end.setDate(end.getDate() + (days || 2)))

    console.log("[updateSubscriptions] start", start.getDate())
    console.log("[updateSubscriptions] end", end.toLocaleString())

    // Get the upcoming subscriptions
    let upcomingSubscriptions = []

    if (subscriptionIds && subscriptionIds?.length > 0) {
      for (const id of subscriptionIds) {
        const subscription = await loop.subscriptions.get(id.toString())
        upcomingSubscriptions.push(subscription?.data)
      }
    } else {
      upcomingSubscriptions = (await subscriptions.getUpcomingSubscriptions({
        startDate: start,
        endDate: end
      }))
    }

    for (const subscription of upcomingSubscriptions) {
      await delay(200)
      const subscriptionIndex = upcomingSubscriptions.indexOf(subscription) + 1
      const enrichedSubscription = await subscriptions.enrichSubscription(subscription) as LoopSubscription
      const subscriptionLastUpdatedBy = subscription?.attributes?.find((attribute: any) => attribute.key === "Last Updated By")?.value
      const subscriptionDeliveryDate = subscription?.attributes?.find((attribute: any) => attribute.key === "Delivery Date")?.value
      console.log(`[updateSubscriptions][${subscriptionIndex}/${upcomingSubscriptions.length}] ${enrichedSubscription?.lastOrder?.email} ${subscription?.id} nextDeliveryDate:`, subscriptionDeliveryDate)

      // console.log("Enriched Subscription", JSON.stringify(enrichedSubscription))
      if (!enrichedSubscription?.nextDeliveryDate || enrichedSubscription?.nextDeliveryDateString == "Invalid Date") {
        console.error("[updateSubscriptions] Could not get nextDeliveryDate for subscription customer:", enrichedSubscription.lastOrder?.email)
        result.failed.push({ error: "Could not get nextDeliveryDate for subscription", subscription: enrichedSubscription })
      }
      // // console.log("Enriched Subscription", enrichedSubscription)

      // Update the Loop Subscription Attributes
      console.log("[updateSubscriptions] subscriptionLastUpdatedBy", subscriptionLastUpdatedBy)
      console.log("[updateSubscriptions] subscriptionDeliveryDate", subscriptionDeliveryDate)
      console.log("[updateSubscriptions] enrichedSubscription.nextDeliveryDateString", enrichedSubscription.nextDeliveryDateString)

      // Update Loop customAttributes with the new delivery date IF the customAttributes are different and the last updated by is not "Customer"
      if (subscriptionDeliveryDate !== enrichedSubscription.nextDeliveryDateString && subscriptionLastUpdatedBy !== "Customer") {
        console.log("[updateSubscriptions] UPDATED: Updating Loop Subscription Attributes", enrichedSubscription.nextDeliveryDateString)
        await loop.subscriptions.patchCustomAttributes(subscription.id, [
          {
            "key": "Delivery Date",
            "value": enrichedSubscription.nextDeliveryDateString || ""
          },
          {
            "key": "Last Updated By",
            "value": "WECOApp"
          },
          {
            "key": "Last Updated At",
            "value": (new Date()).toISOString()
          }
        ])
        result.updated.push({
          email: enrichedSubscription.lastOrder?.email,
          subscriptionId: subscription.id,
          nextDeliveryDate: enrichedSubscription.nextDeliveryDateString
        })
      } else {
        console.log("[updateSubscriptions] SKIPPED:Subscription Attributes are already up to date")
        result.skipped.push({
          email: enrichedSubscription.lastOrder?.email,
          subscriptionId: subscription.id,
          nextDeliveryDate: enrichedSubscription.nextDeliveryDateString
        })
      }
      // Update Klaviyo and Shopify profiles (Shopify is done within the Klaviyo update)
      try {
        result.updated.push(await subscriptions.actions.updateKlaviyoProfile(subscription))
      } catch (error) {
        console.error("[updateSubscriptions] Could not update Klaviyo profile for subscription customer:", subscription.lastOrder?.email)
        result.failed.push({ error: "Could not update Klaviyo profile", subscription: subscription })
      }

      console.log("[updateSubscriptions] Subscription update complete")
      console.log("================================================")
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

  console.log("[subscriptions] Start Job:", json.action)

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
      result = await actions.updateSubscriptions({
        days: json?.days || 2,
        subscriptionIds: json?.subscriptionIds || [],
        startDate: json?.startDate,
        endDate: json?.endDate
      })
      console.log("[updateSubscriptions] result", JSON.stringify(result))
      return Response.json(result, { status: 200 })
    default:
      Response.json({ "error": "Could not find the provided action" }, { status: 404 })
  }

  return Response.json({ "error": "An error occurred" }, { status: 500 })

}