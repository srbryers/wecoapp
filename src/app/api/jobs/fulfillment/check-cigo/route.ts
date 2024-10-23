/**
 * Check CIGO for jobs that are present in Shopify but not in CIGO
 */

import { cigo } from "@/app/actions/cigo"
import { shopify } from "@/app/actions/shopify"
import { slack } from "@/app/actions/slack"
import { delay } from "@/app/utils/helpers"

const slackWebhookUrls = JSON.parse(process.env.SLACK_WEBHOOK_URLS ?? "{}")

export async function GET(req: Request) {
  const searchParams = new URL(req.url).searchParams
  const deliveryDate = searchParams.get("deliveryDate")

  // Get the next 14 days of delivery dates
  let deliveryDates = Array.from({ length: 7 }, (_, i) => {
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

  // return Response.json(orders)
  console.log("[Check CIGO] Shopify orders", orders.length)

  // Get all jobs from CIGO for the given date
  const startDate = new Date(deliveryDates[0])
  startDate.setDate(startDate.getDate() - 1)
  const endDate = deliveryDates[deliveryDates.length - 1]
  const jobs = (await cigo.jobs.getAll(startDate.toISOString().split("T")[0], undefined, endDate))?.map((item: any) => item?.job)

  console.log("[Check CIGO] CIGO jobs", jobs.length)

  // Find orders that are not in CIGO
  const ordersMessages = []
  const ordersWithJobs = []
  const ordersNotInCigo: any[] = []
  const createdJobs = []

  for (const order of orders) {
    for (const deliveryDate of deliveryDates) {
      const invoiceId = order.id?.toString().split("/").pop() + "-" + deliveryDate
      const job = jobs.find((job: any) => job.invoices.includes(invoiceId))
      if (job) {
        ordersWithJobs.push(order)
        console.log(`[Check CIGO] order with job ${ordersWithJobs.findIndex((o: any) => o.id === order.id) + 1} of ${ordersWithJobs.length}`, order.id)
        // Get existing metafield
        const metafields = order.metafields as any
        const existingMetafield = metafields?.edges?.find((metafield: any) => metafield.node.namespace === "cigo" && metafield.node.key === "job_ids")
        const jobIds = JSON.parse(existingMetafield?.node?.value || "[]")

        // Update the order metafield with the job id
        if (!jobIds.includes(job.job_id)) {
          await shopify.orders.updateMetafields({
          id: order.id,
            metafields: [{ namespace: "cigo", key: "job_ids", value: JSON.stringify([...jobIds, job.job_id]) }]
          })
          await delay(100)
        }
      } else {
        ordersNotInCigo.push(order)
      }
    }
  }

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
          // Create the job
          try {
            console.log(`[Check CIGO] creating job for order ${ordersNotInCigo.findIndex((o: any) => o.id === order.id) + 1} of ${ordersNotInCigo.length}`)
            const res = await cigo.helpers.createJob(order, deliveryDate)
            if (!res.success) {
              console.error(`[Check CIGO] error creating job for order ${orderNumber} with date ${deliveryDate}`)
              ordersMessages.push(`>*Order ID:* ${invoiceId}\n>*Order Number:* <${orderUrl}|${orderNumber}>\n>*Delivery Date:* ${deliveryDate}`)
            } else {
              console.log(`[Check CIGO] job created for order ${orderNumber} with date ${deliveryDate}`)
              createdJobs.push(res.data)
            }
          } catch (error) {
            console.error(`[Check CIGO] error creating job for order ${orderNumber} with date ${deliveryDate}`, error)
            ordersMessages.push(`>*Order ID:* ${invoiceId}\n>*Order Number:* <${orderUrl}|${orderNumber}>\n>*Delivery Date:* ${deliveryDate}`)
          }
        }
      }
    }
    // await slack.sendMessage({
    //   text: `
    //     [Check CIGO] ${ordersNotInCigo.length} orders not in CIGO for dates: ${deliveryDates.join(", ")}.
    //     \n\n${ordersMessages.join("\n\n")}`,
    // }, slackWebhookUrls.lastMile)
  }

  return Response.json({ 
    missingJobs: ordersNotInCigo.length,
    createdJobs: createdJobs.length,
    totalJobs: jobs.length,
    dates: deliveryDates,
    missingJobsData: ordersNotInCigo,
    createdJobsData: createdJobs
  })
}
