import { sf } from "@/app/utils/snowflake/snowflake"

export async function POST(request: Request) {

  const req = await request.json()
  console.log("req:", req)
  const query = req.query as string
  console.log("query:", query)

  if (!query) { return Response.json({ error: "Must provide a valid query" }, { status: 500 })}

  try {
    const res = await sf.executeQuery(query)
    console.log("res", res)
    return Response.json(res, { status: 200 })
  } catch (error) {
    console.error("error", error)
    return Response.json({ error: error }, { status: 500 })
  }
}