import { FC, Suspense } from 'react'
import PageLayout from '../_components/layout/page'
import Divider from '../_components/global/divider'
import FulfillmentServices from '../_components/shopify/fulfillmentServices'
import CarrierServices from '../_components/shopify/carrierServices'
import ShippingProfiles from '../_components/shopify/shippingProfiles'
import { shopify } from '../actions/shopify'

const ShopifyPage: FC = async () => {

  const carrierServices = await shopify.carrierServices.get()

  console.log('carrierServices', carrierServices)

  return (
    <div className="flex flex-col flex-wrap gap-4 w-full">
      {/* Carrier Services */}
      <CarrierServices carrierServices={carrierServices} />
      <Divider />
      {/* Shipping Profiles */}
      <Suspense fallback={<div>Loading...</div>}>
        {/* <ShippingProfiles /> */}
      </Suspense>
      <Divider />
    </div>
  )
}

export default ShopifyPage