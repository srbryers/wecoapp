'use server'

const accessToken = process.env.SHOPIFY_ACCESS_TOKEN || ''
const shop = process.env.SHOPIFY_SHOP_NAME || ''
const apiVersion = process.env.SHOPIFY_API_VERSION || '2024-07'

export async function shopifyAdminApiRest (method: string, path: string, body?: any) {

  const headers = new Headers();
        headers.append("Content-Type", "application/json");
        headers.append("X-Shopify-Access-Token", accessToken);
  
  const requestOptions = {
    method: method,
    headers: headers,
    body: JSON.stringify(body),
  } as any

  const result = await fetch(`https://${shop}.myshopify.com/admin/api/${apiVersion}/${path}`, requestOptions)
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      // console.log("[shopifyApi.rest] data", data)
      return data
    })
    .catch((error) => console.error(error));

  return result
}

export async function shopifyAdminApiGql (request: any, variables?: any) {

  const headers = new Headers();
          headers.append("Content-Type", "application/json");
          headers.append("X-Shopify-Access-Token", accessToken);
    
    const requestBody = JSON.stringify({
      query: request, 
      variables: variables
    })

    console.log("shopify shop", shop)

    const requestOptions = {
      method: "POST",
      headers: headers,
      body: requestBody,
      redirect: "follow"
    } as any

    const result = await fetch(`https://${shop}.myshopify.com/admin/api/${apiVersion}/graphql.json`, requestOptions)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        // console.log("[shopifyApi.graphQl] data", data)
        return data
      })
      .catch((error) => console.error(error));

    return result?.data

}