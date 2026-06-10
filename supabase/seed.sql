insert into public.support_categories (name)
values ('Acesso'), ('Cadastro'), ('Demandas'), ('Triagem'), ('LGPD')
on conflict (name) do nothing;

insert into public.notification_templates (key, title, body)
values
  ('profile_approved', 'Perfil aprovado', 'Seu cadastro foi aprovado pela equipe de triagem.'),
  ('process_status_update', 'Processo atualizado', 'Seu status no processo foi atualizado.'),
  ('support_ticket_response', 'Resposta do suporte', 'Um atendente respondeu seu chamado.')
on conflict (key) do update set title = excluded.title, body = excluded.body;
