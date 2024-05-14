'use client'
import Form from '@/app/_components/forms/form'
import Input from '@/app/_components/forms/input'
import Button from '@/app/_components/global/button'
import PageLayout from '@/app/_components/layout/page'
import { FC } from 'react'

const Database: FC = () => {

  const addRecord = async (data: any) => {
    console.log("data", data)
    data.action = "add"
    data.docId = "test123"
    const newDoc = await fetch("/api/database", {
      method: "POST",
      body: JSON.stringify(data)
    }).then(async (response) => {
      console.log("response",await response.json())
    })
    
  }

  return (
    <PageLayout title="Database">
      {/* Add a database record */}
      <div className="">
        <Form onSubmit={addRecord}>
          <Input type="text" placeholder="Collection" name="collectionId" label="Collection" />
          <Input type="text" placeholder="Title of the record" name="title" label="Title" />
          <Button type="submit" buttonType="primary" label="Add Record" />
        </Form>
        
      </div>
    </PageLayout>
  )

}

export default Database