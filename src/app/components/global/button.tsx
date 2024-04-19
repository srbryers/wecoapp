import { FC } from 'react'

type ButtonProps = {
  label: string | React.ReactNode
  type?: 'button' | 'submit' | 'reset'
  buttonType?: 'primary' | 'secondary'
  onClick?: () => void
  className?: string
}

const Button: FC<ButtonProps> = ({ label, type, buttonType, onClick, className }) => {
  let buttonClasses = 'p-2 px-4 bg-blue-900 text-white rounded-[4px] font-bold'
  switch (buttonType) {
    case 'primary':
      buttonClasses = 'p-2 px-4 bg-blue-900 text-white rounded-[4px]'
      break
    case 'secondary':
      buttonClasses = 'p-2 px-4 bg-white text-blue-950 rounded-[4px]'
      break
    default:
      break
  }

  return (
    <button className={`${className || ""} ${buttonClasses}`} onClick={onClick} type={type}>
      {label}
    </button>
  )
}

export default Button