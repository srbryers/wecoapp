export const shopify = {
  graphQl: async (request: any, variables: any) => {

    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN || ''
    const shop = process.env.SHOPIFY_SHOP_NAME || ''
    const apiVersion = process.env.SHOPIFY_API_VERSION || '2024-01'

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
      redirect: "follow"
    }

    const result = await fetch(`https://${shop}.myshopify.com/admin/api/${apiVersion}/graphql.json`, requestOptions)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        return data
      })
      .catch((error) => console.error(error));

    return result.data
  },
  metaobjects: async (type: string) => {
    const request = `
      query {
        metaobjects(type: "${type}", first: 50) {
          # MetaobjectConnection fields
          edges {
              node {
                  handle,
                  displayName,
                  fields {
                      key,
                      value
                  }
              }
          }
        }
      }
    `
    return (await shopify.graphQl(request)).metaobjects.edges.map(x => x.node)
  }
}