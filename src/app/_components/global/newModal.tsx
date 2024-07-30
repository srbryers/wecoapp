interface ModalProps {
  title?: string,
  description?: string,
  children: any
}
export default function Modal (props: ModalProps) {

  return (
    <div id="modalBackdrop" className={`z-10 fixed overflow-auto inset-0 flex flex-col items-center justify-start bg-black bg-opacity-50 p-8`}>
      <div className="flex-1"></div>
      <div className="bg-blue-950 p-8 rounded-lg">
        {props.title && <h2 className="text-2xl font-bold">{props.title}</h2>}
        {props.description && <p>{props.description}</p>}
        {props.children}
      </div>
      <div className="flex-1"></div>
    </div>
  )
}