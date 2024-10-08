import { cigo } from "@/app/actions/cigo"
import { shopify } from "@/app/actions/shopify"

export async function POST(req: Request) {
  let result = {
    success: true,
    job: null,
    order: null,
    fulfillment: null,
    errors: [] as any[]
  }
  const body = await req.json()
  console.log("CIGO webhook received", JSON.stringify(body))

  if (!body.job_id) {
    return Response.json({ success: false, error: "Job ID not set" }, { status: 400 })
  }

  // Handle example request
  if (body.post_staging?.tracking?.url?.includes("EXAMPLE")) {
    return Response.json({
      ...result,
      success: true,
      job: body
    })
  }

  // Get the job
  const job = (await cigo.jobs.get(body.job_id))?.job
  result.job = job
  // console.log("CIGO job", job)

  console.log("jobStatus", job.status)

  // Check the status
  if (job.status === "completed") {
    const res = await shopify.helpers.createFulfillmentsFromJob(job)
    if (!res?.success) {
      result.errors.push(...(res?.errors || []))
    }
    result.fulfillment = res?.fulfillment
    result.order = res?.order
  }


  return Response.json(result)
}