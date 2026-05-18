INSERT INTO tb_usuario (nome_usuario, email_usuario, senha_usuario) VALUES ('João Silva', 'joao@gmail.com', '$2a$10$0yPwCU.0hvygBMVoNsfpduxFaIDCiBFO1xKT1CMPVerj8QR9SHKZ6');
INSERT INTO tb_usuario (nome_usuario, email_usuario, senha_usuario) VALUES ('Fernanda Castro', 'fernanda@gmail.com', '$2a$10$0yPwCU.0hvygBMVoNsfpduxFaIDCiBFO1xKT1CMPVerj8QR9SHKZ6');

INSERT INTO tb_role (autoridade_role) VALUES ('ROLE_USER');
INSERT INTO tb_role (autoridade_role) VALUES ('ROLE_ADMIN');

INSERT INTO tb_usuario_role (pk_usuario , pk_role) VALUES (1, 1);
INSERT INTO tb_usuario_role (pk_usuario , pk_role) VALUES (2, 2);