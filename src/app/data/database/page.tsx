'use client'
import Form from '@/app/_components/forms/form'
import Input from '@/app/_components/forms/input'
import Button from '@/app/_components/global/button'
import Divider from '@/app/_components/global/divider'
import PageLayout from '@/app/_components/layout/page'
import DataTable from '@/app/_components/tables/dataTable'
import DataTableCell from '@/app/_components/tables/dataTableCell'
import DataTableHeaders from '@/app/_components/tables/dataTableHeaders'
import DataTableRow from '@/app/_components/tables/dataTableRow'
import { FC, useEffect, useState } from 'react'

const Database: FC = () => {

  const [customerData, setCustomerData] = useState<{}[]>()

  const addCustomer = async (data: any) => {
    console.log("data", data)
    await fetch("/api/database/customers", {
      method: "POST",
      body: JSON.stringify(data)
    }).then(async (response) => {
      console.log("response", await response.json())
    }).catch((error) => {
      console.error(error)
    })

  }

  useEffect(() => {

    const getCustomers = async () => {
      const data = await fetch("/api/database/customers", {
        method: "GET"
      }).then(async (response) => {
        return await response.json()
      }).catch((error) => {
        console.error(error)
      })
      setCustomerData(data)
      console.log("data", data)
    }

    getCustomers()
  }, [])

  return (
    <PageLayout title="Database">
      {/* Add a customer */}
      <div className="">
        <Form onSubmit={addCustomer}>
          <Input type="text" placeholder="Customer name" name="name" label="Name" />
          <Input type="email" placeholder="Customer email" name="email" label="Email" />
          <Button type="submit" buttonType="primary" label="Add Record" />
        </Form>
      </div>
      <Divider className="my-6" />
      {/* Database: Customer List */}
      {customerData && (
        <div className="flex flex-col gap-4">
          <h2>Customers</h2>
          <DataTable>
            <thead>
              <tr>
                {customerData.length > 0 && Object.keys(customerData[0]).map((key, rowIndex) => {
                  return (
                    <DataTableHeaders key={`header-${rowIndex}`}>{key}</DataTableHeaders>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {customerData.length > 0 && customerData.map((item, rowIndex) => {
                return (
                  <DataTableRow key={`'row-${rowIndex}`}>
                    {Object.values(item).map((value, fieldIndex) => {
                      return (
                        <DataTableCell key={`col-${rowIndex}${fieldIndex}`}>{value as string}</DataTableCell>
                      )
                    })}
                  </DataTableRow>
                )
              })}
            </tbody>
          </DataTable>
        </div>
      )}
    </PageLayout>
  )

}

export default Database