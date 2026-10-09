import { useEffect, useMemo, useState } from 'react'
import AppHeader from '../../components/AppHeader/AppHeader.jsx'
import {
    deleteManagedAccount,
    assignStudentToClass,
    createManagedClass,
    listActiveInstitutions,
    listManagedClasses,
    listManagedAccounts,
    saveManagedAccount,
} from '../../services/accountManagementService.js'
import './studentlistPage.css'

const EMPTY_STUDENT = { name: '', email: '', schollarYear: '', schoolType: '' }
const EMPTY_PSYCHOLOGIST = { name: '', email: '', crp: '', contractExpirationDate: '', institutionId: '' }
const EMPTY_CLASS = { name: '', schoolYear: '', institutionId: '' }
const SCHOOL_YEARS = [
    '1º Ano - Ensino Médio',
    '2º Ano - Ensino Médio',
    '3º Ano - Ensino Médio',
    'Outro',
]

const PROFILE_OPTIONS = [
    { id: 'aluno', label: 'Alunos' },
    { id: 'psicologa', label: 'Psicólogas' },
]

function displayDate(value) {
    if (!value) return 'Não informada'
    return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR')
}

function accountRequestError(error, fallback) {
    if (error.response?.status === 401) {
        return 'A API exige autenticação. A tela está aberta, mas os dados requerem um token com permissão para o perfil selecionado.'
    }
    if (error.response?.status === 403) {
        return 'A API negou esta operação. Turmas, psicólogas, instituições e alterações exigem ROLE_ADMIN; a listagem de alunos também permite ROLE_PSICOLOGA.'
    }
    return error.response?.data?.message || fallback
}

export default function AccountManagementPage() {
    const [managementView, setManagementView] = useState('usuarios')
    const [profile, setProfile] = useState('aluno')
    const [accounts, setAccounts] = useState([])
    const [classes, setClasses] = useState([])
    const [institutions, setInstitutions] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadingClasses, setLoadingClasses] = useState(false)
    const [loadingInstitutions, setLoadingInstitutions] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState(null)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [form, setForm] = useState(EMPTY_STUDENT)
    const [editingId, setEditingId] = useState(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [classModalOpen, setClassModalOpen] = useState(false)
    const [classForm, setClassForm] = useState(EMPTY_CLASS)
    const [assignmentModalOpen, setAssignmentModalOpen] = useState(false)
    const [assignmentStudent, setAssignmentStudent] = useState(null)
    const [assignmentClassId, setAssignmentClassId] = useState('')

    useEffect(() => {
        let current = true
        setLoading(true)
        setError('')
        listManagedAccounts(profile)
            .then(data => { if (current) setAccounts(data) })
            .catch(err => {
                console.error(`Erro ao carregar ${profile}:`, err)
                if (current) {
                    setAccounts([])
                    setError(accountRequestError(err, 'Não foi possível consultar a API. Verifique a conexão.'))
                }
            })
            .finally(() => { if (current) setLoading(false) })
        return () => { current = false }
    }, [profile])

    useEffect(() => {
        if (managementView !== 'turmas') return
        let current = true
        setLoadingClasses(true)
        listManagedClasses()
            .then(data => { if (current) setClasses(data) })
            .catch(err => {
                console.error('Erro ao carregar turmas:', err)
                if (current) setError(accountRequestError(err, 'Não foi possível consultar as turmas.'))
            })
            .finally(() => { if (current) setLoadingClasses(false) })
        return () => { current = false }
    }, [managementView])

    useEffect(() => {
        if (!(modalOpen && profile === 'psicologa') && !classModalOpen) return
        let current = true
        setLoadingInstitutions(true)
        listActiveInstitutions()
            .then(data => { if (current) setInstitutions(data) })
            .catch(err => {
                console.error('Erro ao carregar instituições:', err)
                if (current) setError(accountRequestError(err, 'Não foi possível carregar as instituições.'))
            })
            .finally(() => { if (current) setLoadingInstitutions(false) })
        return () => { current = false }
    }, [modalOpen, profile, classModalOpen])

    const filteredAccounts = useMemo(() => {
        const term = search.trim().toLocaleLowerCase('pt-BR')
        return accounts.filter(account =>
            !term || `${account.name} ${account.email} ${account.crp ?? ''}`.toLocaleLowerCase('pt-BR').includes(term)
        )
    }, [accounts, search])

    const filteredClasses = useMemo(() => {
        const term = search.trim().toLocaleLowerCase('pt-BR')
        return classes.filter(schoolClass =>
            !term || `${schoolClass.name} ${schoolClass.institutionName ?? ''}`.toLocaleLowerCase('pt-BR').includes(term)
        )
    }, [classes, search])

    function openCreate() {
        setEditingId(null)
        setForm(profile === 'aluno' ? EMPTY_STUDENT : EMPTY_PSYCHOLOGIST)
        setError('')
        setModalOpen(true)
    }

    function openEdit(account) {
        setEditingId(account.id)
        setForm(profile === 'aluno'
            ? {
                name: account.name ?? '',
                email: account.email ?? '',
                schollarYear: account.scholarYear ?? account.schollarYear ?? '',
                schoolType: account.schoolType ?? '',
            }
            : {
                name: account.name ?? '',
                email: account.email ?? '',
                crp: account.crp ?? '',
                contractExpirationDate: account.contractExpirationDate ?? '',
                institutionId: account.institutionId ? String(account.institutionId) : '',
            })
        setError('')
        setModalOpen(true)
    }

    async function handleSubmit(event) {
        event.preventDefault()
        setSaving(true)
        setError('')
        try {
            const saved = await saveManagedAccount(profile, form, editingId)
            setAccounts(current => editingId
                ? current.map(account => account.id === editingId ? saved : account)
                : [saved, ...current])
            setModalOpen(false)
        } catch (err) {
            console.error('Erro ao salvar usuário:', err)
            setError(accountRequestError(err, err.message || 'Não foi possível salvar os dados na API.'))
        } finally {
            setSaving(false)
        }
    }

    async function handleDeactivate(account) {
        const typeName = profile === 'aluno' ? 'aluno' : 'psicóloga'
        const confirmed = window.confirm(
            `Desativar ${account.name}? Pela regra definida, esta ação excluirá o cadastro da API permanentemente e não pode ser desfeita.`
        )
        if (!confirmed) return

        setDeletingId(account.id)
        setError('')
        try {
            await deleteManagedAccount(profile, account.id)
            setAccounts(current => current.filter(item => item.id !== account.id))
        } catch (err) {
            console.error(`Erro ao desativar ${typeName}:`, err)
            setError(accountRequestError(err, 'Não foi possível excluir o cadastro da API. Confira vínculos e permissões.'))
        } finally {
            setDeletingId(null)
        }
    }

    function updateForm(field, value) {
        setForm(current => ({ ...current, [field]: value }))
    }

    function openClassCreate() {
        setClassForm(EMPTY_CLASS)
        setError('')
        setClassModalOpen(true)
    }

    async function handleClassSubmit(event) {
        event.preventDefault()
        setSaving(true)
        setError('')
        try {
            const createdClass = await createManagedClass(classForm)
            setClasses(current => [createdClass, ...current])
            setClassModalOpen(false)
        } catch (err) {
            console.error('Erro ao criar turma:', err)
            setError(accountRequestError(err, 'Não foi possível criar a turma.'))
        } finally {
            setSaving(false)
        }
    }

    async function openStudentAssignment(student) {
        setAssignmentStudent(student)
        setAssignmentClassId('')
        setAssignmentModalOpen(true)
        setLoadingClasses(true)
        setError('')
        try {
            setClasses(await listManagedClasses())
        } catch (err) {
            console.error('Erro ao carregar turmas para associação:', err)
            setError(accountRequestError(err, 'Não foi possível carregar as turmas.'))
        } finally {
            setLoadingClasses(false)
        }
    }

    async function handleStudentAssignment(event) {
        event.preventDefault()
        if (!assignmentStudent || !assignmentClassId) return

        setSaving(true)
        setError('')
        try {
            await assignStudentToClass(assignmentStudent.id, Number(assignmentClassId))
            const selectedClass = classes.find(schoolClass => schoolClass.id === Number(assignmentClassId))
            setAccounts(current => current.map(account => account.id === assignmentStudent.id
                ? { ...account, className: selectedClass?.name, institutionName: selectedClass?.institutionName }
                : account))
            setAssignmentModalOpen(false)
        } catch (err) {
            console.error('Erro ao associar aluno à turma:', err)
            setError(accountRequestError(err, 'Não foi possível associar o aluno à turma.'))
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="students-page">
            <AppHeader />
            <main className="students-main">
                <div className="students-heading">
                    <div>
                        <p className="students-eyebrow">GESTÃO DE ACESSO</p>
                        <h1>{managementView === 'usuarios' ? 'Usuários' : 'Turmas'}</h1>
                        <p className="students-description">
                            {managementView === 'usuarios'
                                ? 'Gerencie os cadastros de alunos e psicólogas.'
                                : 'Turmas vinculadas às instituições cadastradas.'}
                        </p>
                    </div>
                    <button
                        className="students-primary"
                        type="button"
                        onClick={managementView === 'usuarios' ? openCreate : openClassCreate}
                    >
                        <span aria-hidden="true">+</span> {managementView === 'usuarios' ? 'Novo cadastro' : 'Nova turma'}
                    </button>
                </div>

                <div className="students-profile-switch" role="group" aria-label="Área de gestão">
                    <button
                        type="button"
                        className={managementView === 'usuarios' ? 'is-selected' : ''}
                        aria-pressed={managementView === 'usuarios'}
                        onClick={() => { setManagementView('usuarios'); setSearch('') }}
                    >
                        Usuários
                    </button>
                    <button
                        type="button"
                        className={managementView === 'turmas' ? 'is-selected' : ''}
                        aria-pressed={managementView === 'turmas'}
                        onClick={() => { setManagementView('turmas'); setSearch('') }}
                    >
                        Turmas
                    </button>
                </div>

                {managementView === 'usuarios' && (
                    <div className="students-profile-switch" role="group" aria-label="Perfil de usuário">
                        {PROFILE_OPTIONS.map(option => (
                        <button
                            key={option.id}
                            type="button"
                            className={profile === option.id ? 'is-selected' : ''}
                            aria-pressed={profile === option.id}
                            onClick={() => {
                                setProfile(option.id)
                                setSearch('')
                                setModalOpen(false)
                            }}
                        >
                            {option.label}
                        </button>
                        ))}
                    </div>
                )}

                <section className="students-summary" aria-label="Resumo dos cadastros">
                    <div><span>{managementView === 'usuarios' ? 'Cadastros encontrados' : 'Turmas cadastradas'}</span><strong>{managementView === 'usuarios' ? accounts.length : classes.length}</strong></div>
                    <div><span>{managementView === 'usuarios' ? 'Perfil selecionado' : 'Ano escolar'}</span><strong>{managementView === 'usuarios' ? (profile === 'aluno' ? 'Aluno' : 'Psicóloga') : 'Por turma'}</strong></div>
                </section>

                {error && <p className="students-error" role="alert">{error}</p>}

                <section className="students-tools" aria-label={managementView === 'usuarios' ? 'Busca de usuários' : 'Busca de turmas'}>
                    <label className="students-search">
                        <span className="sr-only">Buscar usuário</span>
                        <input
                            type="search"
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                            placeholder={managementView === 'usuarios' ? 'Buscar por nome, e-mail ou CRP' : 'Buscar por turma ou instituição'}
                        />
                    </label>
                </section>

                <section className="students-table-wrap" aria-label={managementView === 'usuarios' ? 'Lista de usuários' : 'Lista de turmas'}>
                    {managementView === 'usuarios' ? (
                        loading ? <p className="students-empty">Consultando a API...</p> : (
                            <>
                                <table className="students-table">
                                    <thead>
                                        {profile === 'aluno' ? (
                                            <tr><th>Aluno</th><th>Ano escolar</th><th>Escola</th><th>Turma / instituição</th><th><span className="sr-only">Ações</span></th></tr>
                                        ) : (
                                            <tr><th>Psicóloga</th><th>CRP</th><th>Instituição</th><th>Validade do contrato</th><th><span className="sr-only">Ações</span></th></tr>
                                        )}
                                    </thead>
                                    <tbody>
                                        {filteredAccounts.map(account => (
                                            <tr key={account.id}>
                                                <td>
                                                    <strong>{account.name}</strong>
                                                    <span>{account.email}</span>
                                                </td>
                                                {profile === 'aluno' ? (
                                                    <>
                                                        <td>{account.scholarYear ?? account.schollarYear ?? 'Não informado'}</td>
                                                        <td>{account.schoolType ?? 'Não informado'}</td>
                                                        <td>{[account.className, account.institutionName].filter(Boolean).join(' · ') || 'Sem turma'}</td>
                                                        <td className="students-actions">
                                                            <button type="button" onClick={() => openStudentAssignment(account)}>Associar turma</button>
                                                            <button type="button" onClick={() => openEdit(account)}>Editar</button>
                                                            <button type="button" disabled={deletingId === account.id} onClick={() => handleDeactivate(account)}>
                                                                {deletingId === account.id ? 'Excluindo...' : 'Desativar'}
                                                            </button>
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td>{account.crp}</td>
                                                        <td>{account.institutionName ?? 'Não informada'}</td>
                                                        <td>{displayDate(account.contractExpirationDate)}</td>
                                                        <td className="students-actions">
                                                            <button type="button" onClick={() => openEdit(account)}>Editar</button>
                                                            <button type="button" disabled={deletingId === account.id} onClick={() => handleDeactivate(account)}>
                                                                {deletingId === account.id ? 'Excluindo...' : 'Desativar'}
                                                            </button>
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredAccounts.length === 0 && (
                                    <p className="students-empty">
                                        {accounts.length ? 'Nenhum cadastro corresponde à busca.' : 'Nenhum cadastro retornado pela API.'}
                                    </p>
                                )}
                            </>
                        )
                    ) : (
                        loadingClasses ? <p className="students-empty">Consultando turmas...</p> : (
                            <>
                                <table className="students-table">
                                    <thead><tr><th>Turma</th><th>Ano escolar</th><th>Instituição</th></tr></thead>
                                    <tbody>
                                        {filteredClasses.map(schoolClass => (
                                            <tr key={schoolClass.id}>
                                                <td><strong>{schoolClass.name}</strong></td>
                                                <td>{schoolClass.schoolYear ?? 'Não informado'}</td>
                                                <td>{schoolClass.institutionName ?? 'Não informada'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredClasses.length === 0 && (
                                    <p className="students-empty">
                                        {classes.length ? 'Nenhuma turma corresponde à busca.' : 'Nenhuma turma cadastrada.'}
                                    </p>
                                )}
                            </>
                        )
                    )}
                </section>
                <p className="students-count">
                    {managementView === 'usuarios'
                        ? `${filteredAccounts.length} ${filteredAccounts.length === 1 ? 'cadastro' : 'cadastros'}`
                        : `${filteredClasses.length} ${filteredClasses.length === 1 ? 'turma' : 'turmas'}`}
                </p>
            </main>

            {modalOpen && (
                <div className="students-modal-backdrop" onMouseDown={event => {
                    if (event.target === event.currentTarget) setModalOpen(false)
                }}>
                    <section className="students-modal" role="dialog" aria-modal="true" aria-labelledby="account-modal-title">
                        <div className="students-modal-heading">
                            <div>
                                <p className="students-eyebrow">PERFIL: {profile === 'aluno' ? 'ALUNO' : 'PSICÓLOGA'}</p>
                                <h2 id="account-modal-title">{editingId ? 'Editar cadastro' : 'Novo cadastro'}</h2>
                            </div>
                            <button className="students-close" type="button" aria-label="Fechar" onClick={() => setModalOpen(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            {error && <p className="students-error" role="alert">{error}</p>}
                            <label>Nome completo
                                <input autoFocus required value={form.name} onChange={event => updateForm('name', event.target.value)} />
                            </label>
                            <label>E-mail
                                <input type="email" required value={form.email} onChange={event => updateForm('email', event.target.value)} />
                            </label>

                            {profile === 'aluno' ? (
                                <div className="students-form-row">
                                    <label>Ano escolar
                                        <select value={form.schollarYear} onChange={event => updateForm('schollarYear', event.target.value)}>
                                            <option value="">Selecione</option>
                                            {SCHOOL_YEARS.map(year => <option key={year} value={year}>{year}</option>)}
                                        </select>
                                    </label>
                                    <label>Tipo de escola
                                        <select value={form.schoolType} onChange={event => updateForm('schoolType', event.target.value)}>
                                            <option value="">Selecione</option>
                                            <option value="Pública">Pública</option>
                                            <option value="Privada">Privada</option>
                                        </select>
                                    </label>
                                </div>
                            ) : (
                                <>
                                    <label>CRP
                                        <input required value={form.crp} onChange={event => updateForm('crp', event.target.value)} />
                                    </label>
                                    <div className="students-form-row">
                                        <label>Validade do contrato
                                            <input type="date" required value={form.contractExpirationDate} onChange={event => updateForm('contractExpirationDate', event.target.value)} />
                                        </label>
                                        <label>Instituição
                                            <select required value={form.institutionId} onChange={event => updateForm('institutionId', event.target.value)} disabled={loadingInstitutions}>
                                                <option value="">{loadingInstitutions ? 'Carregando...' : 'Selecione'}</option>
                                                {institutions.map(institution => (
                                                    <option key={institution.id} value={institution.id}>
                                                        {institution.tradeName || institution.legalName}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                    </div>
                                    {!loadingInstitutions && institutions.length === 0 && (
                                        <p className="students-inline-note">Cadastre/ative uma instituição antes de vincular uma psicóloga.</p>
                                    )}
                                </>
                            )}

                            <div className="students-modal-actions">
                                <button className="students-secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</button>
                                <button className="students-primary" type="submit" disabled={saving || (profile === 'psicologa' && (loadingInstitutions || institutions.length === 0))}>
                                    {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar cadastro'}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}

            {classModalOpen && (
                <div className="students-modal-backdrop" onMouseDown={event => {
                    if (event.target === event.currentTarget) setClassModalOpen(false)
                }}>
                    <section className="students-modal" role="dialog" aria-modal="true" aria-labelledby="class-modal-title">
                        <div className="students-modal-heading">
                            <div>
                                <p className="students-eyebrow">NOVA TURMA</p>
                                <h2 id="class-modal-title">Cadastrar turma</h2>
                            </div>
                            <button className="students-close" type="button" aria-label="Fechar" onClick={() => setClassModalOpen(false)}>×</button>
                        </div>
                        <form onSubmit={handleClassSubmit}>
                            {error && <p className="students-error" role="alert">{error}</p>}
                            <label>Nome da turma
                                <input required value={classForm.name} onChange={event => setClassForm(current => ({ ...current, name: event.target.value }))} />
                            </label>
                            <div className="students-form-row">
                                <label>Ano escolar
                                    <input type="number" min="1" step="1" required value={classForm.schoolYear} onChange={event => setClassForm(current => ({ ...current, schoolYear: event.target.value }))} />
                                </label>
                                <label>Instituição
                                    <select required value={classForm.institutionId} onChange={event => setClassForm(current => ({ ...current, institutionId: event.target.value }))} disabled={loadingInstitutions}>
                                        <option value="">{loadingInstitutions ? 'Carregando...' : 'Selecione'}</option>
                                        {institutions.map(institution => (
                                            <option key={institution.id} value={institution.id}>
                                                {institution.tradeName || institution.legalName}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                            {!loadingInstitutions && institutions.length === 0 && (
                                <p className="students-inline-note">Cadastre/ative uma instituição antes de criar uma turma.</p>
                            )}
                            <div className="students-modal-actions">
                                <button className="students-secondary" type="button" onClick={() => setClassModalOpen(false)}>Cancelar</button>
                                <button className="students-primary" type="submit" disabled={saving || loadingInstitutions || institutions.length === 0}>
                                    {saving ? 'Salvando...' : 'Criar turma'}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}

            {assignmentModalOpen && (
                <div className="students-modal-backdrop" onMouseDown={event => {
                    if (event.target === event.currentTarget) setAssignmentModalOpen(false)
                }}>
                    <section className="students-modal" role="dialog" aria-modal="true" aria-labelledby="assignment-modal-title">
                        <div className="students-modal-heading">
                            <div>
                                <p className="students-eyebrow">VÍNCULO DE TURMA</p>
                                <h2 id="assignment-modal-title">Associar aluno</h2>
                            </div>
                            <button className="students-close" type="button" aria-label="Fechar" onClick={() => setAssignmentModalOpen(false)}>×</button>
                        </div>
                        <form onSubmit={handleStudentAssignment}>
                            {error && <p className="students-error" role="alert">{error}</p>}
                            <p className="students-assignment-student">
                                <strong>{assignmentStudent?.name}</strong>
                                <span>{assignmentStudent?.email}</span>
                            </p>
                            <label>Turma
                                <select required value={assignmentClassId} onChange={event => setAssignmentClassId(event.target.value)} disabled={loadingClasses}>
                                    <option value="">{loadingClasses ? 'Carregando turmas...' : 'Selecione uma turma'}</option>
                                    {classes.map(schoolClass => (
                                        <option key={schoolClass.id} value={schoolClass.id}>
                                            {schoolClass.name} · {schoolClass.institutionName ?? 'Instituição não informada'}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            {!loadingClasses && classes.length === 0 && (
                                <p className="students-inline-note">Cadastre uma turma antes de associar o aluno.</p>
                            )}
                            <div className="students-modal-actions">
                                <button className="students-secondary" type="button" onClick={() => setAssignmentModalOpen(false)}>Cancelar</button>
                                <button className="students-primary" type="submit" disabled={saving || loadingClasses || classes.length === 0}>
                                    {saving ? 'Associando...' : 'Associar à turma'}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </div>
    )
}