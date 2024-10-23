'use server'

import { delay } from "./helpers"
import JSONL from "jsonl-parse-stringify";

const accessToken = process.env.SHOPIFY_ACCESS_TOKEN || ''
const shop = process.env.SHOPIFY_SHOP_NAME || ''
const apiVersion = process.env.SHOPIFY_API_VERSION || '2024-07'

interface ShopifyApiRestRequest {
  method: string
  path: string
  body?: any
}

export async function shopifyAdminApiRest({ method, path, body }: ShopifyApiRestRequest) {

  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("X-Shopify-Access-Token", accessToken);

  const requestOptions = {
    method: method,
    headers: headers,
    cache: "no-store",
    body: JSON.stringify(body),
  } as any

  const result = await fetch(`https://${shop}.myshopify.com/admin/api/${apiVersion}/${path}`, requestOptions)
    .then((response) => {
      if (response.status === 200 || response.status === 201) {
        return response.json()
      } else {
        console.error(`Error fetching Shopify data`, { error: response.statusText, status: response.status })
      }
    })
    .then((data) => {
      // console.log("[shopifyApi.rest] data", data)
      return data
    })
    .catch((error) => console.error(error));

  return result
}

export async function shopifyAdminApiGql(request: any, variables?: any) {

  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("X-Shopify-Access-Token", accessToken);

  const requestBody = JSON.stringify({
    query: request,
    variables: variables
  })

  const requestOptions = {
    method: "POST",
    headers: headers,
    body: requestBody,
    cache: "no-store",
    redirect: "follow"
  } as any

  // console.log("requestBody", requestBody)

  const result = await fetch(`https://${shop}.myshopify.com/admin/api/${apiVersion}/graphql.json`, requestOptions)
    .then((response) => {
      console.log("[shopifyApi.graphQl] response", response.status, response.statusText)
      if (response.status === 200) {
        return response.json()
      } else {
        console.error(`Error fetching Shopify data`, { error: response.statusText, status: response.status })
      }
    })
    .then((data) => {
      // console.log("[shopifyApi.graphQl] data", data)
      if (data?.errors) {
        console.error("[shopifyApi.graphQl] errors", data?.errors)
      }
      return data
    })
    .catch((error) => console.error(error));

  return result?.data

}

export async function shopifyAdminApiGqlBulkOperation(query: string, variables?: any) {

  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("X-Shopify-Access-Token", accessToken);

  const requestBody = JSON.stringify({
    query: `
    mutation {
      bulkOperationRunQuery(
      query: """
        ${query}
        """
      ) {
        bulkOperation {
          id
          status
        }
        userErrors {
          field
          message
        }
      }
    }

    `
  })

  const requestOptions = {
    method: "POST",
    headers: headers,
    body: requestBody,
    redirect: "follow"
  } as any

  const result = await fetch(`https://${shop}.myshopify.com/admin/api/${apiVersion}/graphql.json`, requestOptions)
    .then((response) => {
      console.log("[shopifyApi.graphQl] response", response.status, response.statusText)
      if (response.status === 200) {
        return response.json()
      } else {
        console.error(`Error fetching Shopify data`, { error: response.statusText, status: response.status })
      }
    })
    .then((data) => {
      // console.log("[shopifyApi.graphQl] data", data)
      if (data?.errors) {
        console.error("[shopifyApi.graphQl] errors", data?.errors)
      }
      return data
    })
    .catch((error) => {
      console.error(error);
      throw error;
    });

  const getBulkOperationUrl = async (bulkOperationId: string, count: number = 0): Promise<{ url: string } | null> => {

    console.log("[shopifyAdminApiGqlBulkOperation] getBulkOperationUrl", bulkOperationId)

    const result = await fetch(`https://${shop}.myshopify.com/admin/api/${apiVersion}/graphql.json`, {
      method: "POST",
      cache: "no-store",
      headers: headers,
      body: JSON.stringify({
        query: `
          {
            node(id: "${bulkOperationId}") {
            ... on BulkOperation {
              id
              status
              errorCode
              createdAt
              completedAt
              objectCount
              fileSize
              url
              partialDataUrl
            }
            }
          }
      `
      }),
      redirect: "follow"
    }).then((response) => {
      // console.log("[shopifyAdminApiGqlBulkOperation] getBulkOperationResult", response.status, response.statusText)
      return response.json();
    }).then(async (data) => {
      console.log("[shopifyAdminApiGqlBulkOperation] getBulkOperationResult", data.data.node)
      if (data?.data?.node?.url) {
        console.log("[shopifyAdminApiGqlBulkOperation] getBulkOperationResult", data.data.node.url)
        return {
          url: data.data.node.url // URL is a JSONL file link that needs to be downloaded and parsed
        }
      } else {
        console.log(`[shopifyAdminApiGqlBulkOperation] not ready yet... polling ${count} of 10 times`)
        await delay(2500);
        count++
        if (count > 10) {
          console.error("[shopifyAdminApiGqlBulkOperation] max attempts reached")
          return null
        }
        return getBulkOperationUrl(data.data.node.id, count)
      }
    }).catch((error) => console.error(error))

    if (result) {
      return result
    } else {
      console.error("[shopifyAdminApiGqlBulkOperation] no result found")
      return null
    }

  }

  const url = await getBulkOperationUrl(result?.data?.bulkOperationRunQuery?.bulkOperation?.id)
  if (url) {
    // Get the JSONL file and parse the lines into JSON
    const lines = await fetch(url.url, {
      cache: "no-store"
    }).then(async (response) => {
      // Read the response stream as text into a string
      const text = await response.text()
      // console.log("[shopifyAdminApiGqlBulkOperation] lines", text)
      const json = JSONL.parse(text)
      // Group the json by the __parentId field if it exists (refers to the Order ID)
      const parents: any[] = json.filter((item: any) => !item.__parentId)
      const children: any[] = json.filter((item: any) => item.__parentId)
      const typeNames: string[] = children.map((child: any) => child.__typename)

      for (const child of children) {
        const parent = parents.find((parent: any) => parent.id === child.__parentId)
        const typeName = typeNames.find((typeName: string) => child.__typename.includes(typeName))
        if (parent && typeName) {
          // Uncapitalize the first letter of the type name and pluralize it
          const key = typeName.charAt(0).toLowerCase() + typeName.slice(1) + "s"
          if (!parent[key]) {
            parent[key] = { nodes: [child] }
          } else {
            parent[key].nodes.push(child)
          }
        }
      }
      return parents
    })
    return lines
  } else {
    console.error("[shopifyAdminApiGqlBulkOperation] no url found")
    return []
  }

}