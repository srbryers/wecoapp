"use client"

import { shopify } from "@/app/actions/shopify"
import Button from "@/app/components/Button"
import Form from "@/app/components/forms/Form"
import Input from "@/app/components/forms/Input"
import { formatKeyToTitle } from "@/app/utils/helpers"
import { CarrierService } from "@/app/utils/types"

export default function EditCarrierService({ carrierService }: { carrierService: CarrierService }) {

  return (
    <Form onSubmit={(form) => {

      console.log("submit carrier service", form)
      if (carrierService?.id) {
        form.id = carrierService.id
        shopify.carrierServices.update(form)
      } else {
        shopify.carrierServices.create(form)
      }
    }} className="max-w-sm mt-4">
      {/* <Input label="Name" type="text" placeholder="Name" name="name" required defaultValue={carrierService?.name} /> */}
      {/* <Input label="Callback URL" type="text" placeholder="Callback URL" name="callback_url" required defaultValue={carrierService?.callback_url} /> */}
      {/* <Input label="Format" type="hidden" placeholder="Format" name="format" value="json" readOnly /> */}
      <div className="checkboxes flex flex-row flex-wrap gap-3">
        {Object.entries(carrierService || {}).map(([key, value], index) => {
          if (typeof value === 'boolean') {
            return (
              <div className="flex flex-row items-center gap-2 w-full py-2">
                <Input
                  key={`input-${index}`}
                  label={formatKeyToTitle(key)}
                  type="checkbox"
                  name={key}
                  checked={value}
                />
              </div>
            )
          } else if (typeof value === 'string') {
            return (
              <Input
                key={`input-${index}`}
                label={formatKeyToTitle(key)}
                type="text"
                name={key}
                value={value}
              />
            )
          } else {
            return null
          }
        })}
      </div>
      <Button label={`${carrierService ? "Update" : "Create"} Carrier Service`} type="submit" />
    </Form>
  )
}