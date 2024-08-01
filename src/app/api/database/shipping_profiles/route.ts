import { firestore } from "@/app/utils/firestore/firestore";
import { ShippingProfile } from "@/app/utils/types";

export async function GET() {
  
  const db = firestore().db
  let result;

  console.log("Get Shipping Profiles")

  try {
    result = await db.collection('shipping').get().then((response) => {
      return response.docs.map((doc) => {
        return {
          id: doc.id,
          ...doc?.data()
        }
      })
    })
  } catch (error) {
    console.error("Error getting shipping profiles:", error)
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
  const collectionRef = db.collection('shipping')

  // Clear out the docId from the data object
  delete data.docId

  console.log("Create Shipping Profile", data)

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
    const data = result?.data() as ShippingProfile
    return Response.json(data, { status: 200 })
  }
}

/**
 * Update a Shipping Profile
 */
export async function PUT(request: Request) {

  const db = firestore().db
  let result;
  const data = await request.json()
  const docId = data.id
  const collectionRef = db.collection('shipping')

  if (!docId) {
    return Response.json("No docId provided", { status: 400 })
  }

  // Clear out the docId from the data object
  delete data.id

  console.log("Update Shipping Profile", data)

  try {
    // If we have a docId, set the doc with an ID
    result = await collectionRef.doc(docId).update(data).then(() => {
      return collectionRef.doc(docId).get()
    });
  } catch (error) {
    return Response.json(error, { status: 500 })
  } finally {
    // Return the newly created document
    const data = result?.data() as ShippingProfile
    return Response.json(data, { status: 200 })
  }
}

/**
 * Delete a Shipping Profile
 */
export async function DELETE(request: Request) {

  const db = firestore().db
  let result;
  const data = await request.json()
  const docId = data.id
  const collectionRef = db.collection('shipping')

  console.log("Delete Shipping Profile", data)

  try {
    // If we have a docId, set the doc with an ID
    result = await collectionRef.doc(docId).delete()
  } catch (error) {
    return Response.json(error, { status: 500 })
  } finally {
    // Return the newly created document
    return Response.json("Successfully deleted shipping profile", { status: 200 })
  }
}