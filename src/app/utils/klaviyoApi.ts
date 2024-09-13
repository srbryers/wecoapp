'use server'
const API_KEY = process.env.KLAVIYO_API_KEY
const API_REVISION = process.env.KLAVIYO_REVISION || '2024-02-15'

interface KlaviyoRequest {
  method: string
  path: string
  body?: any
}

export async function klaviyoApi(request: KlaviyoRequest) {

  const headers = new Headers();
        headers.append("Content-Type", "application/json");
        headers.append("Authorization", `Klaviyo-API-Key ${API_KEY}`);
        headers.append("Revision", API_REVISION);
  
  const requestOptions = {
    method: request.method,
    headers: headers,
    body: JSON.stringify(request.body),
  } as any

  console.log("requestoptions", requestOptions)

  const result = await fetch(`https://a.klaviyo.com/api${request.path}`, requestOptions)
    .then(async (response) => {
      if (response.status === 200) {
        return response.json()
      } else if (response.status === 202) {
        return { status: response.status, message: response.statusText }
      } else {
        const json = await response.json()
        console.error(`Error fetching Klaviyo data`,{ error: response.statusText, status: response.status, body: json.errors })
        return { status: response.status, errors: json.errors }
      }
    })
    .then((data) => {
      return data
    })
    .catch((error) => console.error(error));

  return result

}