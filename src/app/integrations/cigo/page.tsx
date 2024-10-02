'use client'

import { cigo, CigoJobCreate } from "@/app/actions/cigo"
import { shopify } from "@/app/actions/shopify"
import Button from "@/app/components/Button"
import Divider from "@/app/components/Divider"
import Input from "@/app/components/forms/Input"
import { Order } from "@/app/utils/types"
import { useState } from "react"

export default function CigoPage() {

  const [action, setAction] = useState<string | null>(null)
  const [input, setInput] = useState<any>(null)
  const [result, setResult] = useState<any>(null)
  const [running, setRunning] = useState<boolean>(false)

  const actions = {
    "Search Jobs": async (data: any) => {
      setRunning(true)
      setResult("Loading...")
      const res = await cigo.jobs.search({
        start_date: data.start_date,
        end_date: data.end_date,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone_number: data.phone_number,
        mobile_number: data.mobile_number,
      })
      setResult(res)
      setRunning(false)
    },
    "Create Job": async (request: {
      orderId?: string,
      orderNames?: string,
      deliveryDate?: string,
      skip_staging?: boolean
      count?: number
    }) => {
      setRunning(true)
      setResult("Loading...")
      const res = {
        errors: [] as { name: string, error: any }[],
        success: [] as { name: string, job: CigoJobCreate }[]
      }
      console.log("[Create Job] deliveryDate", request.deliveryDate)
      let orderId = request.orderId;
      let orders: Order[] = []
      const orderNames = request.orderNames?.includes(',') ? request.orderNames?.split(',') : request.orderNames?.split('\n')
      const orderNamesQuery = orderNames?.map((name) => `name:'${name}'`).join(' OR ')

      if (!request.orderId && request.orderNames) {
        orders = (await shopify.orders.list(`query: "${orderNamesQuery}"`))?.orders?.nodes
      }

      console.log("[Create Job] orders", orders)
      // For testing, only use the first 10 orders
      orders = orders?.slice(0, request.count ?? 10)

      for (const order of orders ?? []) {
        let orderDeliveryDates = order.lineItems?.nodes?.map((item) => {
          // Check if variant_title is in YYYY-MM-DD format
          if (item.variant?.title?.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return item.variant?.title
          }
        })

        if (request.deliveryDate) {
          orderDeliveryDates = orderDeliveryDates?.filter((date: string | undefined) => date === request?.deliveryDate)
        }

        // Unique the orderDeliveryDates
        const uniqueOrderDeliveryDates = orderDeliveryDates?.filter((date: string | undefined, index: number) => orderDeliveryDates?.indexOf(date) === index)

        for (const date of uniqueOrderDeliveryDates ?? []) {
          const dropoffNotes = order.customAttributes?.filter((note) => note.key.includes('Drop-off'))
          const quickDesc = dropoffNotes?.map((note, index) => {
            if (index === 0) {
              return `C:${note.value.slice(0, 1)}`
            } else if (index === 1) {
              return `DB:${note.value.slice(0, 1)}`
            } else {
              return ''
            }
          }).join(' ').trim()
          const shortOrderId = order.id?.toString().split("/").pop() ?? ""
          const fullAddress = order.shippingAddress?.address1 ? 
            `${order.shippingAddress?.address1 ?? ""} ${order.shippingAddress?.address2 ?? ""} ${order.shippingAddress?.city ?? ""} ${order.shippingAddress?.provinceCode ?? ""} ${order.shippingAddress?.zip?.slice(0, 5) ?? ""}`
            : `${order.billingAddress?.address1 ?? ""} ${order.billingAddress?.address2 ?? ""} ${order.billingAddress?.city ?? ""} ${order.billingAddress?.provinceCode ?? ""} ${order.billingAddress?.zip?.slice(0, 5) ?? ""}`

          const data = {
            date: date,
            first_name: (order.shippingAddress?.firstName || order.billingAddress?.firstName) ?? "",
            last_name: (order.shippingAddress?.lastName || order.billingAddress?.lastName) ?? "",
            email: order.email ?? "",
            phone_number: (order.customer?.phone || order.shippingAddress?.phone || order.billingAddress?.phone) ?? "",
            mobile_number: (order.customer?.phone || order.shippingAddress?.phone || order.billingAddress?.phone) ?? "",
            address: fullAddress,
            apartment: (order.shippingAddress?.address2 || order.billingAddress?.address2) ?? "",
            postal_code: (order.shippingAddress?.zip || order.billingAddress?.zip)?.slice(0, 5) ?? "",
            skip_staging: request.skip_staging ?? false,
            invoices: [
              `${shortOrderId ?? ""}-${date}`,
            ],
            reference_id: `${shortOrderId}-${date}`,
            quick_desc: quickDesc,
            actions: [
              {
                id: `${shortOrderId ?? ""}-${date}`,
                type: "Delivery",
                description: dropoffNotes?.map((note, index) => {
                  if (index === 0) {
                    return `C:${note.value}`
                  } else if (index === 1) {
                    return `DB:${note.value}`
                  } else {
                    return note.value
                  }
                }).join(', ') || "C:N, DB:N",
                invoice_number: `${shortOrderId ?? ""}-${date}`,
                quantity: 1,
              }
            ]
          } as CigoJobCreate
          console.log("================================================")
          console.log("[Create Job] creating job for order name: ", order.name, " with date: ", date)
          const cigoJob = await cigo.jobs.create(data)
          if (cigoJob.status !== 201) {
            console.log("[Create Job] error creating job for order name: ", order.name, " with date: ", date)
            res.errors.push({
              name: order.name ?? "",
              error: cigoJob
            })
          } else {
            res.success.push({
              name: order.name ?? "",
              job: cigoJob
            })
          }
        }
      }
      console.log("[Create Job] res", res)
      setResult(res)
      setRunning(false)
      return res
    },
    "Update Job": async (data: any) => {
      setRunning(true)
      setResult(null)
      const res = await cigo.jobs.update(data.id, data)
      setResult(res)
      setRunning(false)
    },
    "Get Job": async (data: any) => {
      setRunning(true)
      setResult(null)
      const res = await cigo.jobs.get(data.id)
      setResult(res)
      setRunning(false)
    },
    "Delete Job": async (data: any) => {
      setRunning(true)
      setResult(null)
      const res = await cigo.jobs.delete(data.id)
      setResult(res)
      setRunning(false)
    }
  } as { [key: string]: (data: any) => Promise<any> }

  const forms = {
    "Search Jobs": {
      fields: [
        { name: "start_date", label: "Start Date", type: "date" },
        { name: "end_date", label: "End Date", type: "date" },
        { name: "first_name", label: "First Name", type: "text" },
        { name: "last_name", label: "Last Name", type: "text" },
        { name: "email", label: "Email", type: "text" },
        { name: "phone_number", label: "Phone Number", type: "text" },
        { name: "mobile_number", label: "Mobile Number", type: "text" },
        { name: "address", label: "Address", type: "text" },
        { name: "apartment", label: "Apartment", type: "text" },
        { name: "postal_code", label: "Postal Code", type: "text" },
        { name: "city", label: "City", type: "text" },
        { name: "state", label: "State", type: "text" },
      ],
    },
    "Create Job": {
      fields: [
        { name: "orderId", label: "Shopify Order Id", type: "text" },
        { name: "orderNames", label: "Shopify Order Name", type: "textarea", description: "Enter the order names separated by commas or new lines." },
        { name: "skip_staging", label: "Skip Staging", type: "checkbox" },
        { name: "deliveryDate", label: "Delivery Date", type: "date" },
        { name: "count", label: "Count", type: "number", description: "Number of orders to create jobs for. Defaults to 10." },
      ],
    },
    "Get Job": {
      fields: [
        { name: "id", label: "Job Id", type: "text" },
      ],
    },
    "Delete Job": {
      fields: [
        { name: "id", label: "Job Id", type: "text" },
      ],
    },
  } as { [key: string]: { fields: { name: string, label: string, type: string, description?: string }[] } }



  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Cigo</h1>
      <p>Cigo is a job tracking system for local deliveries. Choose an action from the list below to get started.</p>
      <Divider />
      <div className="flex flex-row gap-4">
        {Object.keys(actions).map((action) => (
          <Button key={action} onClick={() => setAction(action)} label={action} disabled={!forms?.[action]} />
        ))}
      </div>
      <Divider />
      {action && forms?.[action] && (
        <>
          <div className="flex flex-col gap-4  max-w-md">
            <h1 className="text-xl font-bold">{action}</h1>
            <form className="flex flex-col gap-4">
              {forms?.[action]?.fields?.map((field) => (
                field.type === "textarea" ? (
                  <div className="flex flex-col gap-2" key={field.name}>
                    <label htmlFor={field.name} className="text-sm font-bold">{field.label}</label>
                    {field.description && <p className="text-xs text-gray-200">{field.description}</p>}
                    <textarea
                      name={field.name}
                      onChange={(e) => setInput({ ...input, [field.name]: e.target.value })}
                      className="p-2 rounded-md border border-gray-300 text-black"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2" key={field.name}>
                    <Input
                      key={field.name}
                      name={field.name}
                      label={field.label}
                      type={field.type}
                      description={field.description}
                      onChange={(e) => setInput({ ...input, [field.name]: e.target.value })}
                    />
                  </div>
                )
              ))}
            </form>
            <Button onClick={() => actions[action](input)} label={running ? "Running..." : "Run"} type="submit" disabled={running} />
          </div>
          <pre className="bg-gray-800 p-4 rounded-md overflow-auto max-h-96">{JSON.stringify(result, null, 2)}</pre>
        </>
      )}
    </div>
  )
}
