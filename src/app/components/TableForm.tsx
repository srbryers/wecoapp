'use client'

import { ChangeEvent, ChangeEventHandler, FormEvent, useEffect, useState } from "react"
import Button from "./Button"
import { shopify } from "../actions/shopify"

interface TableFormProps {
  id: string
  columns: number
  data: {
    [key: string]: any
  }
  action?: 'create' | 'update' | 'test'
  resource?: string
  path?: string
}

export default function TableForm(props: TableFormProps) {

  const [buttonText, setButtonText] = useState<string>('Save')
  const [formData, setFormData] = useState<TableFormProps["data"]>({})
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    switch (props.action) {
      case 'create':
        setButtonText('Confirm & Save')
        break
      case 'update':
        setButtonText('Save Changes')
        break
      case 'test':
        setButtonText('Execute Test')
        break
      default:
        console.error('Action not found.')
    }
  }, [props.action])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // Convert form data to object
    const data = new FormData(event.currentTarget)
    let values: any[] = []
    data.entries().forEach(([key, value]) => {
      // Only push values that have changed
      if (formData) {
        if (!formData[key] || props.data[key] === value) {
          return
        } else {
          values.push({ [key]: value })
        }
      }
    })
    if (values.length === 0) {
      console.log('No changes detected.')
      return
    } else {
      values = values.reduce((acc, val) => {
        return {
          ...acc,
          ...val
        }
      })
    }

    // Take action on the resource specified
    switch (props.resource) {
      case 'shopify':
        const res = await shopify[props.path][props.action]({
          id: props.id,
          ...values
        })
        console.log('res', res)
        if (res.errors) {
          setErrors(res.errors)
        }
        break
      default:
        console.error('Resource not found.')
    }
  }

  const handleInputChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const { name, value } = event.currentTarget
    if (props.data[name] == value) {
      // Set form data to null if value is the same
      const newFormData = { ...formData }
      console.log('newFormData', newFormData)
      delete newFormData[name]
      setFormData(newFormData)
    } else {
      setFormData({
        ...formData,
        [name]: value
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl">
      <div className="grid grid-rows-auto gap-2 w-full">
        {Object.entries(props.data).map(([key, value], index) => {

          console.log("value: ", value)
          
          return (
            <div key={index} className="flex gap-4 items-center w-full">
              <div className="font-bold min-w-[120px]">{key}</div>
              <div className="flex-1">
                <input
                  type="text"
                  className="p-2 px-3 text-black w-full rounded-md"
                  name={key}
                  defaultValue={value as string || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          )
        })}
      </div>
      {/* Actions */}
      <div className="form--actions flex flex-row flex-wrap mt-4 justify-end">
        <Button label={buttonText} type="submit" />
      </div>
      {/* Errors */}
      <div className="form--errors">
        {errors.length > 0 && (
          <div className="flex flex-col gap-2">
            {errors.map((error, index) => (
              <span key={`error-${index}`} className="text-red-600 text-xs">Error: {error}</span>
            ))}
          </div>
        )}
      </div>
    </form>
  )
}