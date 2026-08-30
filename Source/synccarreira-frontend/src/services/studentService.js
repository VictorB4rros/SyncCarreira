import api from "./api"; // instância Axios centralizada já existente no projeto

export function getStudents() {
    return api.get("/students");
}

export function getStudentById(id) {
    return api.get(`/students/${id}`);
}

export function updateStudent(id, data) {
    return api.put(`/students/${id}`, data);
}

export function deleteStudent(id) {
    return api.delete(`/students/${id}`);
}