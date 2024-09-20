import { Firestore, Settings } from '@google-cloud/firestore';
import { unescape } from 'node:querystring';

export enum FirestoreActions {
  add = "add",
  update = "update",
  delete = "delete",
  batchAdd = "batchAdd",
  batchUpdate = "batchUpdate",
  batchDelete = "batchDelete"
}

export const firestore = () => {
  let config = {
    projectId: process.env["GCP_PROJECT_ID"],
    databaseId: "weco",
  } as Settings

  const {GOOGLE_APPLICATION_CREDENTIALS} = process.env;

  if (GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      // Unescape the credentials string and parse it as JSON
      config.credentials = JSON.parse(GOOGLE_APPLICATION_CREDENTIALS)
    } catch (err) {
      throw Error(
        `Unable to parse secret from Secret Manager. Make sure that the secret is JSON formatted: ${err}`
      );
    }
  }

  const db = new Firestore(config)

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

  return {
    db: db,
    add: addDocument
  }

}