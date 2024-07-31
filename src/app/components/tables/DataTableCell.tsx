import { FC } from 'react'

type DataTableCellProps = {
  children: React.ReactNode
  colSpan?: number
  className?: string
}

const DataTableCell: FC<DataTableCellProps> = ({ children, colSpan, className }) => {
  return (
    <td className={`${className || ""} p-2 overflow-scroll border border-gray-700`} colSpan={colSpan}>
      {children}
    </td>
  )
}

export default DataTableCell
