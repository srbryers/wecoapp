'use client'

import { CarrierService } from "@/app/_utils/shopify/api"
import TableForm from "../TableForm"

interface TestCarrierServiceProps {
  carrierService: CarrierService
}

export default function TestCarrierService(props: TestCarrierServiceProps) {

  const formData = {
    id: props.carrierService.id,
    name: props.carrierService.name,
    shopify_order_id: ''
  }

  return (
    <div>
      <TableForm
          id={`${props.carrierService.id}`}
          columns={2}
          data={formData}
          action="test"
          resource="shopify"
          path="carrierServices"
        />
    </div>
  )
}