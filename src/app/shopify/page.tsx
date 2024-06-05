'use client'
import { FC } from 'react'
import PageLayout from '../_components/layout/page'
import Divider from '../_components/global/divider'
import FulfillmentServices from '../_components/shopify/fulfillmentServices'
import CarrierServices from '../_components/shopify/carrierServices'
import ShippingProfiles from '../_components/shopify/shippingProfiles'

const ShopifyPage: FC = () => {

  return (
    <PageLayout title="Shopify">
      <div className="flex flex-col flex-wrap gap-4 w-full">
        {/* Fulfillment Services */}
        <FulfillmentServices />
        <Divider />
        {/* Carrier Services */}
        <CarrierServices />
        <Divider />
        {/* Shipping Profiles */}
        <ShippingProfiles />
        <Divider />
      </div>
    </PageLayout>
  )
}

export default ShopifyPage