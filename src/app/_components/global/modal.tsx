'use client'
import { modalAtom } from '@/app/_utils/atoms'
import { useAtom } from 'jotai'
import { FC, useEffect } from 'react'

const Modal: FC = () => {
  
  const [modal, setModal] = useAtom(modalAtom)

  // Close modal on backdrop click
  const closeModal = () => {
    modal?.onClose && modal.onClose()
    window.removeEventListener('click', () => {})
    setModal(null)
  }

  useEffect(() => {
    window.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      if (target.getAttribute('id') === 'modalBackdrop') {
        closeModal()
      }
    })
  })

  // Lock body scrolling when modal open
  useEffect(() => {
    if (modal?.visible) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
  }, [modal])

  return modal && (
    <div id="modalBackdrop" className={`z-10 fixed overflow-auto inset-0 flex flex-col items-center justify-start bg-black bg-opacity-50
    ${modal.visible ? '' : 'hidden'} p-8`}>
      <div className="flex-1"></div>
      <div className="bg-blue-950 p-8 rounded-lg">
        {modal.title && <h2 className="text-2xl font-bold">{modal.title}</h2>}
        {modal.description && <p>{modal.description}</p>}
        {modal.children}
      </div>
      <div className="flex-1"></div>
    </div>
  )
}

export default Modal