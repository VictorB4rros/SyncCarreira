/**
 * @file Modal.jsx
 * @description Modal simples e acessível (fecha com ESC ou clique no fundo).
 */

import { useEffect } from 'react'

export default function Modal({ title, subtitle, onClose, children, footer, busy = false, wide = false }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape' && !busy) onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, busy])

  return (
    <div
      className="ag-modal__backdrop"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onClose() }}
    >
      <div
        className={`ag-modal${wide ? ' ag-modal--wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ag-modal-title"
      >
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
    </div>
  )
}