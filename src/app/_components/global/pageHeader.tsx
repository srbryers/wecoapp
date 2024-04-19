import { FC } from 'react'

type PageHeaderProps = {
  title: string
  description: string
}

const PageHeader: FC<PageHeaderProps> = ({ title, description }) => {
  return (
    <header className="flex flex-col gap-2 mb-4 pb-4 border-b border-gray-950">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p>{description}</p>
    </header>
  )
}

export default PageHeader