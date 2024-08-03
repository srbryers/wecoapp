'use client'

import Link from "next/link"
import DataTable from "../tables/DataTable"
import DataTableCell from "../tables/DataTableCell"
import DataTableHeaders from "../tables/DataTableHeaders"
import DataTableRow from "../tables/DataTableRow"
import { LoopResponse, LoopSubscription } from "@/app/utils/types"
import { klaviyo } from "@/app/actions/klaviyo"
import { loop } from "@/app/actions/loop"
import { calculateAvailableDeliveryDates } from "@/app/utils/helpers"
import { getShipmentZone } from "@/app/utils/carrierServices"
import { useParams, usePathname, useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"
import Input from "../forms/Input"
import { useEffect, useRef, useState } from "react"
import Button from "../Button"

interface LoopSubscriptionsProps {
  subscriptions: LoopSubscription[]
  pageInfo?: LoopResponse["pageInfo"]
}
type LoopSubscriptionAction = "sendUpcomingSubscriptionEmail" | "updateKlaviyoProfile"
interface LoopSubscriptionActions {
  [key: string]: any
}

const subscriptionActions: LoopSubscriptionActions = {
  sendUpcomingSubscriptionEmail: async (data: any) => {

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
  },
  updateKlaviyoProfile: async (data: any, updateSessionToken?: boolean) => {

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
  },
  getItemData: (item: LoopSubscription, additionalData?: boolean) => {
    // Get the order details
    const nextBillingDate = new Date(0)
    nextBillingDate.setUTCSeconds(item.nextBillingDateEpoch)
    const lastOrder = item.sortedOrders?.[0]
    const lastOrderDeliveryDate = new Date(lastOrder?.note_attributes?.find((attr: any) => attr.name === "Delivery Date")?.value)
    const nextOrderDeliveryDate = new Date(lastOrderDeliveryDate)
    nextOrderDeliveryDate.setDate(nextOrderDeliveryDate.getDate() + 7)

    const data = {
      "Check": "",
      "Email": lastOrder?.email,
      "First Name": item.shippingAddress.firstName,
      "Last Name": item.shippingAddress.lastName,
      "Subscription ID": item.id,
      "Customer ID": item.customer.id,
      "Next Billing Date": item.nextBillingDateEpoch && `${nextBillingDate.toLocaleDateString()} ${nextBillingDate.toLocaleTimeString()}`,
      "Delivery Frequency": `${item.deliveryPolicy.intervalCount} ${item.deliveryPolicy.interval}`,
      "State": item.shippingAddress.provinceCode,
      "Zip": item.shippingAddress.zip.split("-")[0],
      "Last Order ID": <a href={`https://e97e57-2.myshopify.com/admin/orders/${lastOrder?.id}`} target="_blank">{lastOrder?.name}</a>,
      "Last Order Date": lastOrder?.created_at,
      "Last Order Delivery Date": lastOrderDeliveryDate?.toLocaleDateString(),
      "Next Order Delivery Date": nextOrderDeliveryDate?.toLocaleDateString()
    }
    if (!additionalData) {
      return data
    } else {
      return {
        ...item,
        ...data,
        lastOrder
      }
    }
  }
}

async function bulkActions(items: LoopSubscription[], action: LoopSubscriptionAction, updateSessionToken?: boolean) {
  for (let i = 0; i < items.length; i++) {
    const data = subscriptionActions.getItemData(items[i], true)
    console.log("[bulkActions] running: ",action)
    subscriptionActions[action](data, updateSessionToken)
  }
}

export default function LoopSubscriptions({ subscriptions, pageInfo }: LoopSubscriptionsProps) {

  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const page = params.get("page")

  if (!page) {
    router.push(pathname + "?page=1")
  } 

  // Handle selecting all checkboxes
  const [selectedItems, setSelectedItems] = useState<LoopSubscription["id"][]>([])
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<LoopSubscription[]>([])

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const allItems = subscriptions.map(item => `${item.id}`)
    if (selectedItems.length === allItems.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(allItems)
    }
  }
  const handleItemSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newSelectedItems
    if (!selectedItems.includes(e.target.value) && e.target.checked) {
      newSelectedItems = [
        ...selectedItems,
        e.target.value
      ]
    } else {
      newSelectedItems = selectedItems.filter(item => item !== e.target.value)
    }
    setSelectedItems(newSelectedItems)
  }

  // Monitor the selectedItems update and update the selected Subscriptions
  useEffect(() => {
    const newSubscriptions = subscriptions.filter(subscription => selectedItems.includes(`${subscription.id}`))
    setSelectedSubscriptions(newSubscriptions)
  }, [selectedItems])

  const tableData = subscriptions?.sort(
    (a, b) => a.nextBillingDateEpoch - b.nextBillingDateEpoch
  ).map((item) => {
    return subscriptionActions.getItemData(item)
  })
  const tableHeaders = subscriptions?.length > 0 ? Object.keys(tableData[0]) : []

  return (
    <div className="max-w-full">
      <div className="header flex flex-row">
        {/* Actions */}
        <div className="flex flex-row gap-4 flex-1">
          <Button
            label="Send Email"
            className="text-sm"
            disabled={selectedItems.length < 1}
            onClick={() => bulkActions(selectedSubscriptions, "sendUpcomingSubscriptionEmail")}
          />
          <Button
            label="Update Profile"
            className="text-sm"
            disabled={selectedItems.length < 1}
            onClick={() =>  bulkActions(selectedSubscriptions, "updateKlaviyoProfile", true)}
          />
        </div>
      </div>
      {/* Table */}
      <div className="table-wrapper w-full overflow-scroll max-h-[600px] mt-4">
        <DataTable className="relative !mt-0">
          <thead>
            <tr>
              {tableHeaders.map((header, index) => {
                return (
                  <DataTableHeaders 
                    key={`header-${index}`} 
                    className={`text-left sticky top-0 text-sm bg-gray-950 z-10
                      ${header === "Actions" ? "right-0" : ""}
                      ${header === "Check" ? "left-0 z-20 text-center" : ""}
                      `}
                    >
                    {header === 'Check' ?
                    (
                      <Input 
                        type="checkbox"
                        checked={selectedItems.length === subscriptions.length}
                        onChange={handleSelectAll}
                      />
                    )
                    : header}
                  </DataTableHeaders>
                )
              })}
            </tr>
          </thead>
          <tbody className="overflow-scroll">
            {tableData?.map((data) => {
              const dataValues = Object.entries(data)
              return (
                <DataTableRow key={`${dataValues[1]}`}>
                  {dataValues.map(([key, value], index) => {
                    return (
                      <DataTableCell 
                        key={`${key}-${index}`} 
                        className={`text-sm whitespace-nowrap bg-gray-900
                          ${key === "Actions" ? "sticky right-0" : ""}
                          ${key === "Check" ? "sticky left-0 text-center" : ""}
                          `}
                        >
                        {key === 'Customer ID' ? (
                          <Link href={`customers/${value}`}>{value}</Link>
                        ) 
                        : key === 'Check' ? (
                          <Input 
                            type="checkbox"
                            checked={selectedItems.includes(`${data['Subscription ID']}`)}
                            onChange={handleItemSelect}
                            value={data['Subscription ID']}
                          />
                        )
                        :
                        (
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
      {/* Pagination */}
      <div className="flex flex-row gap-4 justify-end items-center mt-4">
          {pageInfo?.hasPreviousPage && <Link href={`${pathname}?page=${parseInt(page as string) - 1}`}>
            <p className="bg-white text-gray-900 hover:bg-gray-300 transition-all duration-300 px-4 py-2 rounded-md font-bold text-xs">Previous</p>
          </Link>}
          {pageInfo?.hasNextPage && <Link href={`${pathname}?page=${parseInt(page as string) + 1}`}>
            <p className="bg-white text-gray-900 hover:bg-gray-300 transition-all duration-300 px-4 py-2 rounded-md font-bold text-xs">Next</p>
          </Link>}
        </div>
    </div>
  )
}