import { firestore } from "@/app/utils/firestore/firestore";

export async function GET() {
  
  let result;

  console.log("Get Customers")
  const db = firestore().db

  try {
    result = await db.collection('customers').get().then((response) => {
      return response.docs.map((doc) => {
        return doc.data()
      })
    })
  } catch (error) {
    console.error("Error getting customers:", error)
    return Response.json(error, { status: 500 })
  } finally {
    return Response.json(result, { status: 200 })
  }

}

export async function POST(request: Request) {

  const db = firestore().db

  let result;
  const data = await request.json()
  const docId = data.docId
  const collectionRef = db.collection('customers')

  // Clear out the docId from the data object
  delete data.docId

  console.log("Create Customer", data)

  try {
    if (docId) {
      // If we have a docId, set the doc with an ID
      result = await collectionRef.doc(docId).set(data).then(() => {
        return collectionRef.doc(docId).get()
      });
    } else {
      console.log("[addDocument] no docId, generate new one:", data)
      // Otherwise, let firestore generate the ID
      result = await collectionRef.add(data).then((response) => {
        return response.get()
      });
    }
  } catch (error) {
    return Response.json(error, { status: 500 })
  } finally {
    // Return the newly created document
    return Response.json(result?.data(), { status: 200 })
  }
}