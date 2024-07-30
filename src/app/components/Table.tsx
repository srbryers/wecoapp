interface TableProps {
  columns: number
  data: {
    [key:string]: string 
  }[]
}

export default function Table(props: TableProps) {
  return (
    <>
      {props.data.map((row, index) => (
        <div key={index} className="grid auto-rows-auto gap-2 w-full">
          {Object.entries(row).map(([key, value], index) => (
            <div key={index} className="grid grid-cols-2"> 
              <div className="font-bold">{key}</div>
              <div>{`${value}`}</div>
            </div>
          ))}
        </div>
      ))}
    </>
  )
}