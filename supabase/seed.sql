-- =====================================================================
-- NAIM COMMAND — DEMO SEED (every row is flagged is_demo = true)
-- Makes every screen render rich on first run. Dates are relative to now().
-- Remove all demo data at any time with:   select public.purge_demo_data();
-- =====================================================================

create or replace function public.purge_demo_data() returns void language plpgsql security definer set search_path = public as $$
begin
  delete from activities where is_demo; delete from notifications where is_demo;
  delete from automation_runs where is_demo; delete from automation_commands where requested_by = 'demo-seed';
  delete from payslips where is_demo; delete from payroll_runs where is_demo; delete from salary_advances where is_demo;
  delete from leave_requests where is_demo; delete from attendance where is_demo; delete from shifts where is_demo;
  delete from commissions where is_demo; delete from payments where is_demo; delete from invoices where is_demo;
  delete from till_sessions where is_demo; delete from day_closes where is_demo; delete from expenses where is_demo;
  delete from documents where is_demo or portal_submission_id in (select id from portal_submissions where fields->>'demo' = 'true');
  delete from portal_submissions where fields->>'demo' = 'true';
  delete from tasks where is_demo; delete from waitlist where is_demo; delete from appointments where is_demo;
  delete from client_packages where is_demo; delete from subscriptions where is_demo; delete from projects where is_demo;
  delete from deals where is_demo; delete from replies where is_demo; delete from outreach_messages where is_demo;
  update leads set converted_client_id = null where is_demo;
  delete from clients where is_demo; delete from leads where is_demo; delete from campaigns where is_demo;
  delete from purchase_orders where is_demo; delete from products where is_demo; delete from suppliers where is_demo;
  delete from packages where is_demo; delete from membership_plans where is_demo; delete from services where is_demo;
  delete from service_categories where is_demo; delete from staff where is_demo; delete from departments where is_demo;
  delete from businesses where is_demo;
end $$;

select public.purge_demo_data();

-- ---------- reference config (not demo: real defaults) ----------
insert into public.businesses (name, slug, kind, tagline, accent, is_primary)
values ('Naim Automation Systems Co.', 'naim', 'company', 'From chaos to clean systems on your phone', '#C8A24A', true)
on conflict (slug) do nothing;

insert into public.hermes_bots (name, display_name, role, routine, schedule, config) values
 ('scout',  'Scout',  'Lead sourcing',          'Source new licensed agencies, dedupe, insert as new',            '0 5 * * *',     '{"daily_target": 25}'),
 ('sage',   'Sage',   'Enrichment & scoring',   'Research each new lead, write dossier + personalization, score', '30 5 * * *',    '{"batch": 40}'),
 ('herald', 'Herald', 'Outreach',               'Send approved personalized outreach within limits',              '0 9-16 * * 1-6','{"max_touches": 3}'),
 ('echo',   'Echo',   'Replies & booking',      'Classify replies, draft responses, book discovery calls',        '*/15 * * * *',  '{}'),
 ('ledger', 'Ledger', 'Operations & reporting', 'Morning briefing, invoice watch, renewals, end-of-day summary',  '0 7,18 * * *',  '{"briefing_to": "telegram"}')
on conflict (name) do update set display_name = excluded.display_name, role = excluded.role, routine = excluded.routine;

insert into public.automation_settings (key, value, description) values
 ('outreach_paused',     'false', 'Global kill switch. When true, Herald sends nothing.'),
 ('min_score_threshold', '70',    'Only leads scoring at or above this are queued for outreach.'),
 ('daily_send_limit',    '40',    'Maximum outreach messages per day across all channels.'),
 ('approval_mode',       '"founder_approves"', 'auto_send | founder_approves'),
 ('send_window',         '{"start":"09:00","end":"17:00","tz":"Africa/Nairobi"}', 'Hours Herald may send.'),
 ('followup_spacing_days','3',    'Days between follow-up touches.')
on conflict (key) do nothing;

insert into public.app_settings (key, value) values
 ('company', '{"name":"Naim Automation Systems Co.","founder":"M.A. Salmin","city":"Nairobi, Kenya","phone":"+254 700 000 000","email":"hello@naimautomations.co.ke","kra_pin":"P000000000X"}'),
 ('banking', '{"mpesa_paybill":"000000","account":"NAIM","bank":"Equity Bank","bank_account":"0000000000","bank_branch":"Westlands"}'),
 ('tax',     '{"vat_pct":16,"vat_registered":false,"withholding_pct":5}'),
 ('invoice', '{"prefix":"NAS","terms_days":7,"footer":"Thank you for building with Naim Automation Systems Co."}')
on conflict (key) do nothing;

-- role × module permission matrix (owner always has full access in code)
insert into public.role_permissions (role, module, can_view, can_create, can_edit, can_delete)
select r.role, m.module,
  case r.role when 'admin' then true when 'manager' then m.module not in ('payroll','settings') when 'staff' then m.module in ('appointments','clients','tasks','services','pos','documents','memberships','inventory','cash_till','leads') else m.module in ('appointments','clients','tasks','services','reports','leads','deals','projects') end,
  case r.role when 'admin' then true when 'manager' then m.module not in ('payroll','settings','hermes') when 'staff' then m.module in ('appointments','clients','tasks','pos','cash_till') else false end,
  case r.role when 'admin' then true when 'manager' then m.module not in ('payroll','settings','hermes') when 'staff' then m.module in ('appointments','tasks') else false end,
  case r.role when 'admin' then m.module <> 'settings' when 'manager' then m.module in ('tasks','appointments','leads') else false end
from (values ('admin'),('manager'),('staff'),('viewer')) r(role)
cross join (values ('leads'),('clients'),('deals'),('projects'),('appointments'),('tasks'),('services'),('memberships'),('pos'),('inventory'),('purchases'),('expenses'),('finance'),('payroll'),('cash_till'),('staff'),('documents'),('reports'),('hermes'),('settings')) m(module)
on conflict (role, module) do nothing;

-- ---------- DEMO DATA ----------
do $$
declare
  biz uuid; side uuid;
  dep_ids uuid[] := '{}'; staff_ids uuid[] := '{}'; sid uuid;
  cat_sys uuid; cat_ai uuid; cat_web uuid; cat_care uuid;
  sv_ops uuid; sv_wa uuid; sv_db uuid; sv_doc uuid; sv_web uuid; sv_train uuid; sv_audit uuid; sv_bot uuid;
  pl_ids uuid[] := '{}'; pk_ids uuid[] := '{}'; sup_ids uuid[] := '{}'; prod_ids uuid[] := '{}'; camp_ids uuid[] := '{}';
  pre text[] := array['Redbird','Gulf Bridge','Al-Noor','Savannah','Jamii','Tumaini','Baraka','Horizon','Crescent','Elite Link','Pwani','Kilimanjaro','Zawadi','Faraja','Amani','Sky Link','Oasis','Mwangaza','Nyota','Upendo'];
  suf text[] := array['Recruitment Agency','Manpower Services','Employment Bureau','Staffing Ltd','Overseas Placements','HR Consultants'];
  locs text[] := array['Nairobi CBD','Westlands','Eastleigh','Mombasa','Kisumu','Nakuru','Thika','Eldoret','Kilimani','Machakos'];
  fns text[] := array['Amina','Hassan','Grace','Peter','Fatuma','John','Mercy','Ali','Esther','Daniel','Zainab','Samuel','Halima','Joseph','Wairimu','Omar','Lucy','Ibrahim','Naomi','Yusuf'];
  lns text[] := array['Mohamed','Otieno','Wanjiku','Kamau','Abdi','Mwangi','Achieng','Hussein','Njoroge','Chebet','Omondi','Said','Kiplagat','Mutua','Barasa'];
  st text; sc int; q text; lid uuid; cid uuid; did uuid; pid uuid; iid uuid; subid uuid; aid uuid; tid uuid;
  created timestamptz; won timestamptz; sent timestamptz; i int; k int; r float; v numeric; dp numeric; nm text; cn text; loc text; sz text; src text; pst text; prog int;
  conv_n int := 0; pay_ref text; rid uuid; d date;
begin
  perform setseed(0.42);
  select id into biz from businesses where slug = 'naim';
  insert into businesses (name, slug, kind, tagline, accent, is_demo)
  values ('Naim Studio (side business)', 'naim-studio', 'side_business', 'Branding & photography side business', '#8E3B46', true) returning id into side;

  -- departments & staff
  insert into departments (name, description, color, is_demo) values
   ('Leadership','Founder office & strategy','#C8A24A',true),('Sales','Lead engine, consultations, deals','#3B82F6',true),
   ('Delivery','Building & handing over systems','#10B981',true),('Operations','Admin, support, care plans','#F59E0B',true),
   ('Finance','Invoices, payments, payroll','#8B5CF6',true);
  select array_agg(id order by created_at, name) into dep_ids from departments where is_demo;
  select array_agg(id) into dep_ids from (select id from departments where is_demo order by array_position(array['Leadership','Sales','Delivery','Operations','Finance'], name)) x;

  insert into staff (full_name, title, phone, email, department_id, employment_type, base_salary_kes, commission_pct, hired_at, color, skills, is_demo) values
   ('M.A. Salmin','Founder & Systems Architect','+254700000001','salmin@naimautomations.co.ke',dep_ids[1],'full_time',0,0,current_date - 400,'#C8A24A','{automation,sales,ai}',true),
   ('Amina Yusuf','Sales & Consultation Lead','+254700000002','amina@naimautomations.co.ke',dep_ids[2],'full_time',65000,5,current_date - 210,'#3B82F6','{consultations,whatsapp,closing}',true),
   ('Brian Otieno','Automation Engineer','+254700000003','brian@naimautomations.co.ke',dep_ids[3],'full_time',90000,2,current_date - 180,'#10B981','{python,supabase,react}',true),
   ('Wanjiru Kamau','Client Success & Care Plans','+254700000004','wanjiru@naimautomations.co.ke',dep_ids[4],'full_time',55000,3,current_date - 150,'#F59E0B','{training,support}',true),
   ('Kevin Mutua','Junior Developer','+254700000005','kevin@naimautomations.co.ke',dep_ids[3],'contract',45000,0,current_date - 90,'#06B6D4','{frontend,qa}',true),
   ('Faith Chebet','Finance & Admin','+254700000006','faith@naimautomations.co.ke',dep_ids[5],'part_time',38000,0,current_date - 60,'#8B5CF6','{bookkeeping,mpesa}',true);
  select array_agg(id) into staff_ids from (select id from staff where is_demo order by hired_at) x;
  -- order by hired_at asc: founder first
  for i in 1..5 loop update departments set head_staff_id = staff_ids[case i when 1 then 1 when 2 then 2 when 3 then 3 when 4 then 4 else 6 end] where id = dep_ids[i]; end loop;

  -- catalogue
  insert into service_categories (business_id, name, color, sort, is_demo) values (biz,'Agency Systems','#C8A24A',1,true) returning id into cat_sys;
  insert into service_categories (business_id, name, color, sort, is_demo) values (biz,'AI & Bots','#3B82F6',2,true) returning id into cat_ai;
  insert into service_categories (business_id, name, color, sort, is_demo) values (biz,'Web & Booking','#10B981',3,true) returning id into cat_web;
  insert into service_categories (business_id, name, color, sort, is_demo) values (biz,'Care & Training','#8B5CF6',4,true) returning id into cat_care;
  insert into services (business_id, category_id, name, description, price_kes, duration_min, delivery_days, commission_pct, is_demo) values
   (biz,cat_sys,'Agency Operations System','Candidate pipeline, documents, medicals, visas and employer tracking in one phone-first system',180000,90,21,5,true) returning id into sv_ops;
  insert into services (business_id, category_id, name, description, price_kes, duration_min, delivery_days, commission_pct, is_demo) values
   (biz,cat_ai,'WhatsApp Lead & Candidate Bot','24/7 WhatsApp assistant that captures candidates and answers FAQs',65000,60,10,5,true) returning id into sv_wa;
  insert into services (business_id, category_id, name, description, price_kes, duration_min, delivery_days, commission_pct, is_demo) values
   (biz,cat_sys,'Candidate Database Migration','Move paper files and Excel sheets into a clean searchable database',45000,60,7,3,true) returning id into sv_db;
  insert into services (business_id, category_id, name, description, price_kes, duration_min, delivery_days, commission_pct, is_demo) values
   (biz,cat_sys,'Document Automation Pack','Auto-generated contracts, offer letters and NEA forms',55000,60,10,3,true) returning id into sv_doc;
  insert into services (business_id, category_id, name, description, price_kes, duration_min, delivery_days, commission_pct, is_demo) values
   (biz,cat_web,'Agency Website + Online Booking','Premium website with candidate registration and employer enquiry forms',85000,60,14,4,true) returning id into sv_web;
  insert into services (business_id, category_id, name, description, price_kes, duration_min, delivery_days, commission_pct, is_demo) values
   (biz,cat_care,'Team Training Session','Hands-on training for agency staff (up to 8 people)',15000,120,1,2,true) returning id into sv_train;
  insert into services (business_id, category_id, name, description, price_kes, duration_min, delivery_days, commission_pct, is_demo) values
   (biz,cat_sys,'Free Operations Audit','45-minute Google Meet consultation mapping current admin chaos',0,45,0,0,true) returning id into sv_audit;
  insert into services (business_id, category_id, name, description, price_kes, duration_min, delivery_days, commission_pct, is_demo) values
   (biz,cat_ai,'AI Follow-up Assistant','Automated reminders to candidates and employers via SMS & WhatsApp',40000,45,7,4,true) returning id into sv_bot;

  insert into membership_plans (business_id, name, price_kes, billing_cycle, benefits, discount_pct, included_hours, color, is_demo) values
   (biz,'Care Plan Essential',12000,'monthly','["Hosting & backups","Bug fixes","WhatsApp support (business hours)"]',0,2,'#94A3B8',true),
   (biz,'Care Plan Growth',25000,'monthly','["Everything in Essential","Monthly improvements","Priority support","Quarterly review call"]',5,6,'#C8A24A',true),
   (biz,'Care Plan Premium',45000,'monthly','["Everything in Growth","Dedicated engineer","New automations each month","Same-day support"]',10,14,'#8E3B46',true),
   (biz,'Annual Partner Plan',240000,'yearly','["Growth plan for 12 months","2 months free","Free training sessions"]',15,72,'#10B981',true);
  select array_agg(id) into pl_ids from (select id from membership_plans where is_demo order by price_kes) x;

  insert into packages (business_id, name, description, items, price_kes, validity_days, is_demo) values
   (biz,'Starter Digital Agency','Website + WhatsApp bot + training', jsonb_build_array(jsonb_build_object('service_id',sv_web,'name','Agency Website + Online Booking','qty',1), jsonb_build_object('service_id',sv_wa,'name','WhatsApp Lead & Candidate Bot','qty',1), jsonb_build_object('service_id',sv_train,'name','Team Training Session','qty',1)),140000,120,true),
   (biz,'Full Command Suite','Operations system + migration + document pack + 2 trainings', jsonb_build_array(jsonb_build_object('service_id',sv_ops,'name','Agency Operations System','qty',1), jsonb_build_object('service_id',sv_db,'name','Candidate Database Migration','qty',1), jsonb_build_object('service_id',sv_doc,'name','Document Automation Pack','qty',1), jsonb_build_object('service_id',sv_train,'name','Team Training Session','qty',2)),285000,180,true),
   (biz,'Training Bundle x4','Four training sessions to use within 6 months', jsonb_build_array(jsonb_build_object('service_id',sv_train,'name','Team Training Session','qty',4)),50000,180,true);
  select array_agg(id) into pk_ids from (select id from packages where is_demo order by price_kes) x;

  -- suppliers, products, purchase orders
  insert into suppliers (name, contact_name, phone, email, category, balance_kes, is_demo) values
   ('Phone Tech Wholesalers','Ali Hassan','+254711000001','sales@phonetech.co.ke','Hardware',38000,true),
   ('Safaricom Business','Account Manager','+254722000002','business@safaricom.co.ke','Connectivity',0,true),
   ('Truehost Kenya','Support','+254733000003','billing@truehost.co.ke','Hosting & domains',4500,true),
   ('Nairobi Print Hub','Mercy Achieng','+254744000004','orders@printhub.co.ke','Printing',12000,true),
   ('OpenRouter / AI APIs','Billing','+10000000000','billing@openrouter.ai','AI services',0,true);
  select array_agg(id) into sup_ids from (select id from suppliers where is_demo order by name) x;
  insert into products (business_id, supplier_id, name, sku, category, unit, cost_kes, price_kes, stock_qty, reorder_level, is_demo) values
   (biz,sup_ids[3],'Android Tablet 10" (agency kiosk)','HW-TAB-10','Hardware','unit',14500,21000,6,3,true),
   (biz,sup_ids[3],'Thermal Receipt Printer','HW-PRN-58','Hardware','unit',6200,9500,2,2,true),
   (biz,sup_ids[5],'Business SIM + 30GB bundle','CN-SIM-30','Connectivity','pack',1500,2500,14,5,true),
   (biz,sup_ids[4],'.co.ke Domain (1 year)','DM-COKE-1Y','Hosting & domains','licence',1200,2500,20,5,true),
   (biz,sup_ids[4],'Business Hosting (1 year)','HS-BIZ-1Y','Hosting & domains','licence',6500,12000,8,3,true),
   (biz,sup_ids[1],'Branded Client Welcome Kit','PR-KIT-01','Printing','kit',900,0,25,10,true),
   (biz,sup_ids[2],'AI Credits (USD 50 block)','AI-CR-50','AI services','block',6500,0,3,2,true),
   (biz,sup_ids[1],'Laminated QR Registration Stand','PR-QR-01','Printing','unit',450,1500,1,5,true);
  select array_agg(id) into prod_ids from (select id from products where is_demo order by sku) x;
  insert into purchase_orders (supplier_id, status, items, total_kes, paid_kes, ordered_at, expected_at, received_at, is_demo) values
   (sup_ids[3],'received','[{"name":"Android Tablet 10\" (agency kiosk)","qty":4,"unit_cost_kes":14500,"received_qty":4}]',58000,58000,current_date-40,current_date-33,current_date-32,true),
   (sup_ids[4],'received','[{"name":".co.ke Domain (1 year)","qty":10,"unit_cost_kes":1200,"received_qty":10},{"name":"Business Hosting (1 year)","qty":4,"unit_cost_kes":6500,"received_qty":4}]',38000,33500,current_date-25,current_date-24,current_date-24,true),
   (sup_ids[1],'partial','[{"name":"Branded Client Welcome Kit","qty":30,"unit_cost_kes":900,"received_qty":20},{"name":"Laminated QR Registration Stand","qty":10,"unit_cost_kes":450,"received_qty":0}]',31500,19500,current_date-9,current_date-2,null,true),
   (sup_ids[3],'ordered','[{"name":"Thermal Receipt Printer","qty":3,"unit_cost_kes":6200,"received_qty":0}]',18600,0,current_date-3,current_date+4,null,true),
   (sup_ids[5],'draft','[{"name":"AI Credits (USD 50 block)","qty":4,"unit_cost_kes":6500,"received_qty":0}]',26000,0,null,current_date+7,null,true);

  -- campaigns
  insert into campaigns (name, channel, status, steps, daily_limit, is_demo) values
   ('NEA Agencies — Gulf placements','email','active','[{"step":1,"delay_days":0,"subject":"{{agency}}: admin chaos to clean systems"},{"step":2,"delay_days":3,"subject":"Quick idea for {{agency}}"},{"step":3,"delay_days":7,"subject":"Close the loop?"}]',30,true),
   ('WhatsApp warm intro','whatsapp','active','[{"step":1,"delay_days":0},{"step":2,"delay_days":4}]',20,true),
   ('Referral partners Q3','email','paused','[{"step":1,"delay_days":0}]',10,true);
  select array_agg(id) into camp_ids from (select id from campaigns where is_demo order by name) x;

  -- leads (120) and their whole downstream history
  for i in 1..120 loop
    nm := pre[1 + (i-1) % 20] || ' ' || suf[1 + (i-1) / 20];
    loc := locs[1 + floor(random()*10)::int];
    sz := (array['1-5','6-15','16-40','40+'])[1 + floor(random()*4)::int];
    cn := fns[1 + floor(random()*20)::int] || ' ' || lns[1 + floor(random()*15)::int];
    r := random();
    st := case when r < .17 then 'new' when r < .33 then 'enriched' when r < .46 then 'queued' when r < .63 then 'sent'
               when r < .74 then 'replied' when r < .82 then 'booked' when r < .93 then 'converted' else 'dead' end;
    sc := case st when 'new' then 0 when 'dead' then 20 + floor(random()*35)::int
                  when 'replied' then 66 + floor(random()*30)::int when 'booked' then 72 + floor(random()*26)::int when 'converted' then 75 + floor(random()*24)::int
                  when 'queued' then 70 + floor(random()*28)::int else 30 + floor(random()*66)::int end;
    q := case when sc >= 75 then 'high' when sc >= 50 then 'medium' else 'low' end;
    created := case st when 'new' then now() - random() * interval '3 days'
                       when 'converted' then now() - (40 + random()*45) * interval '1 day'
                       else now() - (4 + random()*35) * interval '1 day' end;
    r := random();
    src := case when r < .6 then 'scraper' when r < .8 then 'landing_page' when r < .92 then 'referral' else 'manual' end;
    insert into leads (business_id, business_name, contact_name, phone, email, website, location, licence_no, company_size, main_challenge, contacts, source, score, quality, status, dossier, personalization, tags, scraped_at, enriched_at, last_contacted_at, created_at, is_demo)
    values (biz, nm, cn, '+2547' || lpad(floor(random()*99999999)::text, 8, '0'),
      'info@' || lower(regexp_replace(pre[1 + (i-1) % 20], '[^a-zA-Z]', '', 'g')) || (1 + (i-1)/20) || '.co.ke',
      case when random() < .7 then 'https://' || lower(regexp_replace(pre[1 + (i-1) % 20], '[^a-zA-Z]', '', 'g')) || (1 + (i-1)/20) || '.co.ke' end,
      loc, 'NEA/RA/' || (1000 + i), sz,
      case when src = 'landing_page' then (array['Candidate documents get lost between WhatsApp groups','We miss employer follow-ups','Visa and medical status updates are manual','Too much paperwork for every placement'])[1 + floor(random()*4)::int] end,
      jsonb_build_array(jsonb_build_object('channel','whatsapp','value','+2547' || lpad(floor(random()*99999999)::text, 8, '0')), jsonb_build_object('channel','email','value','info@agency' || i || '.co.ke')),
      src, sc, q, st,
      case when st <> 'new' then format('%s is a NEA-licensed agency in %s placing mainly domestic, hospitality and security workers in Saudi Arabia, the UAE and Qatar. Team size %s. Operations run on WhatsApp groups, paper files and Excel. Pain signals: slow candidate document tracking, missed employer follow-ups, manual medical and visa status updates.', nm, loc, sz) end,
      case when st <> 'new' then jsonb_build_array(
         format('Noticed %s is actively recruiting for Gulf hospitality roles this month.', nm),
         'Your team still tracks passports and medicals across WhatsApp groups. We turn that into one live dashboard on your phone.',
         format('Agencies of your size in %s typically win back 12 to 15 hours a week once visa status updates are automated.', loc)) else '[]'::jsonb end,
      case when sc >= 85 then '{priority}'::text[] else '{}'::text[] end,
      case when src = 'scraper' then created end,
      case when st <> 'new' then created + interval '5 hours' end,
      case when st in ('sent','replied','booked','converted') then least(created + interval '2 days', now() - interval '2 hours') end,
      created, true)
    returning id into lid;

    if st in ('sent','replied','booked','converted') then
      sent := least(created + interval '2 days', now() - interval '2 hours');
      insert into outreach_messages (lead_id, campaign_id, channel, step, subject, body, status, sent_at, created_at, is_demo)
      values (lid, camp_ids[case when random() < .7 then 2 else 3 end], case when random() < .7 then 'email' else 'whatsapp' end, 1,
              nm || ': admin chaos to clean systems',
              format('Hi %s, I''m Salmin from Naim Automation Systems. I noticed %s is placing candidates in the Gulf. Most agencies your size lose hours every week chasing passports, medicals and visa updates on WhatsApp. We build phone-first systems that make that automatic. Open to a free 30-minute operations audit this week?', split_part(cn,' ',1), nm),
              case when st = 'sent' then (array['sent','delivered'])[1 + floor(random()*2)::int] else 'replied' end, sent, sent - interval '1 hour', true);
      if st = 'sent' and random() < .4 then
        insert into outreach_messages (lead_id, campaign_id, channel, step, subject, body, status, sent_at, created_at, is_demo)
        values (lid, camp_ids[2], 'email', 2, 'Quick idea for ' || nm, 'Following up with one concrete idea: a single dashboard showing every candidate''s documents, medical and visa stage.', 'queued', null, now(), true);
      end if;
    end if;

    if st in ('replied','booked','converted') then
      insert into replies (lead_id, channel, body, intent, sentiment, received_at, is_demo)
      values (lid, 'email',
        (array['Yes, this is exactly our problem. Can we talk this week?','How much does a system like this cost?','Interesting. We are busy this month, maybe next month.','Please share more details on WhatsApp.'])[case when st = 'replied' then 1 + floor(random()*4)::int else 1 end],
        case when st = 'replied' then (array['interested','question','not_now','question'])[1 + floor(random()*4)::int] else 'interested' end,
        'positive', least(sent + interval '20 hours', now() - interval '1 hour'), true);
    end if;

    if st = 'booked' then
      k := floor(random()*7)::int;
      insert into appointments (business_id, lead_id, staff_id, title, type, services, starts_at, ends_at, meet_link, status, source, notes, is_demo)
      values (biz, lid, staff_ids[case when random() < .6 then 1 else 2 end], 'Discovery call: ' || nm, 'discovery_call',
              jsonb_build_array(jsonb_build_object('service_id', sv_audit, 'name', 'Free Operations Audit', 'price_kes', 0, 'duration_min', 45)),
              ((current_date + k)::timestamp + (array[time '10:00', time '11:30', time '14:00', time '15:30'])[1 + floor(random()*4)::int]) at time zone 'Africa/Nairobi',
              ((current_date + k)::timestamp + time '16:15') at time zone 'Africa/Nairobi',
              'https://meet.google.com/' || substr(md5(random()::text),1,3) || '-' || substr(md5(random()::text),1,4) || '-' || substr(md5(random()::text),1,3),
              case when k = 0 then 'confirmed' else 'booked' end, 'hermes', 'Booked by Echo after a positive reply.', true);
      update appointments set ends_at = starts_at + interval '45 minutes' where lead_id = lid;
      insert into deals (business_id, lead_id, title, value_kes, stage, probability, expected_close, created_at, is_demo)
      values (biz, lid, nm || ' — Operations System', (array[85000,140000,180000,240000,285000])[1 + floor(random()*5)::int],
              (array['discovery','consultation','proposal'])[1 + floor(random()*3)::int], 30, current_date + 14 + floor(random()*20)::int, created + interval '3 days', true);
    end if;

    if st = 'dead' and random() < .5 then
      insert into deals (business_id, lead_id, title, value_kes, stage, probability, lost_at, lost_reason, created_at, is_demo)
      values (biz, lid, nm || ' — Website + Bot', 140000, 'lost', 0, created + interval '9 days', (array['Budget too small this quarter','Chose to stay on Excel','No response after proposal'])[1 + floor(random()*3)::int], created + interval '4 days', true);
    end if;

    if st = 'converted' then
      conv_n := conv_n + 1;
      insert into clients (business_id, lead_id, business_name, contact_name, phone, email, location, licence_no, company_size, tier, health, tags, notes, source, created_at, is_demo)
      select biz, l.id, l.business_name, l.contact_name, l.phone, l.email, l.location, l.licence_no, l.company_size,
             (array['standard','gold','platinum'])[1 + floor(random()*3)::int], 55 + floor(random()*45)::int, '{}', l.dossier, l.source, created + interval '12 days', true
      from leads l where l.id = lid returning id into cid;
      update leads set converted_client_id = cid where id = lid;

      v := (array[85000,140000,180000,240000,285000,320000])[1 + floor(random()*6)::int];
      won := created + interval '14 days';
      insert into deals (business_id, client_id, lead_id, title, value_kes, stage, probability, expected_close, won_at, created_at, owner_id, is_demo)
      values (biz, cid, lid, (select business_name from leads where id = lid) || ' — ' || (array['Operations System','Full Command Suite','Website + WhatsApp Bot'])[1 + floor(random()*3)::int],
              v, 'won', 100, won::date, won, created + interval '4 days', null, true) returning id into did;

      pst := (array['delivered','in_care_plan','in_care_plan','in_build','review','live_demo','materials_pending'])[1 + floor(random()*7)::int];
      prog := case pst when 'materials_pending' then 10 when 'in_build' then 45 + floor(random()*30)::int when 'review' then 80 when 'live_demo' then 90 else 100 end;
      insert into projects (business_id, client_id, deal_id, name, status, priority, started_at, due_at, delivered_at, materials_checklist, progress, budget_kes, lead_staff_id, created_at, is_demo)
      values (biz, cid, did, (select business_name from clients where id = cid) || ' build', pst, (array['medium','high'])[1 + floor(random()*2)::int],
              (won + interval '1 day')::date, (won + interval '22 days')::date,
              case when pst in ('delivered','in_care_plan') then (won + interval '19 days')::date end,
              jsonb_build_array(
                jsonb_build_object('item','Contact person assigned','done',true),
                jsonb_build_object('item','System credentials shared','done',pst <> 'materials_pending'),
                jsonb_build_object('item','Process walkthrough recorded','done',pst <> 'materials_pending'),
                jsonb_build_object('item','Sample candidate data','done',pst not in ('materials_pending','in_build')),
                jsonb_build_object('item','Branding assets','done',pst not in ('materials_pending')),
                jsonb_build_object('item','50% deposit received','done',true)),
              prog, v, staff_ids[3], won + interval '1 day', true) returning id into pid;

      -- 50/50 invoices, to the shilling
      dp := round(v / 2, 0);
      insert into invoices (business_id, client_id, deal_id, project_id, staff_id, type, line_items, status, issued_at, due_date, created_at, is_demo)
      values (biz, cid, did, pid, staff_ids[2], 'deposit', jsonb_build_array(jsonb_build_object('kind','service','name','50% deposit — ' || (select title from deals where id = did),'qty',1,'unit_price_kes',dp)),
              'sent', won::date, (won + interval '3 days')::date, won, true) returning id into iid;
      insert into payments (invoice_id, amount_kes, method, reference, paid_at, received_by, is_demo)
      values (iid, dp, case when random() < .7 then 'mpesa' else 'bank' end, upper(substr(md5(random()::text),1,10)), won + interval '1 day', staff_ids[6], true);
      insert into commissions (invoice_id, staff_id, kind, amount_kes, status, created_at, is_demo) values (iid, staff_ids[2], 'commission', round(dp * 0.05, 2), case when random() < .6 then 'paid' else 'pending' end, won + interval '1 day', true);

      insert into invoices (business_id, client_id, deal_id, project_id, staff_id, type, line_items, status, issued_at, due_date, created_at, is_demo)
      values (biz, cid, did, pid, staff_ids[2], 'balance', jsonb_build_array(jsonb_build_object('kind','service','name','50% balance on delivery — ' || (select title from deals where id = did),'qty',1,'unit_price_kes',v - dp)),
              case when pst in ('delivered','in_care_plan','live_demo','review') then 'sent' else 'draft' end,
              (won + interval '18 days')::date,
              case when pst in ('live_demo','review') and random() < .5 then (current_date - (3 + floor(random()*40)::int)) else (won + interval '25 days')::date end,
              won + interval '18 days', true) returning id into iid;
      if pst in ('delivered','in_care_plan') then
        insert into payments (invoice_id, amount_kes, method, reference, paid_at, received_by, is_demo)
        values (iid, v - dp, 'mpesa', upper(substr(md5(random()::text),1,10)), least(won + interval '21 days', now() - interval '1 day'), staff_ids[6], true);
      elsif pst = 'live_demo' and random() < .5 then
        insert into payments (invoice_id, amount_kes, method, reference, paid_at, received_by, is_demo)
        values (iid, round((v - dp) / 2, 0), 'mpesa', upper(substr(md5(random()::text),1,10)), now() - interval '2 days', staff_ids[6], true);
      end if;
      update invoices set status = 'overdue' where id = iid and status = 'sent' and due_date < current_date;

      if pst in ('delivered','in_care_plan') then
        k := 1 + floor(random()*3)::int;
        insert into subscriptions (client_id, plan_id, amount_kes, billing_cycle, status, started_at, next_due, is_demo)
        select cid, p.id, p.price_kes, 'monthly', case when random() < .88 then 'active' else 'past_due' end, (won + interval '22 days')::date,
               (date_trunc('month', current_date) + interval '1 month')::date + (floor(random()*10))::int, true
        from membership_plans p where p.id = pl_ids[k] returning id into subid;
        for j in 0..1 loop
          d := (date_trunc('month', current_date) - (j * interval '1 month'))::date;
          if d > (won + interval '22 days')::date then
            insert into invoices (business_id, client_id, subscription_id, type, line_items, status, issued_at, due_date, created_at, is_demo)
            select biz, cid, subid, 'subscription', jsonb_build_array(jsonb_build_object('kind','plan','ref_id',p.id,'name',p.name || ' — ' || to_char(d,'Mon YYYY'),'qty',1,'unit_price_kes',p.price_kes)), 'sent', d, d + 7, d, true
            from membership_plans p where p.id = pl_ids[k] returning id into iid;
            if j = 1 or random() < .7 then
              insert into payments (invoice_id, amount_kes, method, reference, paid_at, received_by, is_demo)
              select iid, total_kes, 'mpesa', upper(substr(md5(random()::text),1,10)), least(d + 2, current_date)::timestamptz + interval '10 hours', staff_ids[6], true from invoices where id = iid;
            end if;
          end if;
        end loop;
      end if;

      if random() < .4 then
        insert into client_packages (client_id, package_id, sessions_total, sessions_used, purchased_at, expires_at, status, is_demo)
        values (cid, pk_ids[1], 4, floor(random()*4)::int, won::date, (won + interval '180 days')::date, 'active', true);
      end if;

      insert into appointments (business_id, client_id, lead_id, staff_id, title, type, services, starts_at, ends_at, meet_link, status, source, notes, created_at, is_demo)
      values (biz, cid, lid, staff_ids[1], 'Consultation & signing: ' || (select business_name from clients where id = cid), 'onboarding',
              jsonb_build_array(jsonb_build_object('service_id', sv_audit, 'name','Free Operations Audit','price_kes',0,'duration_min',45)),
              created + interval '11 days', created + interval '11 days 45 minutes', 'https://meet.google.com/abc-defg-hij', 'completed', 'hermes',
              'Signed onboarding guide and quotation live on the call.', created + interval '9 days', true);

      if conv_n <= 6 then
        insert into portal_submissions (doc_type, client_name, agency_name, email, phone, fields, signature_data, agreed, created_at)
        select 'onboarding', c.contact_name, c.business_name, c.email, c.phone, '{"demo":"true","role":"Director"}', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', true, created + interval '11 days' from clients c where c.id = cid;
        insert into portal_submissions (doc_type, client_name, agency_name, email, phone, fields, signature_data, agreed, created_at)
        select 'quotation', c.contact_name, c.business_name, c.email, c.phone, jsonb_build_object('demo','true','package','Full Command Suite','total_kes', v), 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', true, created + interval '11 days 20 minutes' from clients c where c.id = cid;
      end if;
    end if;
  end loop;

  -- referral clients mid-pipeline (contract / deposit stage)
  for i in 1..3 loop
    insert into clients (business_id, business_name, contact_name, phone, email, location, licence_no, company_size, tier, health, source, notes, created_at, is_demo)
    values (biz, (array['Maisha Bora Agencies','Royal Gulf Recruiters','Neema Placements'])[i], (array['Hassan Abdi','Grace Wanjiku','Peter Kamau'])[i],
            '+25471200000' || i, 'director@client' || i || '.co.ke', (array['Eastleigh','Mombasa','Nairobi CBD'])[i], 'NEA/RA/2' || i || '00', '16-40', 'gold', 80, 'referral',
            'Referred by an existing client. Wants the Full Command Suite.', now() - (6 + i*3) * interval '1 day', true) returning id into cid;
    insert into deals (business_id, client_id, title, value_kes, stage, probability, expected_close, created_at, is_demo)
    values (biz, cid, (array['Maisha Bora Agencies','Royal Gulf Recruiters','Neema Placements'])[i] || ' — Full Command Suite', 285000,
            (array['contract','deposit_paid','proposal'])[i], (array[75,90,50])[i], current_date + 5 + i*4, now() - (5 + i*3) * interval '1 day', true);
  end loop;

  -- side business demo client
  insert into clients (business_id, business_name, contact_name, phone, email, location, tier, health, source, notes, is_demo)
  values (side, 'Kilele Events', 'Naomi Barasa', '+254712999000', 'naomi@kilele.co.ke', 'Kilimani', 'standard', 75, 'referral', 'Side business: brand shoot + logo refresh.', true);

  -- today's office: queue, walk-ins, My Day
  insert into appointments (business_id, client_id, staff_id, title, type, services, starts_at, ends_at, status, queue_no, source, notes, is_demo)
  select biz, c.id, staff_ids[x.s], x.t || ': ' || c.business_name, x.ty,
         jsonb_build_array(jsonb_build_object('service_id', x.sv, 'name', (select name from services where id = x.sv), 'price_kes', (select price_kes from services where id = x.sv), 'duration_min', (select duration_min from services where id = x.sv))),
         ((current_date)::timestamp + x.at) at time zone 'Africa/Nairobi', ((current_date)::timestamp + x.at + interval '1 hour') at time zone 'Africa/Nairobi',
         x.status, x.qn, x.src, x.notes, true
  from (values (1,'Training session','review',sv_train,time '09:00','completed',1,'manual','Trained 6 staff on the candidate pipeline.'),
               (2,'Care plan review','review',sv_bot,time '10:30','in_progress',2,'manual','Quarterly review of automations.'),
               (4,'Walk-in support','walk_in',sv_train,time '11:15','checked_in',3,'walk_in','Walked in for a printer setup.'),
               (3,'Live demo','delivery',sv_ops,time '14:00','confirmed',null,'manual','Show the finished operations system.'),
               (2,'Proposal walkthrough','meeting',sv_wa,time '16:00','booked',null,'online','Bring pricing for the WhatsApp bot.')) x(s,t,ty,sv,at,status,qn,src,notes)
  cross join lateral (select id, business_name from clients where is_demo and business_id = biz order by created_at limit 1 offset (x.s)) c;

  insert into waitlist (client_name, phone, service_id, preferred_at, status, notes, is_demo) values
   ('Tumaini Staffing Ltd','+254701111222',sv_audit, now() + interval '1 day','waiting','Prefers mornings',true),
   ('Baraka HR Consultants','+254702222333',sv_train, now() + interval '2 days','offered','Offered Thursday 10:00',true),
   ('Horizon Manpower','+254703333444',sv_web, now() + interval '3 days','waiting','Wants a weekend slot',true),
   ('Pwani Overseas','+254704444555',sv_audit, now() + interval '1 day','waiting',null,true);

  -- tasks
  insert into tasks (title, description, priority, status, due_at, entity_type, entity_id, assignee_id, created_by_kind, created_by, completed_at, is_demo)
  select x.t, x.d, x.p, x.s, now() + x.due * interval '1 day', 'client', (select id from clients where is_demo order by created_at limit 1 offset x.o),
         staff_ids[x.a], x.k, case when x.k = 'hermes' then (array['Echo','Ledger','Sage'])[1 + (x.o % 3)] else 'M.A. Salmin' end,
         case when x.s = 'done' then now() - interval '1 day' end, true
  from (values
    ('Send balance invoice reminder','Balance is overdue. Send a friendly WhatsApp reminder.','high','todo',0,0,6,'hermes'),
    ('Collect branding assets','Logo, colours and photos for the website.','medium','in_progress',1,1,3,'human'),
    ('Prepare live demo script','Walk through candidate pipeline and visa tracker.','high','todo',0,2,3,'human'),
    ('Follow up no-show discovery call','Lead missed the call. Offer two new slots.','urgent','todo',0,3,2,'hermes'),
    ('Renew hosting for client','Hosting expires in 9 days.','medium','todo',3,4,5,'hermes'),
    ('Record training video','Short Loom on adding a new candidate.','low','todo',5,5,4,'human'),
    ('Review Sage scoring weights','Gulf volume signal is overweighted.','medium','todo',2,6,1,'human'),
    ('Reconcile M-PESA statement','Match last week''s M-PESA receipts to invoices.','high','in_progress',1,7,6,'hermes'),
    ('Draft quotation for referral client','Full Command Suite with 2 trainings.','high','todo',1,8,2,'human'),
    ('Onboard new care plan client','Add to WhatsApp support group and schedule kickoff.','medium','done',-1,9,4,'human'),
    ('Publish case study','Before and after photos with client permission.','low','todo',7,10,1,'human'),
    ('Fix webhook timeout on candidate bot','Echo flagged 3 failed deliveries.','urgent','in_progress',0,0,3,'hermes')
  ) x(t,d,p,s,due,o,a,k);

  -- expenses (last ~90 days)
  for i in 1..48 loop
    r := random();
    insert into expenses (business_id, category, description, vendor, amount_kes, method, paid_at, status, recurring, is_demo)
    values (biz,
      (array['software','ai_api','internet','marketing','transport','rent','office','hardware'])[1 + (i % 8)],
      (array['Supabase Pro + Netlify','AI model credits','Safaricom fibre','Meta ads — agencies','Uber to client sites','Co-working desk','Stationery & printing','Router for client install'])[1 + (i % 8)],
      (array['Supabase','OpenRouter','Safaricom','Meta','Uber','Nairobi Garage','Nairobi Print Hub','Phone Tech Wholesalers'])[1 + (i % 8)],
      round((array[4500,7800,6000,12000,1800,15000,2500,9500])[1 + (i % 8)] * (0.8 + random()*0.5)),
      (array['mpesa','card','bank'])[1 + floor(random()*3)::int],
      current_date - floor(random()*88)::int,
      case when random() < .9 then 'paid' else 'pending' end, (i % 8) in (0,2,5), true);
  end loop;

  -- cash till (last 7 days closed, today open) + day closes
  for i in reverse 7..1 loop
    insert into till_sessions (opened_by, opened_at, opening_float_kes, closed_at, counted_kes, expected_kes, variance_kes, status, is_demo)
    values (staff_ids[6], ((current_date - i)::timestamp + time '08:30') at time zone 'Africa/Nairobi', 5000,
            ((current_date - i)::timestamp + time '18:00') at time zone 'Africa/Nairobi', 5000 + (i * 1300) - (case when i = 3 then 200 else 0 end), 5000 + i * 1300,
            case when i = 3 then -200 else 0 end, 'closed', true);
    insert into day_closes (business_date, totals, closed_at, notes, is_demo)
    values (current_date - i, jsonb_build_object('mpesa', 20000 + i * 3100, 'bank', case when i % 2 = 0 then 70000 else 0 end, 'cash', i * 1300, 'expenses', 2500 + i * 400),
            ((current_date - i)::timestamp + time '18:05') at time zone 'Africa/Nairobi', case when i = 3 then 'KES 200 short — transport float' end, true)
    on conflict (business_date) do nothing;
  end loop;
  insert into till_sessions (opened_by, opened_at, opening_float_kes, status, is_demo)
  values (staff_ids[6], ((current_date)::timestamp + time '08:30') at time zone 'Africa/Nairobi', 5000, 'open', true);

  -- HR: shifts this week, attendance last 14 days, leave, advances, payroll
  for i in 2..6 loop
    for k in 0..5 loop
      insert into shifts (staff_id, day, start_time, end_time, role, is_demo)
      values (staff_ids[i], date_trunc('week', current_date)::date + k,
              case when i = 6 then time '09:00' else time '08:00' end, case when i = 6 then time '13:00' else time '17:00' end,
              (array['','Sales','Engineering','Support','Engineering','Finance'])[i], true);
    end loop;
  end loop;
  for i in 2..6 loop
    for k in 1..14 loop
      d := current_date - k;
      continue when extract(isodow from d) = 7;
      r := random();
      insert into attendance (staff_id, day, status, check_in, check_out, is_demo)
      values (staff_ids[i], d, case when r < .82 then 'present' when r < .9 then 'late' when r < .95 then 'absent' else 'leave' end,
              case when r < .82 then time '07:55' + (floor(random()*10) || ' minutes')::interval when r < .9 then time '08:40' end,
              case when r < .9 then time '17:05' end, true)
      on conflict (staff_id, day) do nothing;
    end loop;
  end loop;
  insert into leave_requests (staff_id, type, from_date, to_date, days, reason, status, is_demo) values
   (staff_ids[3],'annual',current_date + 10,current_date + 14,5,'Family visit in Kisumu','pending',true),
   (staff_ids[4],'sick',current_date - 6,current_date - 5,2,'Flu','approved',true),
   (staff_ids[5],'annual',current_date + 20,current_date + 21,2,'Graduation','pending',true),
   (staff_ids[2],'compassionate',current_date - 30,current_date - 28,3,'Bereavement','approved',true);
  insert into salary_advances (staff_id, amount_kes, reason, requested_at, status, repaid_kes, is_demo) values
   (staff_ids[5],10000,'School fees',current_date - 12,'approved',5000,true),
   (staff_ids[4],8000,'Rent top-up',current_date - 2,'pending',0,true),
   (staff_ids[6],5000,'Medical',current_date - 40,'repaid',5000,true),
   (staff_ids[3],15000,'Laptop repair',current_date - 1,'pending',0,true);
  insert into payroll_runs (period_start, period_end, status, totals, is_demo)
  values ((date_trunc('month', current_date) - interval '1 month')::date, (date_trunc('month', current_date) - interval '1 day')::date, 'paid', '{}', true) returning id into rid;
  insert into payslips (run_id, staff_id, base_kes, commission_kes, tips_kes, allowances_kes, deductions_kes, advances_kes, net_kes, status, is_demo)
  select rid, s.id, s.base_salary_kes,
         coalesce((select sum(amount_kes) from commissions c where c.staff_id = s.id), 0), 0, 3000,
         round(s.base_salary_kes * 0.11, 2), case when s.id = staff_ids[6] then 5000 else 0 end,
         s.base_salary_kes + coalesce((select sum(amount_kes) from commissions c where c.staff_id = s.id), 0) + 3000 - round(s.base_salary_kes * 0.11, 2) - case when s.id = staff_ids[6] then 5000 else 0 end,
         'paid', true
  from staff s where s.is_demo and s.base_salary_kes > 0;
  update payroll_runs set totals = (select jsonb_build_object('gross', sum(base_kes + commission_kes + allowances_kes), 'deductions', sum(deductions_kes + advances_kes), 'net', sum(net_kes), 'headcount', count(1)) from payslips where run_id = rid) where id = rid;

  -- internal documents
  insert into documents (client_id, type, name, source, status, created_at, is_demo)
  select c.id, x.t, x.n || ' — ' || c.business_name, 'internal', x.s, c.created_at + interval '2 days', true
  from (select id, business_name, created_at from clients where is_demo order by created_at limit 6) c
  cross join (values ('proposal','Proposal','sent'),('other','Handover Manual','draft')) x(t,n,s);

  -- Hermes fleet history
  update hermes_bots set status = 'idle', last_heartbeat = now() - interval '4 minutes', enabled = true;
  for i in 1..14 loop
    insert into automation_runs (bot_name, routine, started_at, finished_at, status, summary, stats, is_demo) values
     ('scout','daily_sourcing', ((current_date - i)::timestamp + time '05:00') at time zone 'Africa/Nairobi', ((current_date - i)::timestamp + time '05:07') at time zone 'Africa/Nairobi',
       case when i = 4 then 'failed' else 'success' end, case when i = 4 then 'Directory timeout after 3 retries. Escalated to Telegram.' else 'Sourced ' || (3 + i % 5) || ' new licensed agencies, 2 duplicates skipped.' end,
       jsonb_build_object('found', 5 + i % 5, 'inserted', 3 + i % 5, 'duplicates', 2), true),
     ('sage','enrichment', ((current_date - i)::timestamp + time '05:30') at time zone 'Africa/Nairobi', ((current_date - i)::timestamp + time '05:52') at time zone 'Africa/Nairobi',
       'success', 'Enriched ' || (4 + i % 6) || ' leads. ' || (1 + i % 3) || ' scored HIGH.', jsonb_build_object('enriched', 4 + i % 6, 'high', 1 + i % 3), true),
     ('herald','outreach', ((current_date - i)::timestamp + time '09:00') at time zone 'Africa/Nairobi', ((current_date - i)::timestamp + time '09:14') at time zone 'Africa/Nairobi',
       case when i in (2,9) then 'skipped' else 'success' end, case when i in (2,9) then 'Outreach paused by founder. Nothing sent.' else 'Sent ' || (6 + i % 7) || ' personalized messages within the daily limit.' end,
       jsonb_build_object('sent', case when i in (2,9) then 0 else 6 + i % 7 end), true),
     ('ledger','morning_briefing', ((current_date - i)::timestamp + time '07:00') at time zone 'Africa/Nairobi', ((current_date - i)::timestamp + time '07:01') at time zone 'Africa/Nairobi',
       'success', 'Morning briefing delivered to Telegram.', '{}', true);
  end loop;
  insert into automation_runs (bot_name, routine, started_at, finished_at, status, summary, stats, is_demo) values
   ('echo','reply_watch', now() - interval '20 minutes', now() - interval '19 minutes', 'success', 'Classified 2 replies. Booked 1 discovery call.', '{"replies":2,"booked":1}', true),
   ('ledger','morning_briefing', ((current_date)::timestamp + time '07:00') at time zone 'Africa/Nairobi', ((current_date)::timestamp + time '07:01') at time zone 'Africa/Nairobi', 'success', 'Morning briefing delivered to Telegram.', '{}', true);
  insert into automation_commands (command, target_bot, payload, status, requested_by, created_at, acked_at, done_at, result) values
   ('run_enrichment','sage','{"limit":40}','done','demo-seed', now() - interval '2 days', now() - interval '2 days' + interval '20 seconds', now() - interval '2 days' + interval '6 minutes', '{"enriched":9}'),
   ('pause_outreach','herald','{}','done','demo-seed', now() - interval '9 days', now() - interval '9 days' + interval '5 seconds', now() - interval '9 days' + interval '5 seconds', '{"paused":true}'),
   ('morning_briefing','ledger','{}','done','demo-seed', now() - interval '1 day', now() - interval '1 day' + interval '3 seconds', now() - interval '1 day' + interval '40 seconds', '{"delivered":"telegram"}');

  -- ---------- rebuild the activity feed with real historical timestamps ----------
  delete from activities;
  delete from notifications;
  insert into activities (actor_kind, actor_name, verb, entity_type, entity_id, summary, metadata, created_at, is_demo)
  select case when source = 'scraper' then 'bot' when source = 'landing_page' then 'client' else 'human' end,
         case when source = 'scraper' then 'Scout' when source = 'landing_page' then coalesce(contact_name, 'Website visitor') else 'M.A. Salmin' end,
         'lead_created', 'lead', id,
         case when source = 'scraper' then 'Scout sourced ' || business_name || ' (' || location || ')' when source = 'landing_page' then business_name || ' requested a free operations audit' else 'Added lead ' || business_name end,
         jsonb_build_object('source', source), created_at, true from leads where is_demo
  union all
  select 'bot','Sage','lead_enriched','lead',id, 'Enriched ' || business_name || ' — score ' || score || ' (' || upper(quality) || ')', jsonb_build_object('score',score), enriched_at, true from leads where is_demo and enriched_at is not null
  union all
  select 'bot','Herald','outreach_sent','lead',o.lead_id, 'Sent ' || o.channel || ' step ' || o.step || ' to ' || l.business_name, jsonb_build_object('channel',o.channel), o.sent_at, true from outreach_messages o join leads l on l.id = o.lead_id where o.is_demo and o.sent_at is not null
  union all
  select 'bot','Echo','reply_received','lead',r.lead_id, l.business_name || ' replied (' || replace(r.intent,'_',' ') || ')', jsonb_build_object('intent',r.intent), r.received_at, true from replies r join leads l on l.id = r.lead_id where r.is_demo
  union all
  select 'bot','Echo','call_booked','appointment',a.id, 'Booked ' || a.title, '{}', a.created_at, true from appointments a where a.is_demo and a.type = 'discovery_call'
  union all
  select 'human','M.A. Salmin','deal_won','deal',id, 'Won ' || title || ' — KES ' || to_char(value_kes,'FM999,999,990'), jsonb_build_object('value_kes',value_kes), won_at, true from deals where is_demo and stage = 'won'
  union all
  select 'client', coalesce(p.client_name,'Client'), 'document_signed', 'client', d.client_id, coalesce(p.client_name,'Client') || ' signed the ' || split_part(d.name,' — ',1), jsonb_build_object('doc_type', p.doc_type), p.created_at, true
    from documents d join portal_submissions p on p.id = d.portal_submission_id where p.fields->>'demo' = 'true'
  union all
  select 'bot','Ledger','payment_received','invoice',p.invoice_id, 'KES ' || to_char(p.amount_kes,'FM999,999,990') || ' received via ' || upper(p.method) || ' on ' || i.number, jsonb_build_object('amount_kes',p.amount_kes), p.paid_at, true
    from payments p join invoices i on i.id = p.invoice_id where p.is_demo
  union all
  select 'human','Brian Otieno','project_delivered','project',id, name || ' delivered', '{}', delivered_at::timestamptz + interval '15 hours', true from projects where is_demo and delivered_at is not null
  union all
  select 'bot', initcap(bot_name), 'routine_' || status, 'automation_run', id, initcap(bot_name) || ': ' || summary, stats, coalesce(finished_at, started_at), true from automation_runs where is_demo;

  insert into notifications (type, title, body, entity_type, read, created_at, is_demo) values
   ('reply','New reply','Redbird Recruitment Agency replied: "Can we talk this week?"','lead',false, now() - interval '18 minutes', true),
   ('booking','Discovery call booked','Echo booked a call for tomorrow at 10:00','appointment',false, now() - interval '19 minutes', true),
   ('invoice','Invoice overdue','A balance invoice is past due. Ledger drafted a reminder.','invoice',false, now() - interval '3 hours', true),
   ('lead','New audit request','A new agency requested a free operations audit from the website','lead',true, now() - interval '6 hours', true),
   ('hermes','Scout run failed','Directory timeout after 3 retries','automation_run',true, now() - interval '4 days', true);
end $$;