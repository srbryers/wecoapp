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
    <div id="modalBackdrop" className={`fixed overflow-hidden inset-0 flex items-center justify-center bg-black bg-opacity-50
    ${modal.visible ? '' : 'hidden'}`}>
      <div className="bg-blue-950 p-8 rounded-lg">
        {modal.title && <h2 className="text-2xl font-bold">{modal.title}</h2>}
        {modal.description && <p>{modal.description}</p>}
        {modal.children}
      </div>
    </div>
  )
}

export default Modal