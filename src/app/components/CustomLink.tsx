import Link from "next/link";

interface CustomLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

export default function CustomLink(props: CustomLinkProps) {
  return (
    <Link className={`${props.className || ''} text-sm font-bold border-b inline-block`} {...props}>
      {props.children}
    </Link>
  )
}
