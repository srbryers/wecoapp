import { shopify } from "@/app/actions/shopify"
import { sheets } from "@/app/utils/google"

type Result = {
  errors: { order_number: string; error: string }[],
  added: any[][],
  updated: any[][]
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  let result = {
    errors: [],
    added: [],
    updated: []
  } as Result

  const daysAgo = searchParams.get('daysAgo')
  const orderType = searchParams.get('orderType')
  const sheetId = searchParams.get('sheetId')
  const sheetTabName = searchParams.get('sheetTabName')
  const store = searchParams.get('store') || "e97e57-2"

  if (!daysAgo || !orderType || !sheetId || !sheetTabName) {
    return Response.json({ error: 'Date, order type, sheet ID, and sheet tab name are required' }, { status: 400 })
  }

  // Get the fulfillment counts for the given date and order type
  const fulfillmentCounts = await shopify.helpers.getFulfillmentCounts(Number(daysAgo || "14"), orderType, store)

  // return Response.json(fulfillmentCounts)

  // Add errors to the result
  result.errors = fulfillmentCounts?.errors as { order_number: string; error: string }[] || []

  // Format the fulfillment counts for the Google Sheet
  const formattedFulfillmentCounts = Object.values(fulfillmentCounts?.countsData || {}).map((count: any) => {
    return Object.values(count).map((value: any) => {
      if (Array.isArray(value)) {
        return value.join(", ")
      } else {
        return value || ""
      }
    })
  })

  if (fulfillmentCounts?.countsData?.length === 0) {
    return Response.json({ errors: fulfillmentCounts?.errors }, { status: 200 })
  }

  // Prepend the keys to the formatted fulfillment counts
  const keys = Object.keys(Object.values(fulfillmentCounts?.countsData || {})[0])
  formattedFulfillmentCounts.unshift(keys)

  // Get existing values from the sheet and filter out existing orders
  const existingValues = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetTabName}!A1:A`
  })

  const requestValues = formattedFulfillmentCounts.filter((row: any) => {
    return !existingValues.data?.values?.some((existingRow: any) => existingRow[0] === row[0])
  })

  // Add the fulfillment counts to the Google Sheet
  if (requestValues?.length > 0) {
    const startingRow = existingValues.data?.values?.length ? existingValues.data?.values?.length + 1 : 1
    console.log(`Appending to ${sheetTabName}!A${startingRow}:${String.fromCharCode(64 + requestValues[0].length)}`)
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${sheetTabName}!A${startingRow}:${String.fromCharCode(64 + requestValues[0].length)}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: requestValues
      }
    })
    result.added = requestValues
  } else {
    // Remove the first row of keys from the formatted fulfillment counts
    const dataWithoutKeys = formattedFulfillmentCounts.slice(1)

    // If there are no new orders to add to the sheet, then update the sheet with the fulfillment counts data (excluding the first row of keys)
    const firstItemId = dataWithoutKeys[0][0]
    const startingRow = existingValues.data?.values && existingValues.data?.values?.findIndex((row: any) => row?.[0] === firstItemId) + 1
    console.log(`Updating ${sheetTabName}!A${startingRow}:${String.fromCharCode(64 + dataWithoutKeys[0].length)}`)
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${sheetTabName}!A${startingRow}:${String.fromCharCode(64 + dataWithoutKeys[0].length)}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: dataWithoutKeys
      }
    })
    result.updated = dataWithoutKeys
  }

  return Response.json(result)
}
