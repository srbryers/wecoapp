import { firestore, FirestoreActions } from "@/app/_utils/firestore/firestore"

export async function POST(request: Request) {

  
  const req = await request.json()
  console.log("req:", req)
  const action = req.action as FirestoreActions

  if (!action) { return Response.json({ error: "Must provide a valid action" }, { status: 500 })}

  try {
    const res = await firestore[action](req)
    console.log("res", res)
    return Response.json(res, { status: 200 })
  } catch (error) {
    console.error("error", error)
    return Response.json({ error: error }, { status: 500 })
  }
}