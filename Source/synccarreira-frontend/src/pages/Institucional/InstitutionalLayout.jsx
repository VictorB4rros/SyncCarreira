/**
 * @file InstitutionalLayout.jsx
 * @description Casca comum das páginas institucionais (Privacidade, Termos, Suporte).
 *
 * São páginas públicas, estáticas e de leitura. O conteúdo é passado via children;
 * o cabeçalho (marca + "voltar") e o rodapé são padronizados aqui.
 */

import { Link } from 'react-router-dom'
import Footer from '../../components/Footer/Footer.jsx'
import './InstitutionalPage.css'

export default function InstitutionalLayout({ eyebrow, title, updatedAt, children }) {
  return (
    <div className="inst-root">
      <header className="inst-header">
        <Link to="/login" className="inst-header__brand">SyncCarreira</Link>
        <Link to="/login" className="inst-header__back">← Voltar ao login</Link>
      </header>

      <main className="inst-main">
        {eyebrow && <p className="inst-eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {updatedAt && <p className="inst-updated">Última atualização: {updatedAt}</p>}
        {children}
      </main>

      <Footer />
    </div>
  )
}
