/**
 * @file PrivacyPage.jsx
 * @description Política de Privacidade do SyncCarreira.
 *
 * Conteúdo genérico, orientado ao propósito da plataforma (orientação de carreira
 * para estudantes). Deve ser revisado pela coordenação/jurídico antes de produção.
 */

import InstitutionalLayout from './InstitutionalLayout.jsx'

export default function PrivacyPage() {
  return (
    <InstitutionalLayout eyebrow="Documento institucional" title="Política de Privacidade" updatedAt="outubro de 2026">
      <section className="inst-section">
        <p>
          O SyncCarreira é uma plataforma de apoio à orientação profissional de estudantes.
          Esta política explica, de forma objetiva, quais dados tratamos e com qual finalidade.
        </p>
      </section>

      <section className="inst-section">
        <h2>Dados que coletamos</h2>
        <ul>
          <li>Dados de cadastro: nome, e-mail e perfil de acesso (aluno, psicóloga ou administrador).</li>
          <li>Dados acadêmicos: ano escolar, tipo de escola, turma e instituição vinculada.</li>
          <li>Respostas das trilhas de autoconhecimento e sínteses escritas pelo estudante.</li>
          <li>Registros de sessões de orientação e feedbacks associados.</li>
        </ul>
      </section>

      <section className="inst-section">
        <h2>Como usamos os dados</h2>
        <p>
          Os dados são usados exclusivamente para personalizar a jornada de autoconhecimento,
          gerar o leque de áreas e carreiras sugeridas e permitir o acompanhamento pela equipe
          de orientação da instituição. Não vendemos nem compartilhamos dados com terceiros
          para fins comerciais.
        </p>
      </section>

      <section className="inst-section">
        <h2>Seus direitos</h2>
        <p>
          O estudante (ou seu responsável) pode solicitar acesso, correção ou exclusão dos seus
          dados a qualquer momento, por meio da coordenação da instituição de ensino.
        </p>
      </section>

      <div className="inst-contact">
        Dúvidas sobre privacidade? Fale com a gente em{' '}
        <a href="mailto:privacidade@synccarreira.com">privacidade@synccarreira.com</a>.
      </div>
    </InstitutionalLayout>
  )
}
