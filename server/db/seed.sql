-- ═══════ GoldenRay Energy — Seed Data ═══════

-- Passwords: bcrypt hash of the plaintext shown in comments
-- admin123 / manager123 / sales123 / proposal123
INSERT INTO users (id, name, email, password_hash, role, avatar) VALUES
  ('a1a1a1a1-0000-0000-0000-000000000001', 'Aroha Mitchell', 'aroha@goldenray.co.nz', '$2a$10$xJwL5FQZQqL1YB6J8V6KLe9P6CqYP3OxWQqJJvS/vQikmHxY1.xYa', 'admin', 'AM'),
  ('a1a1a1a1-0000-0000-0000-000000000002', 'Liam Patel', 'liam@goldenray.co.nz', '$2a$10$xJwL5FQZQqL1YB6J8V6KLe9P6CqYP3OxWQqJJvS/vQikmHxY1.xYa', 'sales_mgr', 'LP'),
  ('a1a1a1a1-0000-0000-0000-000000000003', 'Sophie Nguyen', 'sophie@goldenray.co.nz', '$2a$10$xJwL5FQZQqL1YB6J8V6KLe9P6CqYP3OxWQqJJvS/vQikmHxY1.xYa', 'sales_exec', 'SN'),
  ('a1a1a1a1-0000-0000-0000-000000000004', 'Jack Te Awa', 'jack@goldenray.co.nz', '$2a$10$xJwL5FQZQqL1YB6J8V6KLe9P6CqYP3OxWQqJJvS/vQikmHxY1.xYa', 'proposal_mgr', 'JT');

INSERT INTO pipeline_stages (stage_key, label, color, sort_order) VALUES
  ('new','New','#6366f1',1),('qualified','Qualified','#8b5cf6',2),('survey','Survey','#a78bfa',3),
  ('proposal_gen','Proposed','#f59e0b',4),('proposal_sent','Sent','#3b82f6',5),
  ('followup','Follow-Up','#06b6d4',6),('negotiation','Negotiating','#f97316',7),
  ('won','Won','#10b981',8),('lost','Lost','#ef4444',9);

INSERT INTO companies (id, name, domain, industry, size, city, annual_revenue, owner_id, lifecycle) VALUES
  ('c0c0c0c0-0000-0000-0000-000000000001','Pacific Fresh Ltd','pacificfresh.co.nz','Food & Beverage','50-200','Christchurch','$8M','a1a1a1a1-0000-0000-0000-000000000002','opportunity'),
  ('c0c0c0c0-0000-0000-0000-000000000002','Kiwi Dairy Co-op','kiwidairy.co.nz','Agriculture','200-500','Hamilton','$22M','a1a1a1a1-0000-0000-0000-000000000002','customer'),
  ('c0c0c0c0-0000-0000-0000-000000000003','Rawiri Hotels Group','rawirihotels.co.nz','Hospitality','200-500','Queenstown','$15M','a1a1a1a1-0000-0000-0000-000000000002','customer'),
  ('c0c0c0c0-0000-0000-0000-000000000004','NZ Greens Produce','nzgreens.co.nz','Agriculture','50-200','Napier','$5M','a1a1a1a1-0000-0000-0000-000000000002','opportunity'),
  ('c0c0c0c0-0000-0000-0000-000000000005','Southern Cross Winery','scwinery.co.nz','Wine & Spirits','50-200','Marlborough','$12M','a1a1a1a1-0000-0000-0000-000000000002','sql');

INSERT INTO contacts (name, email, phone, type, system_type, location, monthly_bill, stage, source, assigned_to, company_id, estimated_value, lifecycle, lead_score) VALUES
  ('Te Whiti Ngata','tewhiti@xtra.co.nz','+64 21 555 001','residential','on-grid','Auckland',280,'proposal_sent','website','a1a1a1a1-0000-0000-0000-000000000003',NULL,14200,'opportunity',72),
  ('Pacific Fresh Ltd','ops@pacificfresh.co.nz','+64 9 555 002','commercial','hybrid','Christchurch',4800,'negotiation','referral','a1a1a1a1-0000-0000-0000-000000000002','c0c0c0c0-0000-0000-0000-000000000001',185000,'opportunity',88),
  ('Hannah Brown','hannah@gmail.com','+64 27 555 003','residential','off-grid','Queenstown',350,'qualified','ad','a1a1a1a1-0000-0000-0000-000000000003',NULL,21000,'lead',54),
  ('James Wilson','wilson@outlook.co.nz','+64 22 555 004','residential','on-grid','Wellington',320,'won','website','a1a1a1a1-0000-0000-0000-000000000003',NULL,16500,'customer',95),
  ('Kiwi Dairy Co-op','admin@kiwidairy.co.nz','+64 7 555 005','commercial','on-grid','Hamilton',8200,'won','walk-in','a1a1a1a1-0000-0000-0000-000000000002','c0c0c0c0-0000-0000-0000-000000000002',245000,'customer',98),
  ('Aroha Tuhoe','aroha@gmail.com','+64 21 555 006','residential','hybrid','Tauranga',260,'new','website',NULL,NULL,18500,'subscriber',22),
  ('Rawiri Hotels','ops@rawirihotels.co.nz','+64 3 555 007','commercial','on-grid','Queenstown',12000,'won','referral','a1a1a1a1-0000-0000-0000-000000000002','c0c0c0c0-0000-0000-0000-000000000003',320000,'customer',96),
  ('Linda Garcia','linda@proton.me','+64 22 555 008','residential','on-grid','Nelson',410,'followup','referral','a1a1a1a1-0000-0000-0000-000000000003',NULL,26800,'mql',64),
  ('NZ Greens Produce','farm@nzgreens.co.nz','+64 6 555 009','commercial','hybrid','Napier',6500,'proposal_gen','ad','a1a1a1a1-0000-0000-0000-000000000002','c0c0c0c0-0000-0000-0000-000000000004',198000,'sql',75),
  ('Sam Chen','samchen@gmail.com','+64 21 555 010','residential','on-grid','Auckland',290,'lost','website','a1a1a1a1-0000-0000-0000-000000000003',NULL,15200,'other',12),
  ('Southern Cross Winery','ops@scwinery.co.nz','+64 3 555 011','commercial','on-grid','Marlborough',7800,'survey','referral','a1a1a1a1-0000-0000-0000-000000000002','c0c0c0c0-0000-0000-0000-000000000005',210000,'sql',81),
  ('Ngaio Harper','ngaio@outlook.co.nz','+64 4 555 012','residential','hybrid','Wellington',380,'won','website','a1a1a1a1-0000-0000-0000-000000000003',NULL,24500,'customer',94);

INSERT INTO campaigns (name, type, status, channel, budget, spent, emails_sent, emails_opened, emails_clicked, emails_bounced, unsubscribed, leads_generated, conversions, revenue_attributed) VALUES
  ('Summer Solar Blitz','email','active','email',4500,3820,2400,1080,312,48,12,48,6,156000),
  ('Google Ads - Residential','paid','active','google_ads',12000,4200,0,0,0,0,0,34,4,72200),
  ('Facebook Solar Awareness','paid','active','facebook',6000,2800,0,0,0,0,0,22,2,39500),
  ('Commercial Outreach Q1','email','completed','email',1200,1200,800,384,96,16,4,12,3,653000),
  ('Green Business Webinar','event','completed','event',2000,1850,0,0,0,0,0,28,1,210000),
  ('Referral Bonus Program','referral','active','referral',8000,3200,0,0,0,0,0,18,5,597300),
  ('LinkedIn B2B Targeting','paid','active','linkedin',9000,2100,0,0,0,0,0,8,1,198000),
  ('Autumn Newsletter Series','email','active','email',800,320,1800,756,198,36,8,6,0,0);

INSERT INTO system_config (key, value) VALUES
  ('solar_pricing', '{"costPerKw":1850,"batteryCostPerKwh":890,"taxRate":15,"markup":12,"defaultElecRate":0.32,"laborPct":18,"panelWatts":550,"sunHours":4.5,"inverterPct":14}'),
  ('company_info', '{"name":"GoldenRay Energy","email":"hello@goldenrayenergy.co.nz","phone":"+64 9 123 4567","address":"Level 3, 45 Queen St, Auckland"}');
