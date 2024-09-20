interface CodeProps {
  value: any
  className?: string
}

export function Code(props: CodeProps) {
  return (
    <div className={`flex flex-col w-full ${props.className || ''}`}>
      <pre className="w-full p-4 bg-gray-800 text-xs inline-block">{JSON.stringify(props.value, null, 2)}</pre>
    </div>
  )
}