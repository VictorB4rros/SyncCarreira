INSERT INTO tb_user (name, email, phone, password, birth_date) VALUES ('João Silva', 'joao@gmail.com', '988888888', '$2a$10$GejiYMGyjsCZDQQh2x1HauQPjhlzOBlv1Ikj4CvBx1nuCKbelyOUO', '1993-11-25');
INSERT INTO tb_user (name, email, phone, password, birth_date) VALUES ('Fernanda Castro', 'fernanda@gmail.com', '977777777', '$2a$10$GejiYMGyjsCZDQQh2x1HauQPjhlzOBlv1Ikj4CvBx1nuCKbelyOUO', '1999-02-23');

INSERT INTO tb_role (authority) VALUES ('ROLE_CLIENT');
INSERT INTO tb_role (authority) VALUES ('ROLE_ADMIN');

INSERT INTO tb_user_role (user_id , role_id) VALUES (1, 1);
INSERT INTO tb_user_role (user_id , role_id) VALUES (2, 1);
INSERT INTO tb_user_role (user_id , role_id) VALUES (2, 2);