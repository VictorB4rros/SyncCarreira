import { useMemo, useState } from 'react'
import AppHeader from '../../components/AppHeader/AppHeader.jsx'
import {
    PROFILE_OPTIONS,
    SEARCH_TEXT,
    VIEWS,
    VIEW_TABS,
    buildSummary,
    countText,
    filterRows,
} from './accountManagement/accountManagementConfig.js'
import {
    useAccountEditor,
    useAccounts,
    useClassEditor,
    useClasses,
    useInstitutionEditor,
    useInstitutionList,
    useInstitutionOptions,
    useInstitutionStatus,
    useStudentAssignment,
} from './accountManagement/useAccountManagement.js'
import {
    ManagementHeading,
    ManagementSummary,
    ManagementTable,
    ViewTabs,
} from './accountManagement/AccountManagementLayout.jsx'
import {
    AccountFormModal,
    AssignmentModal,
    ClassFormModal,
    InstitutionFormModal,
} from './accountManagement/AccountManagementModals.jsx'
import './AccountManagementPage.css'

export default function AccountManagementPage() {
    const [managementView, setManagementView] = useState('usuarios')
    const [profile, setProfile] = useState('aluno')
    const [search, setSearch] = useState('')
    const [error, setError] = useState('')
    const [institutions, setInstitutions] = useState([])

    const accountsState = useAccounts({ profile, managementView, setError })
    const accountEditor = useAccountEditor({ profile, setAccounts: accountsState.setAccounts, setError })
    const classesState = useClasses({ managementView, setError })
    const classEditor = useClassEditor({ setClasses: classesState.setClasses, setError })
    const assignment = useStudentAssignment({
        classes: classesState.classes,
        setClasses: classesState.setClasses,
        setLoadingClasses: classesState.setLoadingClasses,
        setAccounts: accountsState.setAccounts,
        setError,
    })
    const loadingInstitutionList = useInstitutionList({ managementView, setInstitutions, setError })
    const loadingInstitutions = useInstitutionOptions({
        requested: (accountEditor.modalOpen && profile === 'psicologa') || classEditor.modalOpen,
        setInstitutions,
        setError,
    })
    const institutionEditor = useInstitutionEditor({ setInstitutions, setError })
    const institutionStatus = useInstitutionStatus({ setInstitutions, setError })

    const rows = { usuarios: accountsState.accounts, turmas: classesState.classes, instituicoes: institutions }[managementView]
    const filteredRows = useMemo(
        () => filterRows(rows, search, SEARCH_TEXT[managementView]),
        [rows, search, managementView],
    )
    const view = VIEWS[managementView]
    const summary = buildSummary(managementView, {
        profile,
        accounts: accountsState.accounts,
        classes: classesState.classes,
        institutions,
    })
    const isLoading = { usuarios: accountsState.loading, turmas: classesState.loadingClasses, instituicoes: loadingInstitutionList }[managementView]
    const primaryAction = { usuarios: accountEditor.openCreate, turmas: classEditor.openCreate, instituicoes: institutionEditor.openCreate }[managementView]

    function selectView(nextView) {
        setManagementView(nextView)
        setSearch('')
        if (nextView === 'instituicoes') setError('')
    }

    function selectProfile(nextProfile) {
        setProfile(nextProfile)
        setSearch('')
        accountEditor.closeModal()
    }

    return (
        <div className="students-page">
            <AppHeader />
            <main className="students-main">
                <ManagementHeading view={view} onCreate={primaryAction} />

                <ViewTabs groupLabel="Área de gestão" options={VIEW_TABS} value={managementView} onChange={selectView} />

                {managementView === 'usuarios' && (
                    <ViewTabs groupLabel="Perfil de usuário" options={PROFILE_OPTIONS} value={profile} onChange={selectProfile} />
                )}

                <ManagementSummary view={view} summary={summary} />

                {error && <p className="students-error" role="alert">{error}</p>}

                <section className="students-tools" aria-label={view.searchAria}>
                    <label className="students-search">
                        <span className="sr-only">{view.searchLabel}</span>
                        <input
                            type="search"
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                            placeholder={view.searchPlaceholder}
                        />
                    </label>
                </section>

                <ManagementTable
                    viewKey={managementView}
                    config={view}
                    isLoading={isLoading}
                    rows={rows}
                    filteredRows={filteredRows}
                    profile={profile}
                    actions={{
                        onAssign: assignment.openAssignment,
                        onEdit: accountEditor.openEdit,
                        onDeactivate: accountEditor.handleDeactivate,
                        accountDeletingId: accountEditor.deletingId,
                        onEditInstitution: institutionEditor.openEdit,
                        onToggleInstitution: institutionStatus.toggleStatus,
                        institutionDeletingId: institutionStatus.deletingId,
                    }}
                />

                <p className="students-count">{countText(view, filteredRows.length)}</p>
            </main>

            {accountEditor.modalOpen && (
                <AccountFormModal
                    profile={profile}
                    editingId={accountEditor.editingId}
                    form={accountEditor.form}
                    onChange={accountEditor.updateForm}
                    onSubmit={accountEditor.handleSubmit}
                    onClose={accountEditor.closeModal}
                    error={error}
                    saving={accountEditor.saving}
                    institutions={institutions}
                    loadingInstitutions={loadingInstitutions}
                />
            )}

            {classEditor.modalOpen && (
                <ClassFormModal
                    form={classEditor.form}
                    setForm={classEditor.setForm}
                    onSubmit={classEditor.handleSubmit}
                    onClose={classEditor.closeModal}
                    error={error}
                    saving={classEditor.saving}
                    institutions={institutions}
                    loadingInstitutions={loadingInstitutions}
                />
            )}

            {assignment.modalOpen && (
                <AssignmentModal
                    student={assignment.student}
                    classId={assignment.classId}
                    onClassChange={assignment.setClassId}
                    classes={classesState.classes}
                    loadingClasses={classesState.loadingClasses}
                    saving={assignment.saving}
                    error={error}
                    onSubmit={assignment.handleSubmit}
                    onClose={assignment.closeModal}
                />
            )}

            {institutionEditor.modalOpen && (
                <InstitutionFormModal
                    editingId={institutionEditor.editingId}
                    form={institutionEditor.form}
                    setForm={institutionEditor.setForm}
                    onSubmit={institutionEditor.handleSubmit}
                    onClose={institutionEditor.closeModal}
                    error={error}
                    saving={institutionEditor.saving}
                />
            )}
        </div>
    )
}