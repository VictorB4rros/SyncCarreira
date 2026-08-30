import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStudents, deleteStudent } from "../../services/studentService";

export default function StudentListPage() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        setLoading(true);
        getStudents()
            .then((res) => setStudents(res.data.content))
            .catch((err) => {
                console.error("Erro ao buscar alunos:", err);
                setError("Não foi possível carregar os alunos.");
            })
            .finally(() => setLoading(false));
    }, [refreshKey]);

    function handleDelete(id) {
        const confirmed = window.confirm("Deseja realmente excluir este aluno?");
        if (!confirmed) return;

        deleteStudent(id)
            .then(() => setRefreshKey((k) => k + 1))
            .catch((err) => console.error("Erro ao excluir aluno:", err));
    }

    return (
        <div>
            <h1>Alunos</h1>

            {error && <p>{error}</p>}

            {loading ? (
                <p>Carregando...</p>
            ) : (
                <table>
                    <thead>
                    <tr>
                        <th>Nome</th>
                        <th>E-mail</th>
                        <th>Ações</th>
                    </tr>
                    </thead>
                    <tbody>
                    {students.map((student) => (
                        <tr key={student.id}>
                            <td>{student.name}</td>
                            <td>{student.email}</td>
                            <td>
                                <button onClick={() => navigate(`/alunos/${student.id}`)}>
                                    Ver detalhes
                                </button>
                                <button onClick={() => navigate(`/alunos/${student.id}/editar`)}>
                                    Editar
                                </button>
                                <button onClick={() => handleDelete(student.id)}>
                                    Excluir
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}