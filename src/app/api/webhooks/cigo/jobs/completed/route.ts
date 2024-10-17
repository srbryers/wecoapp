import { cigo } from "@/app/actions/cigo"
import { shopify } from "@/app/actions/shopify"

export async function POST(req: Request) {
  let result = {
    success: true,
    errors: [] as any[],
    job: null,
    order: null,
    fulfillment: null,
  }
  const body = await req.json()
  console.log("[CIGO] webhook received", JSON.stringify(body))

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
  const jobStatus = job.status
  const jobOperator = job.post_staging?.scheduling?.operators?.[0]
  // console.log("CIGO job", job)

  console.log("[CIGO] job status:", jobStatus)

  // If the job is completed or in progress, or if the job has an operator assigned, create a fulfillment
  if (jobStatus === "completed" || jobStatus === "in progress" || jobOperator) {
    const res = await shopify.helpers.createFulfillmentsFromJob(job)
    if (!res?.success) {
      result.errors.push(...(res?.errors || []))
    }
    result.fulfillment = res?.fulfillment
    result.order = res?.order
  } else {
    console.log("[CIGO] job status is not completed or in progress")
    return Response.json({ success: false, error: "Job status is not completed or in progress" }, { status: 400 })
  }

  console.log("[CIGO] result", JSON.stringify(result))

  return Response.json(result)
}