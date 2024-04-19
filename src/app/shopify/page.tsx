'use client'
import { FC } from 'react'
import PageLayout from '../components/layout/page'
import Divider from '../components/global/divider'
import FulfillmentServices from '../components/shopify/fulfillmentServices'
import CarrierServices from '../components/shopify/carrierServices'

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
      </div>
    </PageLayout>
  )
}

export default ShopifyPage