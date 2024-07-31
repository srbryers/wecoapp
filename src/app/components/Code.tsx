interface CodeProps {
  value: any
  className?: string
}

export function Code(props: CodeProps) {
  return (
    <div className={`flex flex-col w-full ${props.className || ''}`}>
      <pre className="w-full break-all p-4 bg-gray-800">{JSON.stringify(props.value, null, 2)}</pre>
    </div>
  )
}