import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getStudentById, updateStudent } from '../../services/studentService'
import './StudentPages.css'

const SCHOOL_YEARS = [
  '1º Ano - Ensino Médio',
  '2º Ano - Ensino Médio',
  '3º Ano - Ensino Médio',
  'Outro',
]

const SCHOOL_TYPES = ['Pública', 'Privada']

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const EMPTY_FORM = { name: '', email: '', schollarYear: '', schoolType: '' }

export default function StudentFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    let active = true
    setLoading(true)
    getStudentById(id)
      .then((res) => {
        if (!active) return
        const data = res.data ?? {}
        setForm({
          name: data.name ?? '',
          email: data.email ?? '',
          // StudentDTO usa a grafia "schollarYear" (dois L) — mantida de propósito.
          schollarYear: data.schollarYear ?? '',
          schoolType: data.schoolType ?? '',
        })
      })
      .catch((err) => {
        console.error('Erro ao carregar aluno:', err)
        if (active) setError('Não foi possível carregar os dados do aluno.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }))
    setError(null)
  }

  /** Valida os campos. Retorna um mapa de erros por campo (vazio = válido). */
  function validate(values) {
    const errors = {}
    if (!values.name.trim()) {
      errors.name = 'Informe o nome do aluno.'
    }
    const email = values.email.trim()
    if (!email) {
      errors.email = 'Informe o e-mail do aluno.'
    } else if (!EMAIL_REGEX.test(email)) {
      errors.email = 'Informe um e-mail válido.'
    }
    return errors
  }

  function handleSubmit(event) {
    event.preventDefault()

    const errors = validate(form)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    // Monta o payload conforme StudentInsertDTO (sem id/roles/campos extras do StudentDTO).
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      schollarYear: form.schollarYear || null,
      schoolType: form.schoolType || null,
    }

    let active = true
    setSaving(true)
    setError(null)
    updateStudent(id, payload)
      .then(() => { if (active) navigate(`/alunos/${id}`) })
      .catch((err) => {
        console.error('Erro ao salvar aluno:', err)
        if (active) {
          const apiMessage = err.response?.data?.errors?.[0]?.message
            || err.response?.data?.error
            || err.response?.data?.message
          setError(apiMessage || 'Não foi possível salvar as alterações.')
        }
      })
      .finally(() => { if (active) setSaving(false) })
    return () => { active = false }
  }

  if (loading) {
    return <div className="student-state" role="status">Carregando dados do aluno…</div>
  }

  if (!form) {
    return (
      <div className="student-state student-state--error" role="alert">
        <p>{error ?? 'Aluno não encontrado.'}</p>
        <button type="button" className="student-page__back" onClick={() => navigate('/alunos')}>
          ← Voltar para a lista
        </button>
      </div>
    )
  }

  return (
    <div className="student-page">
      <button type="button" className="student-page__back" onClick={() => navigate(-1)}>
        ← Voltar
      </button>

      <p className="student-page__eyebrow">Gestão de alunos</p>
      <h1>Editar aluno</h1>

      <section className="student-card">
        {error && <p className="student-alert" role="alert">{error}</p>}

        <form className="student-form" onSubmit={handleSubmit} noValidate>
          <label>
            Nome completo
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.name)}
              autoFocus
            />
            {fieldErrors.name && <span className="student-field-error">{fieldErrors.name}</span>}
          </label>

          <label>
            E-mail
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.email)}
            />
            {fieldErrors.email && <span className="student-field-error">{fieldErrors.email}</span>}
          </label>

          <div className="student-form__row">
            <label>
              Ano escolar
              <select name="schollarYear" value={form.schollarYear} onChange={handleChange}>
                <option value="">Não informado</option>
                {SCHOOL_YEARS.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </label>

            <label>
              Tipo de escola
              <select name="schoolType" value={form.schoolType} onChange={handleChange}>
                <option value="">Não informado</option>
                {SCHOOL_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
          </div>

          <div className="student-form__actions">
            <button type="button" className="student-btn-secondary" onClick={() => navigate(-1)} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="student-btn-primary" disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
