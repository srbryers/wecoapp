import { FC } from 'react'
import PageHeader from '../global/pageHeader'

type PageLayoutProps = {
  children: React.ReactNode
  title?: string
  description?: string
}

const PageLayout: FC<PageLayoutProps> = ({ children, title, description }) => {
  return (
    <div className="flex flex-col h-full p-8">
      <PageHeader 
        title={title || ""}
        description={description || ""} 
        />
      <div className="flex flex-col h-full items-start">{children}</div>
    </div>
  )
}

export default PageLayout