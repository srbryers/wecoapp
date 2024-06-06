import { db } from "@/app/_utils/firestore/firestore";
import path from 'path';
import { google } from 'googleapis';
import { sf } from "@/app/_utils/snowflake/snowflake";

const initGoogleSheets = async () => {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env['GOOGLE_APPLICATION_CREDENTIALS'] as string,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  });
  return google.sheets({version: 'v4', auth});
}

/**
 * Route to sync data from Snowflake to Google Sheets
 */

export async function POST(request: Request) {

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

    console.log("queryResult", queryResult)

    // Format the query result
    const values = [Object.keys(queryResult[0])] // Header row
    const lastColumn = String.fromCharCode(65 + values[0].length - 1) // Get the last column letter
    for (const row of queryResult) {
      values.push(Object.values(row))
    }

    console.log("values", values)

    const res2 = await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${sheetTab}!A1:${lastColumn}${values.length}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: values
      }
    })

    if (!res2) { return Response.json({ error: "Sheet not found" }, { status: 404 })}
    console.log("res2", res2)

    return Response.json(res2.data, { status: 200 })
  } catch (error) {
    console.error("error", error)
    return Response.json({ error: error }, { status: 500 })
  }

}