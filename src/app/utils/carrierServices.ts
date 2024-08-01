import { shopify } from "../actions/shopify";

interface ShipmentZoneRequest {
  destinationZip: string
  lineItems: any[]
}

export async function getShipmentZone({ destinationZip, lineItems }: ShipmentZoneRequest) {

  let isValidShipment = false;
  let menuZone: any = {}
  
  console.log("[getShipmentZone] lineItems", lineItems)

  // Get the menu_zone metaobject
  const shipmentZones = await shopify.metaobjects.get('menu_zone')
  const zipCodeFieldKey = 'zip_code_json'
  const subscriptionItems = lineItems.filter((item: any) => {
    // Convert item.properties array to an object
    if (Array.isArray(item.properties)) {
      return item.properties && item.properties.find((property: { name: string, value: string }) => property.name === '_bundleId')
    } else {
      return item.properties && item.properties._bundleId
    }
  })

  // Handle Zips that are missing a leading zero
  const formattedZip = destinationZip.length < 5 ? '0' + destinationZip : destinationZip

  // Loop through the zones and find the matching zone
  shipmentZones.forEach((shipmentZone: any) => {
    const shipment_menu_weeks = shipmentZone.fields.find((x: any) => x.key === 'menu_weeks')?.value
    const shipment_menu_type = shipmentZone.fields.find((x: any) => x.key === 'menu_type')?.value
    if (shipmentZone.handle.includes('test') || shipmentZone.handle.includes('Deactivated')) {
      return;
    } else {
      const zipField = shipmentZone.fields.find((x: any) => x.key === zipCodeFieldKey)
      if (zipField) {
        const zipValues = JSON.parse(zipField.value).zips
        // Handle subscription items
        if (zipValues.includes(formattedZip) && subscriptionItems.length > 0 && shipment_menu_type === "Subscription") {
          isValidShipment = true;
          menuZone = shipmentZone;
          return
        // Handle normal items
        } else if (zipValues.includes(formattedZip) && shipment_menu_weeks && shipment_menu_type !== "Subscription") {
          isValidShipment = true;
          menuZone = shipmentZone;
          return
        }
      }
    }
  })

  console.log("formattedZip", formattedZip)
  console.log("menuZone", menuZone.handle)
  console.log("isValidShipment", isValidShipment)

  return {
    destinationZip: formattedZip,
    menuZone: menuZone,
    isValidShipment: isValidShipment
  }

}