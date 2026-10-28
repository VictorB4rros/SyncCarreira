import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { downloadClassReport, getPsychologistPanel } from '../../services/psychologistPanelService.js'
import './PsychologistClassesPage.css'

function getInitials(name) {
  return (name || 'Turma')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase()
}

function summarizeClasses(students) {
  const groups = new Map()

  students.forEach(student => {
    if (!student.schoolClassName) return
    const key = student.schoolClassId ?? `name:${student.schoolClassName}`
    const group = groups.get(key) ?? {
      id: student.schoolClassId ?? null,
      name: student.schoolClassName,
      students: [],
    }
    group.students.push(student)
    groups.set(key, group)
  })

  return [...groups.values()]
    .map(group => {
      const progress = group.students.reduce((total, student) => total + Number(student.progressPercentage || 0), 0)
      return {
        ...group,
        total: group.students.length,
        concluded: group.students.filter(student => student.journeyStatus === 'CONCLUIDA').length,
        inProgress: group.students.filter(student => student.journeyStatus === 'EM_ANDAMENTO').length,
        notStarted: group.students.filter(student => student.journeyStatus === 'NAO_INICIADA').length,
        inDoubt: group.students.filter(student => student.inDoubt).length,
        progress: group.students.length ? Math.round(progress / group.students.length) : 0,
      }
    })
    .sort((first, second) => first.name.localeCompare(second.name, 'pt-BR'))
}

function ClassCard({ group, busy, onOpen, onDownload }) {
  return (
    <article className="psy-class-card">
      <header className="psy-class-card__header">
        <span className="psy-class-card__mark" aria-hidden="true">{getInitials(group.name)}</span>
        <div className="psy-class-card__identity">
          <span className="psy-class-card__eyebrow">TURMA</span>
          <h2>{group.name}</h2>
          <p>{group.total} {group.total === 1 ? 'aluno vinculado' : 'alunos vinculados'}</p>
        </div>
        {group.inDoubt > 0 && <span className="psy-class-card__alert">{group.inDoubt} em dúvida</span>}
      </header>

      <div className="psy-class-card__progress">
        <div><span>Progresso médio</span><strong>{group.progress}%</strong></div>
        <div className="psy-class-card__track" aria-label={`Progresso médio de ${group.progress}%`}>
          <span style={{ width: `${group.progress}%` }} />
        </div>
      </div>

      <div className="psy-class-card__stats">
        <span><strong>{group.concluded}</strong> concluíram</span>
        <span><strong>{group.inProgress}</strong> em andamento</span>
        {group.notStarted > 0 && <span><strong>{group.notStarted}</strong> não iniciaram</span>}
      </div>

      <footer className="psy-class-card__actions">
        <button type="button" className="psy-class-card__secondary" onClick={() => onDownload(group)} disabled={!group.id || busy}>
          {busy ? 'Gerando…' : 'Exportar relatório (.xlsx)'}
        </button>
        <button type="button" className="psy-class-card__primary" onClick={() => onOpen(group.name)}>
          Ver alunos
        </button>
      </footer>
    </article>
  )
}

export default function PsychologistClassesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [panel, setPanel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [busyClassId, setBusyClassId] = useState(null)
  const [downloadError, setDownloadError] = useState('')
  const [downloadMessage, setDownloadMessage] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    if (!user?.id) {
      setLoading(false)
      return undefined
    }

    setLoading(true)
    setError('')
    getPsychologistPanel(user.id)
      .then(data => { if (active) setPanel(data) })
      .catch(loadError => { if (active) setError(loadError.message || 'Não foi possível carregar as turmas.') })
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
  }, [user?.id, attempt])

  const classes = useMemo(() => summarizeClasses(panel?.students ?? []), [panel])
  const filteredClasses = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('pt-BR')
    return classes.filter(group => group.name.toLocaleLowerCase('pt-BR').includes(normalized))
  }, [classes, query])

  function openStudents(className) {
    navigate(`/psicologa?busca=${encodeURIComponent(className)}#pd-students`)
  }

  async function handleDownload(group) {
    setBusyClassId(group.id)
    setDownloadError('')
    setDownloadMessage('')
    try {
      const fileName = await downloadClassReport(user.id, group.id, group.name)
      setDownloadMessage(`Download iniciado: ${fileName}`)
    } catch (downloadFailure) {
      setDownloadError(downloadFailure.message || 'Não foi possível gerar o relatório da turma.')
    } finally {
      setBusyClassId(null)
    }
  }

  const unassignedCount = (panel?.students ?? []).filter(student => !student.schoolClassName).length

  return (
    <div className="psy-classes-page">
      <header className="psy-classes-hero">
        <div>
          <span className="psy-classes-eyebrow">GESTÃO PEDAGÓGICA</span>
          <h1>Visão geral das turmas</h1>
          <p>Acompanhe o andamento das jornadas e encontre rapidamente os alunos de cada turma.</p>
        </div>
        <div className="psy-classes-total">
          <span>Turmas acompanhadas</span>
          <strong>{loading ? '—' : classes.length}</strong>
          <small>{panel?.totalStudents ?? 0} alunos no painel</small>
        </div>
      </header>

      <section className="psy-classes-toolbar" aria-label="Filtros de turma">
        <label className="psy-classes-search">
          <span className="psy-sr-only">Buscar turma</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar por turma..." />
        </label>
        {unassignedCount > 0 && <span className="psy-unassigned-note">{unassignedCount} {unassignedCount === 1 ? 'aluno sem turma' : 'alunos sem turma'}</span>}
      </section>

      {downloadMessage && <p className="psy-classes-success" role="status">{downloadMessage}</p>}
      {downloadError && <p className="psy-classes-error" role="alert">{downloadError}</p>}
      {loading && <div className="psy-classes-state" role="status">Carregando turmas…</div>}
      {!loading && error && (
        <div className="psy-classes-state psy-classes-state--error" role="alert">
          <strong>Não foi possível carregar as turmas</strong>
          <span>{error}</span>
          <button type="button" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button>
        </div>
      )}
      {!loading && !error && filteredClasses.length > 0 && (
        <section className="psy-class-grid" aria-label="Turmas">
          {filteredClasses.map(group => (
            <ClassCard
              key={group.id ?? group.name}
              group={group}
              busy={busyClassId === group.id}
              onOpen={openStudents}
              onDownload={handleDownload}
            />
          ))}
        </section>
      )}
      {!loading && !error && filteredClasses.length === 0 && (
        <div className="psy-classes-state">
          {classes.length ? 'Nenhuma turma corresponde à busca.' : 'Não há alunos vinculados a turmas para exibir.'}
        </div>
      )}
    </div>
  )
}
