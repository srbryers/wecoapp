'use server'
const API_USERNAME = process.env.CIGO_API_USERNAME
const API_PASSWORD = process.env.CIGO_API_PASSWORD

interface KlaviyoRequest {
  method: string
  path: string
  body?: any
}

export async function cigoApi(request: KlaviyoRequest) {

  const authorization = Buffer.from(`${API_USERNAME}:${API_PASSWORD}`).toString('base64')

  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("Authorization", `Basic ${authorization}`);

  const requestOptions = {
    method: request.method,
    headers: headers,
    body: JSON.stringify(request.body),
  } as any

  const result = await fetch(`https://cigotracker.com/api/v1/${request.path}`, requestOptions)
    .then(async (response) => {
      // If method is DELETE, then we don't need to return the body
      if (request.method === 'DELETE') {
        return { status: response.status, message: response.statusText }
      } else if (response.status === 200) {
        if (response.body) {
          return response.json()
        } else {
          return { status: response.status, message: response.statusText }
        }
      } else if (response.status === 202) {
        return { status: response.status, message: response.statusText }
      } else {
        const json = await response.json()
        console.error(`[cigoApi] Error fetching CIGO data`,{ error: json.error })
        return { status: response.status, error: json.error }
      }
    })
    .then((data) => {
      return data
    })
    .catch((error) => console.error(error));

  return result

}