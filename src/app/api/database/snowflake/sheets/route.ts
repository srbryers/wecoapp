import { firestore } from '@/app/utils/firestore/firestore';
import { google } from 'googleapis';
import { sf } from "@/app/utils/snowflake/snowflake"

const initGoogleSheets = async () => {
  let config = {
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  } as any
  if (process.env["NODE_ENV"] === "production") {
    const {GOOGLE_APPLICATION_CREDENTIALS} = process.env;
    if (GOOGLE_APPLICATION_CREDENTIALS) {
      try {
        // Parse the secret that has been added as a JSON string
        // to retrieve database credentials
        config.credentials = JSON.parse(GOOGLE_APPLICATION_CREDENTIALS.toString());
      } catch (err) {
        throw Error(
          `Unable to parse secret from Secret Manager. Make sure that the secret is JSON formatted: ${err}`
        );
      }
    }
  } else {
    config.keyFilename = process.env["GOOGLE_APPLICATION_CREDENTIALS"]
  }
  const auth = new google.auth.GoogleAuth(config)
  return google.sheets({version: 'v4', auth});
}

/**
 * Route to sync data from Snowflake to Google Sheets
 */

export async function POST(request: Request) {

  const db = firestore().db
  const req = await request.json()
  const sheetId = req.sheetId as string
  const queryId = req.queryId as string
  const sheetTab = req.sheetTab as string

  if (!sheetId) { return Response.json({ error: "Must provide a valid sheetId" }, { status: 500 })}
  if (!queryId) { return Response.json({ error: "Must provide a valid queryId" }, { status: 500 })}
  if (!sheetTab) { return Response.json({ error: "Must provide a valid sheetTab" }, { status: 500 })}

  const sheets = await initGoogleSheets()

  try {
    const res = await db.collection("snowflake").doc(queryId).get().then((response) => {
      return response.data()
    })

    if (!res) { return Response.json({ error: "Query not found" }, { status: 404 })}

    const query = res.query
    console.log("query:", query)

    // Execute the Snowflake query
    const queryResult = await sf.executeQuery(query) as any[]

    // Format the query result
    const values = [Object.keys(queryResult[0])] // Header row
    const lastColumn = String.fromCharCode(65 + values[0].length - 1) // Get the last column letter
    for (const row of queryResult) {
      values.push(Object.values(row))
    }

    const res2 = await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${sheetTab}!A1:${lastColumn}${values.length}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: values
      }
    })

    if (!res2) { return Response.json({ error: "Sheet not found" }, { status: 404 })}

    return Response.json(res2.data, { status: 200 })
  } catch (error) {
    console.error("error", error)
    return Response.json({ error: error }, { status: 500 })
  }

}