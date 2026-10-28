import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getStudentById } from '../../services/studentService'
import './StudentPages.css'

export default function StudentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    getStudentById(id)
      .then((res) => { if (active) setStudent(res.data) })
      .catch((err) => {
        console.error('Erro ao buscar aluno:', err)
        if (active) setError('Não foi possível carregar os dados do aluno.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  if (loading) {
    return <div className="student-state" role="status">Carregando dados do aluno…</div>
  }

  if (error) {
    return (
      <div className="student-state student-state--error" role="alert">
        <p>{error}</p>
        <button type="button" className="student-page__back" onClick={() => navigate('/alunos')}>
          ← Voltar para a lista
        </button>
      </div>
    )
  }

  if (!student) return null

  return (
    <div className="student-page">
      <button type="button" className="student-page__back" onClick={() => navigate('/alunos')}>
        ← Voltar para a lista
      </button>

      <p className="student-page__eyebrow">Detalhes do aluno</p>
      <h1>{student.name}</h1>
      <p className="student-page__email">{student.email}</p>

      <section className="student-card" aria-label="Dados acadêmicos">
        <h2>Dados acadêmicos</h2>
        <dl className="student-info-grid">
          <div>
            <dt>Ano escolar</dt>
            <dd>{student.schollarYear ?? 'Não informado'}</dd>
          </div>
          <div>
            <dt>Tipo de escola</dt>
            <dd>{student.schoolType ?? 'Não informado'}</dd>
          </div>
        </dl>
      </section>

      <section className="student-card" aria-label="Perfis de acesso">
        <h2>Perfis de acesso</h2>
        {student.roles?.length ? (
          <div className="student-roles">
            {student.roles.map((role) => (
              <span key={role.id} className="student-role-chip">{role.authority}</span>
            ))}
          </div>
        ) : (
          <p className="student-page__email">Nenhum perfil atribuído.</p>
        )}
      </section>

      <div className="student-form__actions">
        <button
          type="button"
          className="student-btn-primary"
          onClick={() => navigate(`/alunos/${id}/editar`)}
        >
          Editar aluno
        </button>
      </div>
    </div>
  )
}
