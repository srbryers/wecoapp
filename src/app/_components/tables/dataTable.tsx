import { FC } from 'react'

type DataTableProps = {
  children: React.ReactNode
  className?: string
}

const DataTable: FC<DataTableProps> = ({ children, className }) => {
  return (
    <table className={`${className || ""} overflow-scroll mt-4`}>
      {children}
    </table>
  )
}

export default DataTable
