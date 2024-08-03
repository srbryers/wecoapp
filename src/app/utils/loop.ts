'use server'
const loopApiToken = process.env.LOOP_API_TOKEN || ''
const apiVersion = process.env.LOOP_API_VERSION || ''

interface LoopRequest {
  method: string
  path: string
  body?: any
}

export async function loopApi(request: LoopRequest) {

  const headers = new Headers();
        headers.append("Content-Type", "application/json");
        headers.append("X-Loop-Token", loopApiToken);
  
  const requestOptions = {
    method: request.method,
    headers: headers,
    body: JSON.stringify(request.body),
  } as any

  const result = await fetch(`https://api.loopsubscriptions.com/admin/${apiVersion}/${request.path}`, requestOptions)
    .then((response) => {
      if (response.status === 200) {
        return response.json()
      } else {
        console.error(`Error fetching Loop data`,{ error: response.statusText, status: response.status })
      }
    })
    .then((data) => {
      return data
    })
    .catch((error) => console.error(error));

  return result

}