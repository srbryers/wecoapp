/**
 * Snowflake API
 */
import { db } from "@/app/_utils/firestore/firestore"

/**
 * Get all snowflake queries from the database
 */
export async function GET() {

  try {
    const res = await db.collection("snowflake").get().then((response) => {
      return response.docs.map((doc) => {
        return {
          id: doc.id,
          ...doc.data()
        }
      })
    })
    return Response.json(res, { status: 200 })
  } catch (error) {
    console.error("error", error)
    return Response.json({ error: error }, { status: 500 })
  }
}

/**
 * Save snowflake queries to a database
 */
export async function POST(request: Request) {

  const req = await request.json()
  console.log("req:", req)
  const query = req.query as string
  const name = req.name as string
  const handleizedName = name.toLowerCase().replace(/ /g, "-")
  console.log("query:", query)

  if (!query) { return Response.json({ error: "Must provide a valid query" }, { status: 500 })}
  if (!name) { return Response.json({ error: "Must provide a valid query name" }, { status: 500 })}

  try {
    const res = await db.collection("snowflake").doc(handleizedName).set(req).then(async () => {
      const response = await db.collection("snowflake").doc(handleizedName).get()
      return response.data()
    })
    console.log("res", res)
    return Response.json(res, { status: 200 })
  } catch (error) {
    console.error("error", error)
    return Response.json({ error: error }, { status: 500 })
  }
}

/**
 * Delete a snowflake query from the database
 */
export async function DELETE(request: Request) {

  const req = await request.json()
  const id = req.id as string
  console.log("id:", id)

  if (!id) { return Response.json({ error: "Must provide a valid id" }, { status: 500 })}

  try {
    const res = await db.collection("snowflake").doc(id).delete().then(() => {
      return Response.json({ message: "Document successfully deleted" }, { status: 200 })
    })
    return res
  } catch (error) {
    console.error("error", error)
    return Response.json({ error: error }, { status: 500 })
  }
}