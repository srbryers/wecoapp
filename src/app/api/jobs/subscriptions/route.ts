import { subscriptions } from "@/app/actions/subscriptions"
import { delay } from "@/app/utils/helpers"

export async function POST(request: Request) {
  
  const json = await request.json()

  if (!json.action) {
    Response.json({ "error": "Please provide a valid Klaviyo action" }, { status: 400 })
  }

  switch (json.action) {
    case 'sendUpcomingSubscriptionEmail':

      let result = []
      // Get all upcoming subscriptions
      const upcomingSubscriptions = (await subscriptions.getUpcomingSubscriptions(json?.params?.days))
      console.log("upcomingSubscriptions", upcomingSubscriptions?.length)
      
      // Loop through the upcoming subscriptions and trigger the email in Klaviyo
      for (const subscription of upcomingSubscriptions) {
        console.info("Sending upcoming subscription email to customer:", subscription?.lastOrder?.email)
        await delay(200)
        // result.push(await subscriptions.actions.sendUpcomingSubscriptionEmail(subscription))
      }

      return Response.json(result, { status: 200 })

    case 'updateDeliveryDate':
      const updatedDeliveryDate = await subscriptions.updateDeliveryDate(json)
      console.log("updatedDeliveryDate", updatedDeliveryDate)
      return Response.json(updatedDeliveryDate, { status: 200 })
    default: 
      Response.json({ "error": "Could not find the provided action" }, { status: 404 })
  }

}