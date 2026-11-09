/**
 * @description Blocos visuais da gestão de contas: cabeçalho, abas, resumo e tabelas por área.
 */
import { INSTITUTION_TYPES, displayDate } from './accountManagementConfig.js'

export function ManagementHeading({ view, onCreate }) {
    return (
        <div className="students-heading">
            <div>
                <p className="students-eyebrow">GESTÃO DE ACESSO</p>
                <h1>{view.title}</h1>
                <p className="students-description">{view.description}</p>
            </div>
            <button className="students-primary" type="button" onClick={onCreate}>
                <span aria-hidden="true">+</span> {view.createLabel}
            </button>
        </div>
    )
}

export function ViewTabs({ groupLabel, options, value, onChange }) {
    return (
        <div className="students-profile-switch" role="group" aria-label={groupLabel}>
            {options.map(option => (
                <button
                    key={option.id}
                    type="button"
                    className={option.id === value ? 'is-selected' : ''}
                    aria-pressed={option.id === value}
                    onClick={() => onChange(option.id)}
                >
                    {option.label}
                </button>
            ))}
        </div>
    )
}

export function ManagementSummary({ view, summary }) {
    return (
        <section className="students-summary" aria-label="Resumo dos cadastros">
            <div><span>{view.summaryLabel}</span><strong>{summary.count}</strong></div>
            <div><span>{summary.detailLabel}</span><strong>{summary.detailValue}</strong></div>
        </section>
    )
}

export function ManagementTable({ viewKey, config, isLoading, rows, filteredRows, profile, actions }) {
    return (
        <section className="students-table-wrap" aria-label={config.listAria}>
            {isLoading ? (
                <p className="students-empty">{config.loadingText}</p>
            ) : (
                <TableBody viewKey={viewKey} profile={profile} rows={rows} filteredRows={filteredRows} actions={actions} />
            )}
        </section>
    )
}

function TableBody({ viewKey, profile, rows, filteredRows, actions }) {
    if (viewKey === 'turmas') return <ClassesTable rows={rows} filteredRows={filteredRows} />
    if (viewKey === 'instituicoes') return <InstitutionsTable rows={rows} filteredRows={filteredRows} actions={actions} />
    return <AccountsTable profile={profile} rows={rows} filteredRows={filteredRows} actions={actions} />
}

function AccountsTable({ profile, rows, filteredRows, actions }) {
    const isStudent = profile === 'aluno'
    return (
        <>
            <table className="students-table">
                <thead>
                    {isStudent ? (
                        <tr><th>Aluno</th><th>Ano escolar</th><th>Escola</th><th>Turma / instituição</th><th><span className="sr-only">Ações</span></th></tr>
                    ) : (
                        <tr><th>Psicóloga</th><th>CRP</th><th>Instituição</th><th>Validade do contrato</th><th><span className="sr-only">Ações</span></th></tr>
                    )}
                </thead>
                <tbody>
                    {filteredRows.map(account => (
                        <tr key={account.id}>
                            <td>
                                <strong>{account.name}</strong>
                                <span>{account.email}</span>
                            </td>
                            {isStudent ? (
                                <StudentCells account={account} actions={actions} />
                            ) : (
                                <PsychologistCells account={account} actions={actions} />
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
            {filteredRows.length === 0 && (
                <p className="students-empty">
                    {rows.length ? 'Nenhum cadastro corresponde à busca.' : 'Nenhum cadastro retornado pela API.'}
                </p>
            )}
        </>
    )
}

function StudentCells({ account, actions }) {
    return (
        <>
            <td>{account.scholarYear ?? account.schollarYear ?? 'Não informado'}</td>
            <td>{account.schoolType ?? 'Não informado'}</td>
            <td>{[account.className, account.institutionName].filter(Boolean).join(' · ') || 'Sem turma'}</td>
            <td className="students-actions">
                <button type="button" onClick={() => actions.onAssign(account)}>Associar turma</button>
                <button type="button" onClick={() => actions.onEdit(account)}>Editar</button>
                <DeactivateButton account={account} actions={actions} />
            </td>
        </>
    )
}

function PsychologistCells({ account, actions }) {
    return (
        <>
            <td>{account.crp}</td>
            <td>{account.institutionName ?? 'Não informada'}</td>
            <td>{displayDate(account.contractExpirationDate)}</td>
            <td className="students-actions">
                <button type="button" onClick={() => actions.onEdit(account)}>Editar</button>
                <DeactivateButton account={account} actions={actions} />
            </td>
        </>
    )
}

function DeactivateButton({ account, actions }) {
    const deleting = actions.accountDeletingId === account.id
    return (
        <button type="button" disabled={deleting} onClick={() => actions.onDeactivate(account)}>
            {deleting ? 'Excluindo...' : 'Desativar'}
        </button>
    )
}

function ClassesTable({ rows, filteredRows }) {
    return (
        <>
            <table className="students-table">
                <thead><tr><th>Turma</th><th>Ano escolar</th><th>Instituição</th></tr></thead>
                <tbody>
                    {filteredRows.map(schoolClass => (
                        <tr key={schoolClass.id}>
                            <td><strong>{schoolClass.name}</strong></td>
                            <td>{schoolClass.schoolYear ?? 'Não informado'}</td>
                            <td>{schoolClass.institutionName ?? 'Não informada'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {filteredRows.length === 0 && (
                <p className="students-empty">
                    {rows.length ? 'Nenhuma turma corresponde à busca.' : 'Nenhuma turma cadastrada.'}
                </p>
            )}
        </>
    )
}

function InstitutionsTable({ rows, filteredRows, actions }) {
    return (
        <>
            <table className="students-table">
                <thead><tr><th>Instituição</th><th>CNPJ</th><th>Tipo</th><th>Turmas</th><th>Status</th><th><span className="sr-only">Ações</span></th></tr></thead>
                <tbody>
                    {filteredRows.map(institution => (
                        <InstitutionRow key={institution.id} institution={institution} actions={actions} />
                    ))}
                </tbody>
            </table>
            {filteredRows.length === 0 && (
                <p className="students-empty">
                    {rows.length ? 'Nenhuma instituição corresponde à busca.' : 'Nenhuma instituição cadastrada.'}
                </p>
            )}
        </>
    )
}

function InstitutionRow({ institution, actions }) {
    const busy = actions.institutionDeletingId === institution.id
    return (
        <tr>
            <td>
                <strong>{institution.tradeName || institution.legalName}</strong>
                {institution.tradeName && <span>{institution.legalName}</span>}
            </td>
            <td>{institution.cnpj}</td>
            <td>{INSTITUTION_TYPES.find(type => type.id === institution.type)?.label ?? institution.type}</td>
            <td>{institution.classCount ?? 0}</td>
            <td>
                <span className={`students-status${institution.active ? '' : ' students-status--inactive'}`}>
                    {institution.active ? 'Ativa' : 'Inativa'}
                </span>
            </td>
            <td className="students-actions">
                <button type="button" onClick={() => actions.onEditInstitution(institution)}>Editar</button>
                <button type="button" disabled={busy} onClick={() => actions.onToggleInstitution(institution)}>
                    {toggleLabel(institution, busy)}
                </button>
            </td>
        </tr>
    )
}

function toggleLabel(institution, busy) {
    if (busy) return 'Salvando...'
    return institution.active ? 'Desativar' : 'Ativar'
}