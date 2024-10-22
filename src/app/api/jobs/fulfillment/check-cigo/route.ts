/**
 * Check CIGO for jobs that are present in Shopify but not in CIGO
 */

import { cigo } from "@/app/actions/cigo"
import { shopify } from "@/app/actions/shopify"
import { slack } from "@/app/actions/slack"

const slackWebhookUrls = JSON.parse(process.env.SLACK_WEBHOOK_URLS ?? "{}")

export async function GET(req: Request) {
  const searchParams = new URL(req.url).searchParams
  const deliveryDate = searchParams.get("deliveryDate")

  // Get the next 14 days of delivery dates
  let deliveryDates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i)
    return date.toISOString().split("T")[0]
  })

  if (deliveryDate) {
    deliveryDates = [deliveryDate]
  }

  console.log("[Check CIGO] deliveryDates", deliveryDates)

  // Get all orders for all delivery dates
  const orders = await shopify.orders.list(`query: "tag:${deliveryDates.join(" OR tag:")} AND tag:delivery AND NOT tag:Subscription AND NOT financial_status:refunded"`)

  // Get all jobs from CIGO for the given date
  const startDate = new Date(deliveryDates[0])
  startDate.setDate(startDate.getDate() - 7)
  const endDate = deliveryDates[deliveryDates.length - 1]
  const jobs = (await cigo.jobs.getAll(startDate.toISOString().split("T")[0], undefined, endDate))?.map((item: any) => item?.job)

  // Find orders that are not in CIGO
  const ordersMessages = []
  const ordersNotInCigo = orders.filter((order: any) => !jobs.some((job: any) => {
    for (const deliveryDate of deliveryDates) {
      const invoiceId = order.id.toString().split("/").pop() + "-" + deliveryDate
      if (job.invoices.includes(invoiceId)) {
        return true
      }
    }
    return false
  }))

  if (ordersNotInCigo.length > 0) {
    // console.log("[Check CIGO] ordersNotInCigo", ordersNotInCigo)
    // Send slack notification
    
    for (const order of ordersNotInCigo) {
      const deliveryDates = await cigo.helpers.getDeliveryDates(order)
      const orderId = order.id?.toString().split("/").pop()
      const orderNumber = order.name
      const orderUrl = `https://admin.shopify.com/store/e97e57-2/orders/${orderId}`
      for (const deliveryDate of deliveryDates ?? []) {
        const invoiceId = `${orderId}-${deliveryDate}`
        const existingJob = jobs.find((job: any) => job.invoices.find((invoice: any) => invoice.id === invoiceId))
        if (!existingJob) {
          ordersMessages.push(`>*Order ID:* ${invoiceId}\n>*Order Number:* <${orderUrl}|${orderNumber}>\n>*Delivery Date:* ${deliveryDate}`)
        }
      }
    }
    await slack.sendMessage({
      text: `
        [Check CIGO] ${ordersNotInCigo.length} orders not in CIGO for dates: ${deliveryDates.join(", ")}.
        \n\n${ordersMessages.join("\n\n")}`,
    }, slackWebhookUrls.lastMile)
  }

  return Response.json({ missingJobs: ordersNotInCigo.length, totalJobs: jobs.length, dates: deliveryDates, data: ordersNotInCigo })
}