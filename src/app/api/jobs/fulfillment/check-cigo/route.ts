/**
 * Check CIGO for jobs that are present in Shopify but not in CIGO
 */

import { cigo } from "@/app/actions/cigo"
import { shopify } from "@/app/actions/shopify"

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
  const startDate = deliveryDates[0]
  const endDate = deliveryDates[deliveryDates.length - 1]
  const jobs = (await cigo.jobs.getAll(startDate, undefined, endDate))?.map((item: any) => item.job)

  console.log("[Check CIGO] jobs", jobs.length)

  // Find orders that are not in CIGO
  const ordersNotInCigo = orders.filter((order: any) => !jobs.some((job: any) => {
    for (const deliveryDate of deliveryDates) {
      const invoiceId = order.id.toString().split("/").pop() + "-" + deliveryDate
      if (job.invoices.includes(invoiceId)) {
        return true
      }
    }
    return false
  }))

  return Response.json({ missingJobs: ordersNotInCigo.length, totalJobs: jobs.length, dates: deliveryDates, data: ordersNotInCigo })
}