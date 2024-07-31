import { FC } from 'react'

type ButtonProps = {
  label: string | React.ReactNode
  type?: 'button' | 'submit' | 'reset'
  buttonType?: 'primary' | 'secondary'
  disabled?: boolean
  onClick?: () => void
  className?: string
  loading?: boolean
}

const Button: FC<ButtonProps> = ({ label, type, buttonType, disabled, onClick, className, loading }) => {
  let buttonClasses = 'p-2 px-4 bg-blue-900 text-white rounded-[4px] font-bold'
  switch (buttonType) {
    case 'primary':
      buttonClasses = 'p-2 px-4 bg-blue-900 text-white rounded-[4px] text-sm font-bold'
      break
    case 'secondary':
      buttonClasses = 'p-2 px-4 bg-white text-blue-950 rounded-[4px] text-sm font-bold'
      break
    default:
      break
  }
  let disabledClasses = 'opacity-50 pointer-events-none'

  return (
    <button 
      className={`${className || ""} ${buttonClasses} ${disabled ? disabledClasses : ""}`} 
      onClick={onClick} 
      type={type}
      disabled={disabled || loading}
      >
      {loading ? 'Loading...' : label}
    </button>
  )
}

export default Button