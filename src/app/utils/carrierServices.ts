import { shopify } from "../actions/shopify";

interface ShipmentZoneRequest {
  destinationZip: string
  lineItems: any[]
  menuZones?: any
}

export async function getShipmentZone({ destinationZip, lineItems, menuZones }: ShipmentZoneRequest) {

  let isValidShipment = false;
  let menuZone: any = {}
  let shipmentZones: any = menuZones
  
  // console.log("[getShipmentZone] lineItems", lineItems)
  // console.log("[getShipmentZone] destinationZip", destinationZip)

  if (!shipmentZones) {
    console.log("[getShipmentZone] No shipment zones found, fetching from Shopify")
    shipmentZones = await shopify.metaobjects.get('menu_zone')
  }

  // Get the menu_zone metaobject
  const zipCodeFieldKey = 'zip_code_json'
  // Filter the line items to only include subscription items
  const subscriptionItems = lineItems.filter((item: any) => {
    if (item?.sellingPlan?.sellingPlanId) {
      return true
    } else if (item?.customAttributes) {
      return item.customAttributes.find((attribute: { key: string, value: string }) => attribute.key === '_bundleId' || attribute.key === '_bundleVariantId')
    } else if (Array.isArray(item.properties)) {
      // Convert item.properties array to an object
      return item.properties && item.properties.find((property: { name: string, value: string }) => property.name === '_bundleId' || property.name === '_bundleVariantId')
    } else {
      return item.properties && (item.properties._bundleId || item.properties._bundleVariantId)
    }
  })

  // Handle Zips that are missing a leading zero
  let formattedZip = destinationZip.length < 5 ? '0' + destinationZip : destinationZip
  formattedZip = formattedZip.slice(0, 5)

  // console.log("[getShipmentZone] formattedZip", formattedZip)

  // Loop through the zones and find the matching zone
  shipmentZones.forEach((shipmentZone: any) => {
    const shipment_menu_weeks = shipmentZone.fields.find((x: any) => x.key === 'menu_weeks')?.value
    const shipment_menu_type = shipmentZone.fields.find((x: any) => x.key === 'menu_type')?.value
    if (shipmentZone.handle?.includes('test') || shipmentZone.title?.includes('Deactivated') || shipmentZone.active === 'false') {
      // console.log("Deactivated menu zone", shipmentZone.handle)
      return;
    } else {
      const zipField = shipmentZone.fields.find((x: any) => x.key === zipCodeFieldKey)
      if (zipField) {
        const zipValues = JSON.parse(zipField.value).zips
        // Handle subscription items
        if (zipValues?.includes(formattedZip) && subscriptionItems.length > 0 && shipment_menu_type === "Subscription") {
          isValidShipment = true;
          menuZone = shipmentZone;
          return
        // Handle normal items
        } else if (zipValues?.includes(formattedZip) && shipment_menu_weeks && shipment_menu_type !== "Subscription") {
          isValidShipment = true;
          menuZone = shipmentZone;
          return
        }
      }
    }
  })

  // console.log("formattedZip", formattedZip)
  // console.log("menuZone", menuZone?.handle)
  // console.log("isValidShipment", isValidShipment)

  // console.log("[getShipmentZone] menuZone", menuZone?.handle)

  menuZone = menuZone?.fields?.reduce((acc: any, value: { key: string, value: string }) => {
    if (value.value) {
      // Parse the value values
      if (value?.value?.includes('[') || value?.value?.includes('{')) {
        acc[value.key] = JSON.parse(value.value)
      } else {
        acc[value.key] = value.value
      }
    }
    return acc
  }, {
    handle: menuZone.handle,
    title: menuZone.title
  }) 

  return {
    destinationZip: formattedZip,
    menuZone: menuZone,
    isValidShipment: isValidShipment
  }

}