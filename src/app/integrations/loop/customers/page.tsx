import { loop } from "@/app/actions/loop"
import DataTable from "@/app/components/tables/DataTable"
import DataTableCell from "@/app/components/tables/DataTableCell"
import DataTableHeaders from "@/app/components/tables/DataTableHeaders"
import DataTableRow from "@/app/components/tables/DataTableRow"
import Link from "next/link"

export default async function Page() {

  const loopCustomers = await loop.customers.get()
  const tableHeaders = loopCustomers?.length > 0 ? Object.keys(loopCustomers[0]) : []

  console.log("loopCustomers", loopCustomers)

  return loopCustomers && (
    <div className="overflow-scroll max-w-full">
      {/* Table: Customers*/}
      <div className="table-wrapper w-full overflow-scroll">
        <DataTable>
          <thead>
            <tr>
              {tableHeaders.map((header, index) => {
                return (
                  <DataTableHeaders key={`header-${index}`} className="text-left sticky top-0">
                    {header}
                  </DataTableHeaders>
                )
              })}
            </tr>
          </thead>
          <tbody className="overflow-scroll max-h-[600px]">
            {loopCustomers.map((customer) => {
              const customerValues = Object.entries(customer)
              return (
                <DataTableRow key={customer.id}>
                  {customerValues.map(([key, value], index) => {
                    return (
                      <DataTableCell key={`${customer.id}-${index}`}>
                        {key === 'id' ? (
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