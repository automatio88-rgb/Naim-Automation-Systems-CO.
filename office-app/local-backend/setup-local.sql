-- LOCAL PREVIEW ONLY (VM / laptop): PostgREST login role + demo users.
-- Never run on Supabase. Run after auth-stub.sql, schema.sql, seed.sql.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'authenticator') then
    create role authenticator login noinherit password 'authenticator-local';
  end if;
end $$;
grant anon, authenticated, service_role to authenticator;
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to authenticated, service_role;
grant all on all sequences in schema public to authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;

-- demo logins (first user becomes owner via handle_new_user)
insert into auth.users (email, encrypted_password, raw_user_meta_data)
values ('owner@naim.demo', crypt('naim-demo', gen_salt('bf')), '{"full_name":"M.A. Salmin"}')
on conflict (email) do nothing;
insert into auth.users (email, encrypted_password, raw_user_meta_data)
values ('staff@naim.demo', crypt('naim-demo', gen_salt('bf')), '{"full_name":"Wanjiru Kamau"}')
on conflict (email) do nothing;
update public.profiles set role = 'owner' where email = 'owner@naim.demo';
update public.profiles set role = 'staff' where email = 'staff@naim.demo';
update public.staff set profile_id = (select id from public.profiles where email = 'owner@naim.demo') where full_name = 'M.A. Salmin' and is_demo;
update public.staff set profile_id = (select id from public.profiles where email = 'staff@naim.demo') where full_name = 'Wanjiru Kamau' and is_demo;