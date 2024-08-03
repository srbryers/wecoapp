import { FC } from 'react'

type DataTableHeadersProps = {
  children: React.ReactNode
  colSpan?: number
  className?: string
}

const DataTableHeaders: FC<DataTableHeadersProps> = ({ children, colSpan, className }) => {
  return (
    <th className={`${className || ""} p-2 shadow-[inset_0_0px_0_0.5px] shadow-gray-700 font-bold`}  colSpan={colSpan}>
      {children}
    </th>
  )
}

export default DataTableHeaders
