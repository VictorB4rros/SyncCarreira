/**
 * @file SupportPage.jsx
 * @description Central de Suporte do SyncCarreira.
 *
 * Orienta os diferentes perfis sobre como obter ajuda. Conteúdo genérico,
 * a ser ajustado com os canais reais da instituição antes de produção.
 */

import InstitutionalLayout from './InstitutionalLayout.jsx'

export default function SupportPage() {
  return (
    <InstitutionalLayout eyebrow="Central de ajuda" title="Suporte" updatedAt="outubro de 2026">
      <section className="inst-section">
        <p>
          Reunimos aqui as formas mais rápidas de resolver dúvidas e problemas de acesso ao
          SyncCarreira. Antes de abrir um chamado, veja se a sua dúvida já está respondida abaixo.
        </p>
      </section>

      <section className="inst-section">
        <h2>Problemas de acesso</h2>
        <ul>
          <li>Esqueceu a senha ou o link de primeiro acesso expirou? Procure a coordenação da sua instituição.</li>
          <li>Seu perfil não aparece corretamente (aluno, psicóloga ou administrador)? Avise o administrador da plataforma.</li>
        </ul>
      </section>

      <section className="inst-section">
        <h2>Dúvidas sobre a jornada</h2>
        <p>
          Se você é estudante e tem dúvidas sobre as trilhas, as sínteses ou o resultado das áreas
          sugeridas, converse com a psicóloga/orientadora responsável pela sua turma. O SyncCarreira
          é um apoio à reflexão, e a conversa com a equipe faz parte do processo.
        </p>
      </section>

      <section className="inst-section">
        <h2>Suporte técnico</h2>
        <p>
          Para erros na plataforma (telas que não carregam, mensagens inesperadas), registre o
          ocorrido com o máximo de detalhes possível (o que você fez, o que apareceu na tela).
        </p>
      </section>

      <div className="inst-contact">
        Fale com o suporte em{' '}
        <a href="mailto:suporte@synccarreira.com">suporte@synccarreira.com</a>.
      </div>
    </InstitutionalLayout>
  )
}
