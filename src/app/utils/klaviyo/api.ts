
export type ProfileFilters = { key: string, value: string, operator: string }[] | undefined

export const klaviyo = {
  /**
   * Profiles
   */
  profiles: {
    get: async (fields?: string[], filters?: ProfileFilters) => {
      console.log("getProfiles, filters", filters)
      const requestedFields = fields?.join(",")
      let path = `profiles?sort=created&page[size]=100${fields ? '&fields[profile]='+requestedFields : ''}`

      if (filters && filters.length > 0) {
        path += `&filter=`
        filters.forEach((filter, index) => {
          path += `${filter.operator}(${filter.key},${filter.value})${index < (filters.length - 1) ? ',' : ''}`
        })
      }

      console.log("path", path)
      const result = await fetch('/api/klaviyo', {
        method: 'POST',
        body: JSON.stringify({
          method: 'GET',
          path: path
        })
      })
      const data = await result.json()
      return data
    }
  }
}