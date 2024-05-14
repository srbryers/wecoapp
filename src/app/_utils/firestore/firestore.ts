import { Firestore } from '@google-cloud/firestore';

export enum FirestoreActions {
  add = "add",
  update = "update",
  delete = "delete",
  batchAdd = "batchAdd",
  batchUpdate = "batchUpdate",
  batchDelete = "batchDelete"
}

type FirestoreUtility = {
  [key in FirestoreActions]?: any
};

const db = new Firestore({
  projectId: process.env["GCP_PROJECT_ID"],
  databaseId: "weco",
  keyFilename: process.env["GOOGLE_APPLICATION_CREDENTIALS"]
})

/**
 * Add a document
 * @param collection the id of the collection
 * @param data the data being set
 * @param docId the id of the document (optional), otherwise auto-generated
 */
const addDocument = async (data: any) => {
  const docId = data.docId
  const collectionId = data.collectionId

  // Clear out the doc and collection ids from the data object
  delete data.docId
  delete data.collectionId
  delete data.action

  try {
    if (docId) {
      // If we have a docId, set the doc with an ID
      return await db.collection(collectionId).doc(docId).set(data);
    } else {
      console.log("[addDocument] no docId, generate new one:", data)
      // Otherwise, let firestore generate the ID
      return await db.collection(collectionId).add(data);
    }
  } catch (error) {
    throw error
  }

}

export const firestore = {
  add: addDocument
} as FirestoreUtility