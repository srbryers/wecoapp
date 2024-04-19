import { FC, useState } from 'react'

type FormProps = {
  children: React.ReactNode
  className?: string
  onSubmit: (data: any) => void
}

const Form: FC<FormProps> = ({ children, className, onSubmit }) => {

  const [formErrors, setFormErrors] = useState<string[]>([])

  const submitForm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const values: any[] = []
    for (const el in e.currentTarget.elements) {
      const element = e.currentTarget.elements[el] as HTMLInputElement
      // Handle required fields/errors
      if (element.required && !element.value) {
        setFormErrors([...formErrors, `${element.name} is required.`])
        return
      }
      // Handle values
      if (element.name
        && element.value
        && values.findIndex((v) => v[element.name] !== undefined) === -1) {
        if (element.type === 'checkbox') {
          values.push({
            [element.name]: element.checked
          })
        } else {
          values.push({
            [element.name]: element.value
          })
        }
      }
    }

    if (formErrors.length > 0) {
      console.error('Form errors:', formErrors)
      return
    }

    // Convert values to object
    const data = values.reduce((acc, val) => {
      return {
        ...acc,
        ...val
      }
    }, {})

    // Submit form
    onSubmit(data)
  }

  return (
    <form className={`${className || ""} flex flex-col gap-4`} onSubmit={submitForm}>
      {children}
      {formErrors.length > 0 && (
        <div className="flex flex-col gap-2">
          {formErrors.map((error, index) => (
            <span key={`error-${index}`} className="text-red-600 text-xs">{error}</span>
          ))}
        </div>
      )}
    </form>
  )
}

export default Form