'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FC } from 'react'

type NavigationProps = {
  links: {
    title: string
    href: string
  }[]
}

const Navigation: FC<NavigationProps> = ({ links }) => {

  const pathName = usePathname()

  return (
    <nav className="bg-gray-950 shadow-md flex flex-col">
      <h1 className="text-xl font-bold text-white p-4 py-6 mb-2">WECO App</h1>
      <ul className="flex flex-col">
        {links.map((link, index) => {
          const isActive = pathName === link.href
          return (
            <li key={`link-${index}`} className={`py-4 px-4 w-full ${isActive ? 'bg-blue-900' : ''}`}>
              <Link href={link.href} className="font-bold">{link.title}</Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default Navigation