'use client'

import Link from "next/link"
import DataTable from "../tables/DataTable"
import DataTableCell from "../tables/DataTableCell"
import DataTableHeaders from "../tables/DataTableHeaders"
import DataTableRow from "../tables/DataTableRow"
import { LoopResponse, LoopSubscription } from "@/app/utils/types"
import { delay } from "@/app/utils/helpers"
import { usePathname, useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"
import Input from "../forms/Input"
import { useEffect, useState } from "react"
import Button from "../Button"
import { subscriptions } from "@/app/actions/subscriptions"

interface LoopSubscriptionsProps {
  subscriptions: LoopSubscription[]
  pageInfo?: LoopResponse["pageInfo"]
}

function getItemData(data: LoopSubscription) {
  return {
    "Check": "",
    "Email": data?.email,
    "First Name": data.shippingAddress.firstName,
    "Last Name": data.shippingAddress.lastName,
    "Subscription ID": data.id,
    "Customer ID": data.customer.id,
    "Next Billing Date": data.nextBillingDateEpoch ? new Date(data.nextBillingDateEpoch * 1000).toLocaleString() : "",
    "Delivery Frequency": `${data.deliveryPolicy.intervalCount} ${data.deliveryPolicy.interval}`,
    "State": data.shippingAddress.provinceCode,
    "Zip": data.shippingAddress.zip.split("-")[0],
    "Last Order ID": <a href={`https://e97e57-2.myshopify.com/admin/orders/${data.lastOrder?.id}`} target="_blank">{data.lastOrder?.name}</a>,
    "Last Order Date": data.lastOrder?.created_at,
    "Last Order Delivery Date": data.lastOrderDeliveryDate,
    "Next Order Delivery Date": data.nextOrderDeliveryDate
  }
}

async function bulkActions(items: LoopSubscription[], action: string, updateSessionToken?: boolean) {
  for (let i = 0; i < items.length; i++) {
    console.log("[bulkActions] running: ",action)
    await subscriptions.actions[action](items[i], updateSessionToken)
    // Wait 500ms between each call
    await delay(500)
  }
}

export default function LoopSubscriptions({ subscriptions, pageInfo }: LoopSubscriptionsProps) {

  // console.log("subscriptions", subscriptions)

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
  }, [selectedItems, subscriptions])

  const tableData = subscriptions?.sort(
    (a, b) => a.nextBillingDateEpoch - b.nextBillingDateEpoch
  ).map((item) => {
    return getItemData(item)
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
                <DataTableRow key={`${data['Subscription ID']}`}>
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
                          <Link href={`customers/${value}`}>{value as string}</Link>
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