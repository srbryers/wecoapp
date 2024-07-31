import { FC } from 'react'

type DataTableRowProps = {
  children: React.ReactNode
  className?: string
}

const DataTableRow: FC<DataTableRowProps> = ({ children, className }) => {
  return (
    <tr className={`${className || ""}`}>
      {children}
    </tr>
  )
}

export default DataTableRow
