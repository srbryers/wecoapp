const API_KEY = process.env.SHIPSTATION_API_KEY || ''
const API_SECRET = process.env.SHIPSTATION_API_SECRET || ''
const API_URL = 'https://ssapi.shipstation.com/'

interface ShipStationRequest {
  method: string
  path: string
  body?: any
}

export async function shipStationApi(request: ShipStationRequest) {

  const authorization = Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64')

  const headers = new Headers();
        headers.append("Content-Type", "application/json");
        headers.append("Authorization", `Basic ${authorization}`);
  
  const requestOptions = {
    method: request.method,
    headers: headers,
    body: JSON.stringify(request.body),
  } as any

  const result = await fetch(`${API_URL}/${request.path}`, requestOptions)
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      console.log("data", data)
      return data
    })
    .catch((error) => console.error(error));

  return result

}