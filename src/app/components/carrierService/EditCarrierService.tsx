"use client"

import { shopify } from "@/app/actions/shopify"
import Button from "@/app/components/Button"
import Form from "@/app/components/forms/Form"
import Input from "@/app/components/forms/Input"
import { formatKeyToTitle } from "@/app/utils/helpers"
import { CarrierService } from "@/app/utils/types"
import { useState } from "react"
import { Code } from "../Code"

export default function EditCarrierService({ carrierService }: { carrierService: CarrierService }) {

  const [loading, setLoading] = useState<boolean>(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<any>(null)

  return (
    <div className="flex flex-col w-full gap-6">
      <Form onSubmit={async (form) => {

        setLoading(true)
        setError(null)
        setResult(null)

        console.log("submit carrier service", form)
        try {
          if (carrierService?.id) {
            form.id = carrierService.id.split("/").pop()
            const result = await shopify.carrierServices.update(form)
            setResult(result)
          } else {
            const result = await shopify.carrierServices.create(form)
            setResult(result)
          }
        } catch (e) {
          setError(e)
        } finally {
          setLoading(false)
        }
      }} className="max-w-sm flex flex-col w-full mt-4">
        <Input label="Name" type="text" placeholder="Name" name="name" required defaultValue={carrierService?.name} />
        <Input label="Callback URL" type="text" placeholder="Callback URL" name="callback_url" required defaultValue={carrierService?.callbackUrl} />
        <Input label="Format" type="hidden" placeholder="Format" name="format" value="json" readOnly />
        <div className="checkboxes flex flex-row flex-wrap gap-3">
          {Object.entries(carrierService || {}).map(([key, value], index) => {
            if (typeof value === 'boolean') {
              return (
                <div key={`input-${index}`} className="flex flex-row items-center gap-2 w-full">
                  <Input
                    label={formatKeyToTitle(key)}
                    type="checkbox"
                    name={key}
                    defaultChecked={value}
                  />
                </div>
              )
            }
          })}
        </div>
        <Button label={`${carrierService ? "Update" : "Create"} Carrier Service`} type="submit" disabled={loading} />
        {loading && <div>Loading...</div>}
        {error && <div>Error: {error}</div>}
      </Form>
      <div className="flex flex-col w-full">
        {result && <Code value={result} />}
      </div>
    </div>
  )
}