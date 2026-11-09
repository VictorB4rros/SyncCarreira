/**
 * @description Modais de cadastro, vínculo de turma e instituição da gestão de contas.
 */
import { CLASS_YEAR_MAX, CLASS_YEAR_MIN, INSTITUTION_TYPES, SCHOOL_YEARS } from './accountManagementConfig.js'

function ModalShell({ eyebrow, title, titleId, dismissLabel, onClose, children }) {
    return (
        <div className="students-modal-backdrop">
            <button className="students-modal-dismiss" type="button" aria-label={dismissLabel} onClick={onClose} />
            <section className="students-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
                <div className="students-modal-heading">
                    <div>
                        <p className="students-eyebrow">{eyebrow}</p>
                        <h2 id={titleId}>{title}</h2>
                    </div>
                    <button className="students-close" type="button" aria-label="Fechar" onClick={onClose}>×</button>
                </div>
                {children}
            </section>
        </div>
    )
}

function InstitutionOptions({ institutions, loading }) {
    return (
        <>
            <option value="">{loading ? 'Carregando...' : 'Selecione'}</option>
            {institutions.map(institution => (
                <option key={institution.id} value={institution.id}>
                    {institution.tradeName || institution.legalName}
                </option>
            ))}
        </>
    )
}

function accountSubmitLabel(saving, editingId) {
    if (saving) return 'Salvando...'
    return editingId ? 'Salvar alterações' : 'Criar cadastro'
}

export function AccountFormModal({ profile, editingId, form, onChange, onSubmit, onClose, error, saving, institutions, loadingInstitutions }) {
    const isStudent = profile === 'aluno'
    const submitDisabled = saving || (profile === 'psicologa' && (loadingInstitutions || institutions.length === 0))
    return (
        <ModalShell
            eyebrow={`PERFIL: ${isStudent ? 'ALUNO' : 'PSICÓLOGA'}`}
            title={editingId ? 'Editar cadastro' : 'Novo cadastro'}
            titleId="account-modal-title"
            dismissLabel="Fechar cadastro"
            onClose={onClose}
        >
            <form onSubmit={onSubmit}>
                {error && <p className="students-error" role="alert">{error}</p>}
                <label>Nome completo
                    <input autoFocus required value={form.name} onChange={event => onChange('name', event.target.value)} />
                </label>
                <label>E-mail
                    <input type="email" required value={form.email} onChange={event => onChange('email', event.target.value)} />
                </label>

                {isStudent ? (
                    <StudentFields form={form} onChange={onChange} />
                ) : (
                    <PsychologistFields form={form} onChange={onChange} institutions={institutions} loadingInstitutions={loadingInstitutions} />
                )}

                <div className="students-modal-actions">
                    <button className="students-secondary" type="button" onClick={onClose}>Cancelar</button>
                    <button className="students-primary" type="submit" disabled={submitDisabled}>
                        {accountSubmitLabel(saving, editingId)}
                    </button>
                </div>
            </form>
        </ModalShell>
    )
}

function StudentFields({ form, onChange }) {
    return (
        <div className="students-form-row">
            <label>Ano escolar
                <select value={form.schollarYear} onChange={event => onChange('schollarYear', event.target.value)}>
                    <option value="">Selecione</option>
                    {SCHOOL_YEARS.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
            </label>
            <label>Tipo de escola
                <select value={form.schoolType} onChange={event => onChange('schoolType', event.target.value)}>
                    <option value="">Selecione</option>
                    <option value="Pública">Pública</option>
                    <option value="Privada">Privada</option>
                </select>
            </label>
        </div>
    )
}

function PsychologistFields({ form, onChange, institutions, loadingInstitutions }) {
    return (
        <>
            <label>CRP
                <input required value={form.crp} onChange={event => onChange('crp', event.target.value)} />
            </label>
            <div className="students-form-row">
                <label>Validade do contrato
                    <input type="date" required value={form.contractExpirationDate} onChange={event => onChange('contractExpirationDate', event.target.value)} />
                </label>
                <label>Instituição
                    <select required value={form.institutionId} onChange={event => onChange('institutionId', event.target.value)} disabled={loadingInstitutions}>
                        <InstitutionOptions institutions={institutions} loading={loadingInstitutions} />
                    </select>
                </label>
            </div>
            {!loadingInstitutions && institutions.length === 0 && (
                <p className="students-inline-note">Cadastre/ative uma instituição antes de vincular uma psicóloga.</p>
            )}
        </>
    )
}

export function ClassFormModal({ form, setForm, onSubmit, onClose, error, saving, institutions, loadingInstitutions }) {
    return (
        <ModalShell eyebrow="NOVA TURMA" title="Cadastrar turma" titleId="class-modal-title" dismissLabel="Fechar cadastro de turma" onClose={onClose}>
            <form onSubmit={onSubmit}>
                {error && <p className="students-error" role="alert">{error}</p>}
                <label><span>Nome da turma</span>
                    <input required value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} />
                </label>
                <div className="students-form-row">
                    <label><span>Ano (calendário)</span>
                        <input
                            type="number"
                            min={CLASS_YEAR_MIN}
                            max={CLASS_YEAR_MAX}
                            step="1"
                            required
                            placeholder={String(CLASS_YEAR_MAX)}
                            value={form.schoolYear}
                            onChange={event => setForm(current => ({ ...current, schoolYear: event.target.value }))}
                        />
                    </label>
                    <label>Instituição
                        <select required value={form.institutionId} onChange={event => setForm(current => ({ ...current, institutionId: event.target.value }))} disabled={loadingInstitutions}>
                            <InstitutionOptions institutions={institutions} loading={loadingInstitutions} />
                        </select>
                    </label>
                </div>
                {!loadingInstitutions && institutions.length === 0 && (
                    <p className="students-inline-note">Cadastre/ative uma instituição antes de criar uma turma.</p>
                )}
                <div className="students-modal-actions">
                    <button className="students-secondary" type="button" onClick={onClose}>Cancelar</button>
                    <button className="students-primary" type="submit" disabled={saving || loadingInstitutions || institutions.length === 0}>
                        {saving ? 'Salvando...' : 'Criar turma'}
                    </button>
                </div>
            </form>
        </ModalShell>
    )
}

export function AssignmentModal({ student, classId, onClassChange, classes, loadingClasses, saving, error, onSubmit, onClose }) {
    return (
        <ModalShell eyebrow="VÍNCULO DE TURMA" title="Associar aluno" titleId="assignment-modal-title" dismissLabel="Fechar vínculo de turma" onClose={onClose}>
            <form onSubmit={onSubmit}>
                {error && <p className="students-error" role="alert">{error}</p>}
                <p className="students-assignment-student">
                    <strong>{student?.name}</strong>
                    <span>{student?.email}</span>
                </p>
                <label>Turma
                    <select required value={classId} onChange={event => onClassChange(event.target.value)} disabled={loadingClasses}>
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
                    <button className="students-secondary" type="button" onClick={onClose}>Cancelar</button>
                    <button className="students-primary" type="submit" disabled={saving || loadingClasses || classes.length === 0}>
                        {saving ? 'Associando...' : 'Associar à turma'}
                    </button>
                </div>
            </form>
        </ModalShell>
    )
}

function institutionSubmitLabel(saving, editingId) {
    if (saving) return 'Salvando...'
    return editingId ? 'Salvar alterações' : 'Cadastrar instituição'
}

export function InstitutionFormModal({ editingId, form, setForm, onSubmit, onClose, error, saving }) {
    return (
        <ModalShell
            eyebrow="GESTÃO DE INSTITUIÇÕES"
            title={editingId ? 'Editar instituição' : 'Nova instituição'}
            titleId="institution-modal-title"
            dismissLabel="Fechar cadastro de instituição"
            onClose={onClose}
        >
            <form onSubmit={onSubmit}>
                {error && <p className="students-error" role="alert">{error}</p>}
                <label>Razão social
                    <input autoFocus required value={form.legalName} onChange={event => setForm(current => ({ ...current, legalName: event.target.value }))} />
                </label>
                <label>Nome fantasia
                    <input value={form.tradeName} onChange={event => setForm(current => ({ ...current, tradeName: event.target.value }))} />
                </label>
                <div className="students-form-row">
                    <label>CNPJ
                        <input required inputMode="numeric" placeholder="00.000.000/0000-00" value={form.cnpj} onChange={event => setForm(current => ({ ...current, cnpj: event.target.value }))} />
                    </label>
                    <label>Tipo de instituição
                        <select required value={form.type} onChange={event => setForm(current => ({ ...current, type: event.target.value }))}>
                            {INSTITUTION_TYPES.map(type => <option key={type.id} value={type.id}>{type.label}</option>)}
                        </select>
                    </label>
                </div>
                {editingId && (
                    <label className="institution-active-toggle">
                        <input type="checkbox" checked={form.active} onChange={event => setForm(current => ({ ...current, active: event.target.checked }))} />
                        Instituição ativa
                    </label>
                )}
                <div className="students-modal-actions">
                    <button className="students-secondary" type="button" onClick={onClose}>Cancelar</button>
                    <button className="students-primary" type="submit" disabled={saving}>
                        {institutionSubmitLabel(saving, editingId)}
                    </button>
                </div>
            </form>
        </ModalShell>
    )
}