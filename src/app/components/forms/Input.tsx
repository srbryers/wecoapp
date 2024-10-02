'use client'
import { FC, useEffect, useState } from 'react'

type InputProps = {
  label?: string
  type: string
  name?: string
  checked?: boolean
  required?: boolean
  placeholder?: string
  value?: string
  defaultValue?: string
  defaultChecked?: boolean
  step?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  containerClassName?: string
  className?: string
  readOnly?: boolean
  description?: string
}

const Input: FC<InputProps> = ({ label, name, type, checked, required, placeholder, value, defaultValue, defaultChecked, onChange, description, ...props }) => {

  const [error, setError] = useState<string | undefined>()

  let inputContainerClasses = `flex flex-col gap-1 flex-1 ${props.containerClassName || ''}`
  let inputClasses = 'p-2 border border-black text-black rounded-[4px]'
  let labelClasses = 'text-sm font-bold'

  useEffect(() => {
    // when focus is lost, validate the input
    const input = document.querySelector(`input[name="${name}"]`) as HTMLInputElement
    input?.addEventListener('blur', () => {
      if (required && !input?.value) {
        setError(`${label} is required.`)
      }
    })
  },[ label, name, required ])

  switch (type) {
    case 'checkbox':
      inputContainerClasses = 'flex flex-row gap-2'
      inputClasses = 'order-0'
      labelClasses = 'order-1 text-sm font-bold capitalize'
      break
    case 'hidden':
      inputContainerClasses = 'hidden'
      break
    case 'text':
      break
    case 'email':
      break
    case 'password':
      break
    default:
      break
  }
  return (
    <div className={inputContainerClasses}>
      <label className={labelClasses}>
        {label}
        {required && <span className="text-red-600">*</span>}
      </label>
      {description && <p className="text-xs text-gray-200 mb-1">{description}</p>}
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={onChange}
        className={inputClasses}
        required={required}
        {...props}
      />
      {error && <span className="text-red-600 text-xs">{error}</span>}
    </div>
  )
}

export default Input