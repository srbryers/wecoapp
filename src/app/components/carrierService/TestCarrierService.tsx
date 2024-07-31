'use client'

import { useState } from "react"
import { shopify } from "@/app/actions/shopify"
import { CarrierServiceRequest, ShippingProfile, CarrierService } from "@/app/utils/types"
import Input from "../forms/Input"
import Form from "../forms/Form"
import Button from "../Button"
import { Code } from "../Code"

interface TestCarrierServiceProps {
  carrierService: CarrierService
}

export default function TestCarrierService(props: TestCarrierServiceProps) {

  const [result, setResult] = useState<ShippingProfile[]>()
  const [loading, setLoading] = useState<boolean>(false)

  const handleSubmit = async (data: CarrierServiceRequest) => {
    setLoading(true)
    console.log("data", data)
    const res = await shopify.carrierServices.test(data)
    console.log("res", res)
    setResult(res)
    setLoading(false)
  }

  return (
    <div className="max-w-xl">
      <Form onSubmit={handleSubmit}>
        <div className="form--inputs flex flex-col gap-4">
          <Input 
            label="ID"
            value={`${props.carrierService.id}`}
            name="id"
            type="text"
            readOnly
          />
          <Input
            label="Name"
            value={`${props.carrierService.name}`}
            name="name"
            type="text"
            readOnly
          />
          <Input
            label="Shopify Order ID"
            name="shopify_order_id"
            type="text"
            required
          />
        </div>
        <div className="form--actions">
          <Button
            label="Execute Test"
            buttonType="primary"
            type="submit"
            loading={loading}
          />
        </div>
      </Form>
      {/* Result */}
      {result && <Code value={result} className="mt-6" />}
    </div>
  )
}