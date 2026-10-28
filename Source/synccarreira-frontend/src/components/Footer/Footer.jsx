/**
 * @file Footer.jsx
 * @description Componente de rodapé reutilizável do SyncCarreira.
 *
 * Substitui os footers duplicados nas páginas de Login e Cadastro.
 * Para usar em uma página, basta importar e renderizar:
 *
 * @example
 * import Footer from '../../components/Footer/Footer.jsx'
 * // dentro do JSX:
 * <Footer />
 */

import { Link } from 'react-router-dom'
import './Footer.css'

/**
 * Footer
 * Rodapé padrão com copyright e links institucionais.
 * Não recebe props — o conteúdo é fixo e centralizado aqui.
 *
 * @returns {JSX.Element}
 */
export default function Footer() {
  return (
    <footer className="sc-footer">
      <span className="sc-footer__copy">
        © {new Date().getFullYear()} SyncCarreira. Todos os direitos reservados.
      </span>

      <nav className="sc-footer__links" aria-label="Links institucionais">
        <Link to="/privacidade">Privacidade</Link>
        <Link to="/termos">Termos de Uso</Link>
        <Link to="/suporte">Suporte</Link>
      </nav>
    </footer>
  )
}