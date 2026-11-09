/**
 * @description Constantes, textos por aba e funções puras da gestão de contas (ROLE_ADMIN).
 */

export const EMPTY_STUDENT = { name: '', email: '', schollarYear: '', schoolType: '' }
export const EMPTY_PSYCHOLOGIST = { name: '', email: '', crp: '', contractExpirationDate: '', institutionId: '' }
export const EMPTY_CLASS = { name: '', schoolYear: '', institutionId: '' }
export const EMPTY_INSTITUTION = { legalName: '', tradeName: '', cnpj: '', type: 'PUBLICA', active: true }

// Faixa aceita para o ano-calendário de uma turma.
export const CLASS_YEAR_MIN = 2000
export const CLASS_YEAR_MAX = new Date().getFullYear() + 1

export const INSTITUTION_TYPES = [
    { id: 'PUBLICA', label: 'Pública' },
    { id: 'PARTICULAR', label: 'Particular' },
    { id: 'ONG', label: 'ONG' },
]

export const SCHOOL_YEARS = [
    '1º Ano - Ensino Médio',
    '2º Ano - Ensino Médio',
    '3º Ano - Ensino Médio',
    'Outro',
]

export const PROFILE_OPTIONS = [
    { id: 'aluno', label: 'Alunos' },
    { id: 'psicologa', label: 'Psicólogas' },
]

export const VIEW_TABS = [
    { id: 'usuarios', label: 'Usuários' },
    { id: 'turmas', label: 'Turmas' },
    { id: 'instituicoes', label: 'Instituições' },
]

/** Textos e rótulos de cada aba da gestão. */
export const VIEWS = {
    usuarios: {
        title: 'Usuários',
        description: 'Gerencie os cadastros de alunos e psicólogas.',
        createLabel: 'Novo cadastro',
        summaryLabel: 'Cadastros encontrados',
        unit: ['cadastro', 'cadastros'],
        searchAria: 'Busca de usuários',
        searchLabel: 'Buscar usuário',
        searchPlaceholder: 'Buscar por nome, e-mail ou CRP',
        listAria: 'Lista de usuários',
        loadingText: 'Consultando a API...',
    },
    turmas: {
        title: 'Turmas',
        description: 'Turmas vinculadas às instituições cadastradas.',
        createLabel: 'Nova turma',
        summaryLabel: 'Turmas cadastradas',
        unit: ['turma', 'turmas'],
        searchAria: 'Busca de turmas',
        searchLabel: 'Buscar turma',
        searchPlaceholder: 'Buscar por turma ou instituição',
        listAria: 'Lista de turmas',
        loadingText: 'Consultando turmas...',
    },
    instituicoes: {
        title: 'Instituições',
        description: 'Cadastre e gerencie escolas e organizações parceiras.',
        createLabel: 'Nova instituição',
        summaryLabel: 'Instituições cadastradas',
        unit: ['instituição', 'instituições'],
        searchAria: 'Busca de instituições',
        searchLabel: 'Buscar instituição',
        searchPlaceholder: 'Buscar por nome, CNPJ ou tipo',
        listAria: 'Lista de instituições',
        loadingText: 'Consultando instituições...',
    },
}

/** Texto pesquisável de cada linha, por aba. */
export const SEARCH_TEXT = {
    usuarios: account => `${account.name} ${account.email} ${account.crp ?? ''}`,
    turmas: schoolClass => `${schoolClass.name} ${schoolClass.institutionName ?? ''}`,
    instituicoes: institution => `${institution.legalName} ${institution.tradeName ?? ''} ${institution.cnpj ?? ''} ${institution.type}`,
}

export function countText(view, total) {
    return `${total} ${total === 1 ? view.unit[0] : view.unit[1]}`
}

export function buildSummary(view, { profile, accounts, classes, institutions }) {
    switch (view) {
        case 'turmas':
            return { count: classes.length, detailLabel: 'Ano escolar', detailValue: 'Por turma' }
        case 'instituicoes':
            return {
                count: institutions.length,
                detailLabel: 'Instituições ativas',
                detailValue: institutions.filter(item => item.active).length,
            }
        default:
            return {
                count: accounts.length,
                detailLabel: 'Perfil selecionado',
                detailValue: profile === 'aluno' ? 'Aluno' : 'Psicóloga',
            }
    }
}

export function filterRows(rows, search, textOf) {
    const term = search.trim().toLocaleLowerCase('pt-BR')
    if (!term) return rows
    return rows.filter(row => textOf(row).toLocaleLowerCase('pt-BR').includes(term))
}

export function displayDate(value) {
    if (!value) return 'Não informada'
    return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR')
}

export function accountRequestError(error, fallback) {
    if (error.response?.status === 401) {
        return 'A API exige autenticação. A tela está aberta, mas os dados requerem um token com permissão para o perfil selecionado.'
    }
    if (error.response?.status === 403) {
        return 'A API negou esta operação. Turmas, psicólogas, instituições e alterações exigem ROLE_ADMIN; a listagem de alunos também permite ROLE_PSICOLOGA.'
    }
    return error.response?.data?.message || fallback
}

export function institutionRequestError(error, fallback) {
    return error.response?.data?.message || error.response?.data?.error || accountRequestError(error, fallback)
}

export function toEditForm(profile, account) {
    if (profile === 'aluno') {
        return {
            name: account.name ?? '',
            email: account.email ?? '',
            schollarYear: account.scholarYear ?? account.schollarYear ?? '',
            schoolType: account.schoolType ?? '',
        }
    }
    return {
        name: account.name ?? '',
        email: account.email ?? '',
        crp: account.crp ?? '',
        contractExpirationDate: account.contractExpirationDate ?? '',
        institutionId: account.institutionId ? String(account.institutionId) : '',
    }
}

export function upsertAccount(list, saved, editingId) {
    if (!editingId) return [saved, ...list]
    return list.map(account => (account.id === editingId ? saved : account))
}

export function upsertInstitution(list, saved, editingId) {
    if (!editingId) {
        return [...list, saved].sort((a, b) => a.legalName.localeCompare(b.legalName, 'pt-BR'))
    }
    return list.map(item => (item.id === editingId ? saved : item))
}