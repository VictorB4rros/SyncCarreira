INSERT INTO tb_usuario (nome_usuario, email_usuario, senha_usuario) VALUES ('João Silva', 'joao@gmail.com', '$2a$10$0yPwCU.0hvygBMVoNsfpduxFaIDCiBFO1xKT1CMPVerj8QR9SHKZ6');
INSERT INTO tb_usuario (nome_usuario, email_usuario, senha_usuario) VALUES ('Fernanda Castro', 'fernanda@gmail.com', '$2a$10$0yPwCU.0hvygBMVoNsfpduxFaIDCiBFO1xKT1CMPVerj8QR9SHKZ6');

INSERT INTO tb_role (autoridade_role) VALUES ('ROLE_USER');
INSERT INTO tb_role (autoridade_role) VALUES ('ROLE_ADMIN');

INSERT INTO tb_usuario_role (pk_usuario , pk_role) VALUES (1, 1);
INSERT INTO tb_usuario_role (pk_usuario , pk_role) VALUES (2, 2);

INSERT INTO tb_trilha (nome_trilha, ordem_sequencial_trilha) VALUES ('AUTOCONHECIMENTO', 1);
INSERT INTO tb_trilha (nome_trilha, ordem_sequencial_trilha) VALUES ('INFLUENCIAS', 2);
INSERT INTO tb_trilha (nome_trilha, ordem_sequencial_trilha) VALUES ('PLANO_DE_FUTURO', 3);
INSERT INTO tb_trilha (nome_trilha, ordem_sequencial_trilha) VALUES ('INFORMACAO', 4);

INSERT INTO tb_pergunta (enunciado_pergunta, tipo_pergunta, fk_trilha) VALUES ('Quais destes assuntos costumam prender sua atenção naturalmente em conversas, vídeos ou leituras?', 'CHECKBOX', 1);
INSERT INTO tb_pergunta (enunciado_pergunta, tipo_pergunta, fk_trilha) VALUES ('Como você avalia sua facilidade atual em lidar com os seguintes desafios?', 'LIKERT', 1);
INSERT INTO tb_pergunta (enunciado_pergunta, tipo_pergunta, fk_trilha) VALUES ('Em qual destes cenários você sente que seu desempenho é melhor?', 'MULTIPLA_ESCOLHA', 1);
INSERT INTO tb_pergunta (enunciado_pergunta, tipo_pergunta, fk_trilha) VALUES ('Das atividades abaixo, qual você curte e Faz com frequência (gera prazer imediato)?', 'MULTIPLA_ESCOLHA', 1);
INSERT INTO tb_pergunta (enunciado_pergunta, tipo_pergunta, fk_trilha) VALUES ('Qual atividade você faz, mas não curte (faz por obrigação ou necessidade)? ', 'MULTIPLA_ESCOLHA', 1);
INSERT INTO tb_pergunta (enunciado_pergunta, tipo_pergunta, fk_trilha) VALUES ('Quais destas atividades você curte, mas Não Faz (por falta de tempo, dinheiro ou ferramenta)?', 'CHECKBOX', 1);
INSERT INTO tb_pergunta (enunciado_pergunta, tipo_pergunta, fk_trilha) VALUES ('Para você, o que define uma atividade bem-sucedida?', 'MULTIPLA_ESCOLHA', 1);
INSERT INTO tb_pergunta (enunciado_pergunta, tipo_pergunta, fk_trilha) VALUES ('O que mais te incomoda em uma atividade ou ambiente?', 'MULTIPLA_ESCOLHA', 1);
INSERT INTO tb_pergunta (enunciado_pergunta, tipo_pergunta, fk_trilha) VALUES ('Quanto você está disposto a se dedicar agora a aprender algo totalmente novo, mesmo que seja difícil no início?', 'LIKERT', 1);
INSERT INTO tb_pergunta (enunciado_pergunta, tipo_pergunta, fk_trilha) VALUES ('Se você tivesse que descrever seu "jeitão" profissional hoje, qual frase melhor se encaixa?', 'MULTIPLA_ESCOLHA', 1);

INSERT INTO tb_pergunta (enunciado_pergunta, tipo_pergunta, fk_trilha) VALUES ('Minha família tem uma expectativa clara sobre qual carreira eu devo seguir?', 'LIKERT', 2);
INSERT INTO tb_pergunta (enunciado_pergunta, tipo_pergunta, fk_trilha) VALUES ('Quando penso em uma carreira, a reação da minha família é um fator que me preocupa?', 'LIKERT', 2);
INSERT INTO tb_pergunta (enunciado_pergunta, tipo_pergunta, fk_trilha) VALUES ('Como a maioria dos seus amigos próximos está em relação à escolha profissional?', 'MULTIPLA_ESCOLHA', 2);
INSERT INTO tb_pergunta (enunciado_pergunta, tipo_pergunta, fk_trilha) VALUES ('Quais áreas abaixo são as mais valorizadas pelas pessoas do seu convívio (família, escola, bairro).', 'CHECKBOX', 2);
INSERT INTO tb_pergunta (enunciado_pergunta, tipo_pergunta, fk_trilha) VALUES ('Já deixei de considerar uma carreira porque achei que ela não teria prestígio suficiente aos olhos de outras pessoas.', 'LIKERT', 2);
INSERT INTO tb_pergunta (enunciado_pergunta, tipo_pergunta, fk_trilha) VALUES ('Já deixei de considerar alguma carreira por conta de uma reação negativa de alguém próximo.', 'MULTIPLA_ESCOLHA', 2);
INSERT INTO tb_pergunta (enunciado_pergunta, tipo_pergunta, fk_trilha) VALUES ('Quais das situações abaixo você reconhece na sua vida?', 'CHECKBOX', 2);
INSERT INTO tb_pergunta (enunciado_pergunta, tipo_pergunta, fk_trilha) VALUES ('Quem mais influencia o que você pensa sobre sua carreira?', 'CHECKBOX', 2);
INSERT INTO tb_pergunta (enunciado_pergunta, tipo_pergunta, fk_trilha) VALUES ('O quanto a carreira que você está considerando é uma escolha sua, e não uma resposta ao que os outros esperam de você?', 'LIKERT', 2);
INSERT INTO tb_pergunta (enunciado_pergunta, tipo_pergunta, fk_trilha) VALUES ('Sobre a influência que mais pesou na sua vida até aqui, como você se sente em relação a ela?', 'MULTIPLA_ESCOLHA', 2);

INSERT INTO tb_pergunta (enunciado_pergunta, tipo_pergunta, fk_trilha) VALUES ('Tenho clareza sobre o tipo de vida que quero ter no futuro (rotina, conforto, liberdade, etc.).', 'LIKERT', 3);
INSERT INTO tb_pergunta (enunciado_pergunta, tipo_pergunta, fk_trilha) VALUES ('Consigo imaginar como será meu dia a dia na vida adulta.', 'LIKERT', 3);
INSERT INTO tb_pergunta (enunciado_pergunta, tipo_pergunta, fk_trilha) VALUES ('Minha escolha profissional está alinhada com o estilo de vida que desejo.', 'LIKERT', 3);
INSERT INTO tb_pergunta (enunciado_pergunta, tipo_pergunta, fk_trilha) VALUES ('Considero fatores como renda, qualidade de vida e tempo livre ao pensar no meu futuro.', 'LIKERT', 3);
INSERT INTO tb_pergunta (enunciado_pergunta, tipo_pergunta, fk_trilha) VALUES ('Estou disposto(a) a fazer sacrifícios no presente para alcançar meus objetivos futuros.', 'LIKERT', 3);
INSERT INTO tb_pergunta (enunciado_pergunta, tipo_pergunta, fk_trilha) VALUES ('Levo em conta minhas condições atuais (financeiras, familiares, tempo) ao planejar meu futuro.', 'LIKERT', 3);
INSERT INTO tb_pergunta (enunciado_pergunta, tipo_pergunta, fk_trilha) VALUES ('Tenho objetivos claros para os próximos anos (ex: estudar, trabalhar, mudar de cidade, viajar).', 'LIKERT', 3);
INSERT INTO tb_pergunta (enunciado_pergunta, tipo_pergunta, fk_trilha) VALUES ('Consigo adaptar meus planos quando as circunstâncias mudam.', 'LIKERT', 3);
INSERT INTO tb_pergunta (enunciado_pergunta, tipo_pergunta, fk_trilha) VALUES ('Minhas decisões atuais estão contribuindo para o futuro que eu quero construir.', 'LIKERT', 3);
INSERT INTO tb_pergunta (enunciado_pergunta, tipo_pergunta, fk_trilha) VALUES ('Eu reflito sobre o que realmente é importante para mim antes de tomar decisões sobre o futuro.', 'LIKERT', 3);

INSERT INTO tb_opcao_pergunta (texto_opcao, peso_humanas, peso_biologicas, peso_exatas, peso_arte, fk_pergunta) VALUES ('Tecnologia e funcionamento de sistemas.', 0.0, 0.0, 10.0, 0.0, 1);
INSERT INTO tb_opcao_pergunta (texto_opcao, peso_humanas, peso_biologicas, peso_exatas, peso_arte, fk_pergunta) VALUES ('Comportamento humano e relações sociais.', 10.0, 0.0, 0.0, 0.0, 1);
INSERT INTO tb_opcao_pergunta (texto_opcao, peso_humanas, peso_biologicas, peso_exatas, peso_arte, fk_pergunta) VALUES ('Expressão artística e criatividade.', 0.0, 0.0, 0.0, 10.0, 1);
INSERT INTO tb_opcao_pergunta (texto_opcao, peso_humanas, peso_biologicas, peso_exatas, peso_arte, fk_pergunta) VALUES ('Organização, números e lógica.', 0.0, 0.0, 10.0, 0.0, 1);
INSERT INTO tb_opcao_pergunta (texto_opcao, peso_humanas, peso_biologicas, peso_exatas, peso_arte, fk_pergunta) VALUES ('Natureza, saúde e bem-estar.', 0.0, 10.0, 0.0, 0.0, 1);
INSERT INTO tb_opcao_pergunta (texto_opcao, peso_humanas, peso_biologicas, peso_exatas, peso_arte, fk_pergunta) VALUES ('Política, história e atualidades.', 10.0, 0.0, 0.0, 0.0, 1);

INSERT INTO tb_opcao_pergunta (texto_opcao, peso_humanas, peso_biologicas, peso_exatas, peso_arte, fk_pergunta) VALUES ('Resolver problemas lógicos ou matemáticos.', 0.0, 0.0, 10.0, 0.0, 2);
INSERT INTO tb_opcao_pergunta (texto_opcao, peso_humanas, peso_biologicas, peso_exatas, peso_arte, fk_pergunta) VALUES ('Escrever textos ou expressar ideias com clareza.', 5.0, 0.0, 0.0, 5.0, 2);
INSERT INTO tb_opcao_pergunta (texto_opcao, peso_humanas, peso_biologicas, peso_exatas, peso_arte, fk_pergunta) VALUES ('Trabalhar em equipe e mediar conflitos.', 10.0, 0.0, 0.0, 0.0, 2);
INSERT INTO tb_opcao_pergunta (texto_opcao, peso_humanas, peso_biologicas, peso_exatas, peso_arte, fk_pergunta) VALUES ('Aprender a usar novas ferramentas digitais.', 0.0, 0.0, 10.0, 0.0, 2);
INSERT INTO tb_opcao_pergunta (texto_opcao, peso_humanas, peso_biologicas, peso_exatas, peso_arte, fk_pergunta) VALUES ('Organizar tarefas e cumprir prazos.', 4.0, 0.0, 6.0, 0.0, 2);

INSERT INTO tb_opcao_pergunta (texto_opcao, peso_humanas, peso_biologicas, peso_exatas, peso_arte, fk_pergunta) VALUES ('Ambientes dinâmicos, com muita interação social e trocas constantes.', 7.0, 3.0, 0.0, 0.0, 3);
INSERT INTO tb_opcao_pergunta (texto_opcao, peso_humanas, peso_biologicas, peso_exatas, peso_arte, fk_pergunta) VALUES ('Ambientes tranquilos, onde posso ter foco individual e autonomia.', 0.0, 0.0, 7.0, 3.0, 3);

INSERT INTO tb_opcao_pergunta (texto_opcao, peso_humanas, peso_biologicas, peso_exatas, peso_arte, fk_pergunta) VALUES ('Criar coisas novas (desenhos, códigos, textos, receitas).', 0.0, 0.0, 4.0, 6.0, 4);
INSERT INTO tb_opcao_pergunta (texto_opcao, peso_humanas, peso_biologicas, peso_exatas, peso_arte, fk_pergunta) VALUES ('Ajudar pessoas a resolverem problemas pessoais.', 8.0, 2.0, 0.0, 0.0, 4);
INSERT INTO tb_opcao_pergunta (texto_opcao, peso_humanas, peso_biologicas, peso_exatas, peso_arte, fk_pergunta) VALUES ('Analisar dados, fatos ou notícias.', 4.0, 0.0, 6.0, 0.0, 4);
INSERT INTO tb_opcao_pergunta (texto_opcao, peso_humanas, peso_biologicas, peso_exatas, peso_arte, fk_pergunta) VALUES ('Praticar esportes ou atividades físicas.', 0.0, 8.0, 0.0, 2.0, 4);

INSERT INTO tb_opcao_pergunta (texto_opcao, peso_humanas, peso_biologicas, peso_exatas, peso_arte, fk_pergunta) VALUES ('Seguir rotinas muito rígidas e repetitivas.', 5.0, 0.0, 0.0, 5.0, 5); -- Indica perfil criativo/humano
INSERT INTO tb_opcao_pergunta (texto_opcao, peso_humanas, peso_biologicas, peso_exatas, peso_arte, fk_pergunta) VALUES ('Falar em público ou liderar reuniões.', 0.0, 3.0, 7.0, 0.0, 5); -- Indica perfil técnico/exatas
INSERT INTO tb_opcao_pergunta (texto_opcao, peso_humanas, peso_biologicas, peso_exatas, peso_arte, fk_pergunta) VALUES ('Estudar temas teóricos muito densos.', 0.0, 4.0, 6.0, 0.0, 5); -- Indica perfil prático/aplicado
INSERT INTO tb_opcao_pergunta (texto_opcao, peso_humanas, peso_biologicas, peso_exatas, peso_arte, fk_pergunta) VALUES ('Lidar com tarefas burocráticas e manuais.', 3.0, 0.0, 2.0, 5.0, 5);

INSERT INTO tb_opcao_pergunta (texto_opcao, peso_humanas, peso_biologicas, peso_exatas, peso_arte, fk_pergunta) VALUES ('Viajar e conhecer novas culturas.', 6.0, 0.0, 0.0, 4.0, 6);
INSERT INTO tb_opcao_pergunta (texto_opcao, peso_humanas, peso_biologicas, peso_exatas, peso_arte, fk_pergunta) VALUES ('Aprender um novo idioma ou habilidade técnica.', 3.0, 0.0, 7.0, 0.0, 6);
INSERT INTO tb_opcao_pergunta (texto_opcao, peso_humanas, peso_biologicas, peso_exatas, peso_arte, fk_pergunta) VALUES ('Praticar um hobby artístico ou manual.', 0.0, 2.0, 0.0, 8.0, 6);
INSERT INTO tb_opcao_pergunta (texto_opcao, peso_humanas, peso_biologicas, peso_exatas, peso_arte, fk_pergunta) VALUES ('Participar de projetos voluntários ou sociais.', 8.0, 2.0, 0.0, 0.0, 6);

INSERT INTO tb_opcao_pergunta (texto_opcao, peso_humanas, peso_biologicas, peso_exatas, peso_arte, fk_pergunta) VALUES ('O reconhecimento financeiro e status social.', 3.0, 0.0, 7.0, 0.0, 7);
INSERT INTO tb_opcao_pergunta (texto_opcao, peso_humanas, peso_biologicas, peso_exatas, peso_arte, fk_pergunta) VALUES ('O impacto positivo que causei na vida de alguém.', 6.0, 4.0, 0.0, 0.0, 7);
INSERT INTO tb_opcao_pergunta (texto_opcao, peso_humanas, peso_biologicas, peso_exatas, peso_arte, fk_pergunta) VALUES ('A superação de um desafio técnico difícil.', 0.0, 0.0, 10.0, 0.0, 7);
INSERT INTO tb_opcao_pergunta (texto_opcao, peso_humanas, peso_biologicas, peso_exatas, peso_arte, fk_pergunta) VALUES ('O equilíbrio entre o trabalho e meu tempo livre.', 2.0, 2.0, 2.0, 4.0, 7);

INSERT INTO tb_opcao_pergunta (texto_opcao, peso_humanas, peso_biologicas, peso_exatas, peso_arte, fk_pergunta) VALUES ('Sentir que estou fazendo algo que vai contra meus princípios éticos.', 6.0, 4.0, 0.0, 0.0, 8);
INSERT INTO tb_opcao_pergunta (texto_opcao, peso_humanas, peso_biologicas, peso_exatas, peso_arte, fk_pergunta) VALUES ('Sentir que minhas habilidades não estão sendo aproveitadas.', 0.0, 0.0, 5.0, 5.0, 8);

INSERT INTO tb_opcao_pergunta (texto_opcao, peso_humanas, peso_biologicas, peso_exatas, peso_arte, fk_pergunta) VALUES ('(1) Prefiro focar no que já sei fazer.', 2.0, 3.0, 5.0, 0.0, 9);
INSERT INTO tb_opcao_pergunta (texto_opcao, peso_humanas, peso_biologicas, peso_exatas, peso_arte, fk_pergunta) VALUES ('(5) Estou totalmente aberto a desafios fora da minha zona de conforto.', 3.0, 2.0, 3.0, 2.0, 9);

INSERT INTO tb_opcao_pergunta (texto_opcao, peso_humanas, peso_biologicas, peso_exatas, peso_arte, fk_pergunta) VALUES ('"O realizador": Gosto de ver resultados concretos e mãos na massa.', 0.0, 5.0, 5.0, 0.0, 10);
INSERT INTO tb_opcao_pergunta (texto_opcao, peso_humanas, peso_biologicas, peso_exatas, peso_arte, fk_pergunta) VALUES ('"O pensador": Gosto de entender os porquês e criar estratégias.', 4.0, 0.0, 6.0, 0.0, 10);
INSERT INTO tb_opcao_pergunta (texto_opcao, peso_humanas, peso_biologicas, peso_exatas, peso_arte, fk_pergunta) VALUES ('"O conector": Gosto de mediar pessoas e facilitar comunicações.', 8.0, 0.0, 0.0, 2.0, 10);