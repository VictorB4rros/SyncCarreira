/**
 * @file TermsPage.jsx
 * @description Termos de Uso do SyncCarreira.
 *
 * Conteúdo genérico, orientado ao propósito educacional da plataforma.
 * Deve ser revisado pela coordenação/jurídico antes de produção.
 */

import InstitutionalLayout from './InstitutionalLayout.jsx'

export default function TermsPage() {
  return (
    <InstitutionalLayout eyebrow="Documento institucional" title="Termos de Uso" updatedAt="outubro de 2026">
      <section className="inst-section">
        <p>
          Ao acessar o SyncCarreira, você concorda com estes termos. A plataforma é uma
          ferramenta de apoio educacional à orientação de carreira e não substitui o
          acompanhamento profissional de psicólogos e orientadores.
        </p>
      </section>

      <section className="inst-section">
        <h2>Uso da plataforma</h2>
        <ul>
          <li>O acesso é individual e vinculado ao perfil liberado pela instituição de ensino.</li>
          <li>É responsabilidade do usuário manter a confidencialidade das suas credenciais.</li>
          <li>O conteúdo das trilhas e sugestões de carreira tem caráter informativo e reflexivo.</li>
        </ul>
      </section>

      <section className="inst-section">
        <h2>Resultados e sugestões</h2>
        <p>
          As áreas e carreiras sugeridas são geradas a partir das respostas do próprio estudante
          e podem mudar ao longo do tempo. Elas servem como ponto de partida para a reflexão e
          para conversas com a equipe de orientação, não como decisão definitiva.
        </p>
      </section>

      <section className="inst-section">
        <h2>Conduta</h2>
        <p>
          Não é permitido usar a plataforma para fins ilícitos, compartilhar dados de outros
          usuários ou tentar burlar os controles de acesso por perfil.
        </p>
      </section>

      <div className="inst-contact">
        Precisa de esclarecimentos sobre estes termos? Escreva para{' '}
        <a href="mailto:contato@synccarreira.com">contato@synccarreira.com</a>.
      </div>
    </InstitutionalLayout>
  )
}
