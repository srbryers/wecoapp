import React from "react"

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout(props: LayoutProps) {
  return (
    <div className={`flex flex-col h-full p-8`}>
      {props.children}
    </div>
  )
}