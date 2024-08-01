interface TableProps {
  columns: number
  data: {
    [key:string]: string 
  }[]
}

export default function Table(props: TableProps) {
  return (
    <>
      {props?.data?.map((row, index) => (
        <div key={index} className="grid auto-rows-auto gap-2 w-full">
          {Object.entries(row).map(([key, value], index) => (
            <div key={index} className="flex flex-row gap-4"> 
              <div className="font-bold min-w-[150px]">{key}</div>
              <div className="flex-1">{`${value}`}</div>
            </div>
          ))}
        </div>
      )) || <></>}
    </>
  )
}