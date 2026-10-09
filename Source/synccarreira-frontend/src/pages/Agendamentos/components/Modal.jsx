/**
 * @file Modal.jsx
 * @description Modal acessível usando o elemento nativo <dialog>.
 *
 * - Fecha com ESC (tratado pelo próprio navegador via evento `cancel`)
 * - Fecha ao clicar fora: o fundo é um <button> nativo (acessível por mouse,
 *   teclado e toque), em vez de um <div> com onClick
 * - Mantém o foco dentro do modal enquanto aberto (showModal)
 */

import { useEffect, useRef } from 'react'

export default function Modal({ title, subtitle, onClose, children, footer, busy = false, wide = false }) {
  const dialogRef = useRef(null)

  // Abre como modal nativo (foco preso dentro + ESC) e trava o scroll da página
  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open && typeof dialog.showModal === 'function') {
      dialog.showModal()
    }
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
      if (dialog?.open) dialog.close()
    }
  }, [])

  // ESC dispara "cancel": deixamos o React decidir se pode fechar
  function handleCancel(e) {
    e.preventDefault()
    if (!busy) onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      className="ag-modal__dialog"
      aria-labelledby="ag-modal-title"
      onCancel={handleCancel}
    >
      <button
        type="button"
        className="ag-modal__scrim"
        aria-label="Fechar janela"
        tabIndex={-1}
        onClick={onClose}
        disabled={busy}
      />

      <div className={`ag-modal${wide ? ' ag-modal--wide' : ''}`}>
        <div className="ag-modal__head">
          <div>
            <h2 id="ag-modal-title" className="ag-modal__title">{title}</h2>
            {subtitle && <p className="ag-modal__sub">{subtitle}</p>}
          </div>
          <button
            type="button"
            className="ag-modal__close"
            onClick={onClose}
            disabled={busy}
            aria-label="Fechar"
          >×</button>
        </div>

        <div className="ag-modal__body">{children}</div>

        {footer && <div className="ag-modal__foot">{footer}</div>}
      </div>
    </dialog>
  )
}