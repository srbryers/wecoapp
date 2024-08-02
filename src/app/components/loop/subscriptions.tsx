'use client'

import Link from "next/link"
import DataTable from "../tables/DataTable"
import DataTableCell from "../tables/DataTableCell"
import DataTableHeaders from "../tables/DataTableHeaders"
import DataTableRow from "../tables/DataTableRow"
import { LoopSubscription } from "@/app/utils/types"
import { klaviyo } from "@/app/actions/klaviyo"
import { loop } from "@/app/actions/loop"
import { calculateAvailableDeliveryDates } from "@/app/utils/helpers"
import { getShipmentZone } from "@/app/utils/carrierServices"
import { useParams, usePathname, useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"

interface LoopSubscriptionsProps {
  subscriptions: LoopSubscription[]
}

async function sendUpcomingSubscriptionEmail(data: any) {

  let nextDeliveryDate = new Date(data["Next Order Delivery Date"])

  const nextBillingDate = new Date(0)
  nextBillingDate.setUTCSeconds(data.nextBillingDateEpoch)

  const menuZone = await getShipmentZone({
    destinationZip: data.shippingAddress.zip.split("-")[0],
    lineItems: data.lastOrder.line_items
  })
  if (menuZone) {
    const nextAvailableDeliveryDates = calculateAvailableDeliveryDates(menuZone.menuZone, nextBillingDate)
    if (!nextAvailableDeliveryDates.includes(data["Next Order Delivery Date"])) {
      nextDeliveryDate = new Date(nextAvailableDeliveryDates[0])
    }
  }

  // Set the hours for the delivery date
  nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 1)
  nextDeliveryDate.setHours(12)

  // Get the loop session token
  const sessionToken = await loop.customers.getSessionToken(data.customer.shopifyId)
  const loginUrl = `https://e97e57-2.myshopify.com/a/loop_subscriptions/customer/${data.customer.shopifyId}?sessionToken=${sessionToken?.sessionToken}`

  console.log("[sendUpcomingSubscriptionEmail] send email to customer", data.lastOrder.email)

  if (data.lastOrder) {
    const event = {
      data: {
        type: "event",
        attributes: {
          profile: {
            data: {
              type: "profile",
              attributes: {
                email: data.lastOrder.email,
                properties: {
                  "Next Billing Date": nextBillingDate,
                  "Next Billing Date (Display)": `${nextBillingDate.toLocaleDateString()}`,
                  "Next Billing Date (Time)": `${nextBillingDate.toLocaleTimeString()}`,
                  "Next Delivery Date": nextDeliveryDate,
                  "Next Delivery Date (Display)": `${nextDeliveryDate.toLocaleDateString()}`,
                  "Login URL": loginUrl
                }
              }
            }
          },
          metric: {
            data: {
              type: "metric",
              attributes: {
                name: "Upcoming Subscription"
              }
            }
          },
          properties: {
            "Next Billing Date": nextBillingDate,
            "Next Billing Date (Display)": `${nextBillingDate.toLocaleDateString()}`,
            "Next Billing Date (Time)": `${nextBillingDate.toLocaleTimeString()}`,
            "Next Delivery Date": nextDeliveryDate,
            "Next Delivery Date (Display)": `${nextDeliveryDate.toLocaleDateString()}`,
            "Login URL": loginUrl
          }
        }
      }
    }

    console.log("event", event)
    const triggerEvent = await klaviyo.events.create(event)

    console.log("triggerEvent", triggerEvent)
  } else {
    console.error("Customer not found")
  }
}

async function updateKlaviyoProfile(data: any, updateSessionToken?: boolean) {

  let nextDeliveryDate = new Date(data["Next Order Delivery Date"])

  const nextBillingDate = new Date(0)
  nextBillingDate.setUTCSeconds(data.nextBillingDateEpoch)

  const menuZone = await getShipmentZone({
    destinationZip: data.shippingAddress.zip.split("-")[0],
    lineItems: data.lastOrder.line_items
  })
  if (menuZone) {
    const nextAvailableDeliveryDates = calculateAvailableDeliveryDates(menuZone.menuZone, nextBillingDate)
    if (!nextAvailableDeliveryDates.includes(data["Next Order Delivery Date"])) {
      nextDeliveryDate = new Date(nextAvailableDeliveryDates[0])
    }
  }

  // Set the hours for the delivery date
  nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 1)
  nextDeliveryDate.setHours(12)

  const profile = {
    data: {
      type: "profile",
      attributes: {
        email: data.lastOrder.email,
        properties: {
          "Next Billing Date": nextBillingDate,
          "Next Billing Date (Display)": `${nextBillingDate.toLocaleDateString()}`,
          "Next Billing Date (Time)": `${nextBillingDate.toLocaleTimeString()}`,
          "Next Delivery Date": nextDeliveryDate,
          "Next Delivery Date (Display)": `${nextDeliveryDate.toLocaleDateString()}`,
        }
      }
    }
  } as any

  if (updateSessionToken) {
    const sessionToken = await loop.customers.getSessionToken(data.customer.shopifyId)
    profile.data.attributes.properties["Login URL"] = `https://e97e57-2.myshopify.com/a/loop_subscriptions/customer/${data.customer.shopifyId}?sessionToken=${sessionToken?.sessionToken}`
  }

  const updatedProfile = await klaviyo.profiles.createOrUpdate(profile)

  console.log("updatedProfile", updatedProfile)
}

export default function LoopSubscriptions({ subscriptions }: LoopSubscriptionsProps) {

  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const page = params.get("page")

  if (!page) {
    router.push(pathname + "?page=1")
  } 

  function ActionButton({ label, onClick }: {
    label: string
    onClick: () => void | Promise<void>
  }) {
    return (
      <button className="bg-white text-gray-900 hover:bg-gray-300 transition-all duration-300 px-4 py-2 rounded-md font-bold text-xs whitespace-nowrap" onClick={onClick}>{label}</button>
    )
  }

  const tableData = subscriptions?.sort(
    (a, b) => a.nextBillingDateEpoch - b.nextBillingDateEpoch
  ).map((item) => {

    // Get the order details
    const nextBillingDate = new Date(0)
    nextBillingDate.setUTCSeconds(item.nextBillingDateEpoch)
    const lastOrder = item.sortedOrders[0]
    const lastOrderDeliveryDate = new Date(lastOrder?.note_attributes?.find((attr: any) => attr.name === "Delivery Date")?.value)
    const nextOrderDeliveryDate = new Date(lastOrderDeliveryDate)
    nextOrderDeliveryDate.setDate(nextOrderDeliveryDate.getDate() + 7)

    const data = {
      "ID": item.id,
      "Customer ID": item.customer.id,
      "Email": lastOrder?.email,
      "First Name": item.shippingAddress.firstName,
      "Last Name": item.shippingAddress.lastName,
      "Next Billing Date": item.nextBillingDateEpoch && `${nextBillingDate.toLocaleDateString()} ${nextBillingDate.toLocaleTimeString()}`,
      "Delivery Frequency": `${item.deliveryPolicy.intervalCount} ${item.deliveryPolicy.interval}`,
      "State": item.shippingAddress.provinceCode,
      "Zip": item.shippingAddress.zip.split("-")[0],
      "Last Order ID": <a href={`https://e97e57-2.myshopify.com/admin/orders/${lastOrder?.id}`} target="_blank">{lastOrder?.name}</a>,
      "Last Order Date": lastOrder?.created_at,
      "Last Order Delivery Date": lastOrderDeliveryDate?.toLocaleDateString(),
      "Next Order Delivery Date": nextOrderDeliveryDate?.toLocaleDateString()
    }
    return {
      ...data,
      "Action": (
        <div className="flex flex-row gap-4">
          <ActionButton
            label="Send Email"
            onClick={() => sendUpcomingSubscriptionEmail({ ...item, ...data, lastOrder })}
          />
          <ActionButton
            label="Update Profile"
            onClick={() => updateKlaviyoProfile({ ...item, ...data, lastOrder }, true)}
          />
        </div>
      )
    }
  })
  const tableHeaders = subscriptions?.length > 0 ? Object.keys(tableData[0]) : []

  console.log("Loop Subscriptions", subscriptions.length)

  return (
    <div className="overflow-scroll max-w-full">
      {/* Pagination */}
      <div className="flex flex-row gap-4 justify-end items-center">
        <Link href={`${pathname}?page=${parseInt(page as string) - 1}`}>
          <p className="bg-white text-gray-900 hover:bg-gray-300 transition-all duration-300 px-4 py-2 rounded-md font-bold text-xs">Previous</p>
        </Link>
        <Link href={`${pathname}?page=${parseInt(page as string) + 1}`}>
          <p className="bg-white text-gray-900 hover:bg-gray-300 transition-all duration-300 px-4 py-2 rounded-md font-bold text-xs">Next</p>
        </Link>
      </div>
      {/* Table */}
      <div className="table-wrapper w-full overflow-scroll">
        <DataTable>
          <thead>
            <tr>
              {tableHeaders.map((header, index) => {
                return (
                  <DataTableHeaders key={`header-${index}`} className="text-left sticky top-0 text-sm">
                    {header}
                  </DataTableHeaders>
                )
              })}
            </tr>
          </thead>
          <tbody className="overflow-scroll max-h-[600px]">
            {tableData?.map((data) => {
              const dataValues = Object.entries(data)
              return (
                <DataTableRow key={data["ID"]}>
                  {dataValues.map(([key, value], index) => {
                    return (
                      <DataTableCell key={`${data["ID"]}-${index}`} className="text-sm">
                        {key === 'ID' ? (
                          <Link href={`customers/${value}`}>{value}</Link>
                        ) : (
                          <>{value}</>
                        )}
                      </DataTableCell>
                    )
                  })}
                </DataTableRow>
              )
            })}
          </tbody>
        </DataTable>
      </div>
    </div>
  )
}