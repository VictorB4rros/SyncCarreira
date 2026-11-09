/**
 * @description Estado e ações da gestão de contas, separados por área (usuários, turmas e instituições).
 */
import { useEffect, useState } from 'react'
import {
    assignStudentToClass,
    createManagedClass,
    deleteManagedAccount,
    listActiveInstitutions,
    listManagedAccounts,
    listManagedClasses,
    listManagedInstitutions,
    saveManagedAccount,
    saveManagedInstitution,
} from '../../../services/accountManagementService.js'
import {
    CLASS_YEAR_MAX,
    CLASS_YEAR_MIN,
    EMPTY_CLASS,
    EMPTY_INSTITUTION,
    EMPTY_PSYCHOLOGIST,
    EMPTY_STUDENT,
    accountRequestError,
    institutionRequestError,
    toEditForm,
    upsertAccount,
    upsertInstitution,
} from './accountManagementConfig.js'

export function useAccounts({ profile, managementView, setError }) {
    const [accounts, setAccounts] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (managementView !== 'usuarios') return
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
    }, [profile, managementView, setError])

    return { accounts, setAccounts, loading }
}

export function useAccountEditor({ profile, setAccounts, setError }) {
    const [modalOpen, setModalOpen] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState(EMPTY_STUDENT)
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState(null)

    function openCreate() {
        setEditingId(null)
        setForm(profile === 'aluno' ? EMPTY_STUDENT : EMPTY_PSYCHOLOGIST)
        setError('')
        setModalOpen(true)
    }

    function openEdit(account) {
        setEditingId(account.id)
        setForm(toEditForm(profile, account))
        setError('')
        setModalOpen(true)
    }

    async function handleSubmit(event) {
        event.preventDefault()
        setSaving(true)
        setError('')
        try {
            const saved = await saveManagedAccount(profile, form, editingId)
            setAccounts(current => upsertAccount(current, saved, editingId))
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

    function closeModal() {
        setModalOpen(false)
    }

    return { modalOpen, closeModal, form, editingId, saving, deletingId, openCreate, openEdit, updateForm, handleSubmit, handleDeactivate }
}

export function useClasses({ managementView, setError }) {
    const [classes, setClasses] = useState([])
    const [loadingClasses, setLoadingClasses] = useState(false)

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
    }, [managementView, setError])

    return { classes, setClasses, loadingClasses, setLoadingClasses }
}

export function useClassEditor({ setClasses, setError }) {
    const [modalOpen, setModalOpen] = useState(false)
    const [form, setForm] = useState(EMPTY_CLASS)
    const [saving, setSaving] = useState(false)

    function openCreate() {
        setForm(EMPTY_CLASS)
        setError('')
        setModalOpen(true)
    }

    async function handleSubmit(event) {
        event.preventDefault()

        // Ano-calendário: precisa ser um inteiro dentro de uma faixa plausível.
        // Sem isto, "00000" (= 0) ou anos absurdos passavam direto para a API.
        const year = Number(form.schoolYear)
        if (!Number.isInteger(year) || year < CLASS_YEAR_MIN || year > CLASS_YEAR_MAX) {
            setError(`Informe um ano-calendário válido (entre ${CLASS_YEAR_MIN} e ${CLASS_YEAR_MAX}).`)
            return
        }

        setSaving(true)
        setError('')
        try {
            const createdClass = await createManagedClass(form)
            setClasses(current => [createdClass, ...current])
            setModalOpen(false)
        } catch (err) {
            console.error('Erro ao criar turma:', err)
            setError(accountRequestError(err, 'Não foi possível criar a turma.'))
        } finally {
            setSaving(false)
        }
    }

    function closeModal() {
        setModalOpen(false)
    }

    return { modalOpen, closeModal, form, setForm, saving, openCreate, handleSubmit }
}

export function useStudentAssignment({ classes, setClasses, setLoadingClasses, setAccounts, setError }) {
    const [modalOpen, setModalOpen] = useState(false)
    const [student, setStudent] = useState(null)
    const [classId, setClassId] = useState('')
    const [saving, setSaving] = useState(false)

    async function openAssignment(target) {
        setStudent(target)
        setClassId('')
        setModalOpen(true)
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

    async function handleSubmit(event) {
        event.preventDefault()
        if (!student || !classId) return

        setSaving(true)
        setError('')
        try {
            await assignStudentToClass(student.id, Number(classId))
            const selectedClass = classes.find(schoolClass => schoolClass.id === Number(classId))
            setAccounts(current => current.map(account => (account.id === student.id
                ? { ...account, className: selectedClass?.name, institutionName: selectedClass?.institutionName }
                : account)))
            setModalOpen(false)
        } catch (err) {
            console.error('Erro ao associar aluno à turma:', err)
            setError(accountRequestError(err, 'Não foi possível associar o aluno à turma.'))
        } finally {
            setSaving(false)
        }
    }

    function closeModal() {
        setModalOpen(false)
    }

    return { modalOpen, closeModal, student, classId, setClassId, saving, openAssignment, handleSubmit }
}

/** Lista completa de instituições, carregada ao abrir a aba Instituições. Retorna o estado de carregamento. */
export function useInstitutionList({ managementView, setInstitutions, setError }) {
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (managementView !== 'instituicoes') return
        let current = true
        setLoading(true)
        listManagedInstitutions()
            .then(data => { if (current) setInstitutions(data) })
            .catch(err => {
                console.error('Erro ao carregar instituições:', err)
                if (current) setError(accountRequestError(err, 'Não foi possível carregar as instituições.'))
            })
            .finally(() => { if (current) setLoading(false) })
        return () => { current = false }
    }, [managementView, setInstitutions, setError])

    return loading
}

/** Instituições ativas, usadas nos formulários de psicóloga e de turma. Retorna o estado de carregamento. */
export function useInstitutionOptions({ requested, setInstitutions, setError }) {
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!requested) return
        let current = true
        setLoading(true)
        listActiveInstitutions()
            .then(data => { if (current) setInstitutions(data) })
            .catch(err => {
                console.error('Erro ao carregar instituições:', err)
                if (current) setError(accountRequestError(err, 'Não foi possível carregar as instituições.'))
            })
            .finally(() => { if (current) setLoading(false) })
        return () => { current = false }
    }, [requested, setInstitutions, setError])

    return loading
}

export function useInstitutionEditor({ setInstitutions, setError }) {
    const [modalOpen, setModalOpen] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState(EMPTY_INSTITUTION)
    const [saving, setSaving] = useState(false)

    function openCreate() {
        setEditingId(null)
        setForm(EMPTY_INSTITUTION)
        setError('')
        setModalOpen(true)
    }

    function openEdit(institution) {
        setEditingId(institution.id)
        setForm({
            legalName: institution.legalName ?? '',
            tradeName: institution.tradeName ?? '',
            cnpj: institution.cnpj ?? '',
            type: institution.type ?? 'PUBLICA',
            active: institution.active,
        })
        setError('')
        setModalOpen(true)
    }

    async function handleSubmit(event) {
        event.preventDefault()
        setSaving(true)
        setError('')
        try {
            const saved = await saveManagedInstitution(form, editingId)
            setInstitutions(current => upsertInstitution(current, saved, editingId))
            setModalOpen(false)
        } catch (err) {
            console.error('Erro ao salvar instituição:', err)
            setError(institutionRequestError(err, 'Não foi possível salvar a instituição. Verifique o CNPJ e tente novamente.'))
        } finally {
            setSaving(false)
        }
    }

    function closeModal() {
        setModalOpen(false)
    }

    return { modalOpen, closeModal, form, setForm, editingId, saving, openCreate, openEdit, handleSubmit }
}

export function useInstitutionStatus({ setInstitutions, setError }) {
    const [deletingId, setDeletingId] = useState(null)

    async function toggleStatus(institution) {
        const action = institution.active ? 'desativar' : 'ativar'
        if (!window.confirm(`Deseja ${action} a instituição ${institution.tradeName || institution.legalName}?`)) return
        setDeletingId(institution.id)
        setError('')
        try {
            const updated = await saveManagedInstitution({ ...institution, active: !institution.active }, institution.id)
            setInstitutions(current => current.map(item => (item.id === institution.id ? updated : item)))
        } catch (err) {
            console.error(`Erro ao ${action} instituição:`, err)
            setError(institutionRequestError(err, `Não foi possível ${action} a instituição.`))
        } finally {
            setDeletingId(null)
        }
    }

    return { deletingId, toggleStatus }
}