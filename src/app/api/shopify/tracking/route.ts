/**
 * A route to handle tracking from the Weco website and push it to Google Tag Manager
 * and the firestore database
 */
export async function POST(request: Request) {
  const trackingData = await request.json()
  console.log('Tracking Data:', trackingData)

  // Interpret the tracking data and send it to Google Tag Manager
  

  return new Response('Tracking Data Received', {
    status: 200
  })
}
