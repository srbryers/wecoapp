'use client'
import { modalAtom } from '@/app/_utils/atoms'
import { useAtom } from 'jotai'
import { FC, useEffect } from 'react'

const Modal: FC = () => {
  
  const [modal, setModal] = useAtom(modalAtom)

  // Close modal on backdrop click
  const closeModal = () => {
    setModal(null)
  }

  useEffect(() => {
    window.addEventListener('click', (e) => {
      if (e.target === document.getElementById('modalBackdrop')) {
        closeModal()
      }
    })
  })

  return modal && (
    <div id="modalBackdrop" className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-50
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