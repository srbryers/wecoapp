import { FC, Suspense } from 'react'
import Divider from '@/app/components/Divider'
import CarrierServices from '@/app/components/carrierService/CarrierServices'
import { shopify } from '@/app/actions/shopify'

const ShopifyPage: FC = async () => {

  const carrierServices = await shopify.carrierServices.get()

  return (
    <div className="flex flex-col flex-wrap gap-4 w-full">
      {/* Carrier Services */}
      <CarrierServices carrierServices={carrierServices} />
      <Divider />
      {/* Shipping Profiles */}
      {/* <Suspense fallback={<div>Loading...</div>}> */}
        {/* <ShippingProfiles /> */}
      {/* </Suspense> */}
      <Divider />
    </div>
  )
}

export default ShopifyPage