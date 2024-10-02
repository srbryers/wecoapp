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

  console.log("requestoptions", requestOptions)

  const result = await fetch(`https://cigotracker.com/api/v1/${request.path}`, requestOptions)
    .then(async (response) => {
      if (response.status === 200) {
        return response.json()
      } else if (response.status === 202) {
        return { status: response.status, message: response.statusText }
      } else {
        const json = await response.json()
        console.error(`Error fetching CIGO data`,{ error: response.statusText, status: response.status, body: json })
        return { status: response.status, errors: json }
      }
    })
    .then((data) => {
      return data
    })
    .catch((error) => console.error(error));

  return result

}