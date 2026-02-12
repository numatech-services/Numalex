-- ============================================================
-- NumaLex — Données de test (SEED)
-- 
-- ⚠️  CE FICHIER EST POUR LE DÉVELOPPEMENT UNIQUEMENT
--     NE JAMAIS EXÉCUTER EN PRODUCTION
--
-- Exécuter APRÈS toutes les migrations (000 → 005)
-- dans le SQL Editor de Supabase.
--
-- Les mots de passe sont hashés par Supabase Auth, donc
-- les utilisateurs doivent être créés via l'API Auth.
-- Ce fichier crée les données métier associées.
-- ============================================================

-- ┌──────────────────────────────────────────────────────────┐
-- │  ÉTAPE 1 : Créer les utilisateurs via Supabase Auth      │
-- │                                                           │
-- │  ⚠️  EXÉCUTER CES COMMANDES DANS LE DASHBOARD SUPABASE   │
-- │  → Authentication → Users → Add User                      │
-- │                                                           │
-- │  Ou via la CLI Supabase (voir instructions en bas)        │
-- └──────────────────────────────────────────────────────────┘

-- ============================================================
-- COMPTES DE TEST
-- ============================================================
--
-- ┌─────────────────────┬──────────────────┬───────────────┬──────────────┐
-- │ Utilisateur         │ Email            │ Mot de passe  │ Rôle         │
-- ├─────────────────────┼──────────────────┼───────────────┼──────────────┤
-- │ Me Ibrahima DIALLO  │ admin@numalex.ne │ NumaLex2026!  │ admin/avocat │
-- │ Me Aïssa MAHAMADOU  │ avocat@numalex.ne│ Avocat2026!   │ associe/avocat│
-- │ Me Boubacar SEYNI   │ collab@numalex.ne│ Collab2026!   │ collaborateur│
-- │ Mme Fatima ADAM     │ secr@numalex.ne  │ Secret2026!   │ secretariat  │
-- │ Client Portal       │ client@test.ne   │ Client2026!   │ client_portal│
-- │ Me Hamidou GARBA    │ notaire@numalex.ne│ Notaire2026! │ admin/notaire│
-- │ Me Salissou IDRISSA │ huissier@numalex.ne│Huissier2026!│ admin/huissier│
-- └─────────────────────┴──────────────────┴───────────────┴──────────────┘
--
-- IMPORTANT : Créer ces utilisateurs dans Supabase Auth AVANT
-- d'exécuter ce script SQL. Voir instructions en bas du fichier.
-- ============================================================


-- ┌──────────────────────────────────────────────────────────┐
-- │  ÉTAPE 2 : Données métier (exécuter dans SQL Editor)     │
-- └──────────────────────────────────────────────────────────┘

-- ─── CABINETS ───

INSERT INTO cabinets (id, name, profession, email, phone, address, nif, rccm, sous_domaine)
VALUES
  ('cab-avocat-0001-0001-000000000001', 'Cabinet Maître Diallo & Associés', 'avocat',
   'contact@diallo-avocats.ne', '+22790000001', 'Avenue de la République, Niamey',
   'NIF-NE-2024-001', 'NE-NIA-2024-B-001', 'diallo-avocats'),

  ('cab-notaire-0001-0001-000000000002', 'Étude Notariale Garba', 'notaire',
   'contact@garba-notaire.ne', '+22790000002', 'Boulevard Mali Béro, Niamey',
   'NIF-NE-2024-002', 'NE-NIA-2024-B-002', 'garba-notaire'),

  ('cab-huissier-001-0001-000000000003', 'SCP Idrissa - Commissaire de Justice', 'commissaire_justice',
   'contact@idrissa-huissier.ne', '+22790000003', 'Rue du Commerce, Niamey',
   'NIF-NE-2024-003', 'NE-NIA-2024-B-003', 'idrissa-huissier')
ON CONFLICT DO NOTHING;


-- ─── PROFILES (liés aux auth.users — remplacer les UUIDs par les vrais) ───
-- ⚠️  Les UUIDs ci-dessous sont des PLACEHOLDERS.
--     Après avoir créé les utilisateurs dans Supabase Auth,
--     remplacez-les par les vrais UUIDs depuis le dashboard Auth.

-- Pour trouver les UUIDs :
--   SELECT id, email FROM auth.users;

/*
-- DÉCOMMENTER ET REMPLACER LES UUIDs APRÈS CRÉATION DES USERS AUTH

INSERT INTO profiles (id, cabinet_id, role, rbac_role, full_name, phone, active, first_name, last_name)
VALUES
  -- Cabinet Avocat
  ('REMPLACER-UUID-ADMIN',   'cab-avocat-0001-0001-000000000001', 'avocat', 'admin',         'Me Ibrahima DIALLO',  '+22790100001', true, 'Ibrahima', 'DIALLO'),
  ('REMPLACER-UUID-ASSOCIE', 'cab-avocat-0001-0001-000000000001', 'avocat', 'associe',       'Me Aïssa MAHAMADOU',  '+22790100002', true, 'Aïssa', 'MAHAMADOU'),
  ('REMPLACER-UUID-COLLAB',  'cab-avocat-0001-0001-000000000001', 'avocat', 'collaborateur', 'Me Boubacar SEYNI',   '+22790100003', true, 'Boubacar', 'SEYNI'),
  ('REMPLACER-UUID-SECR',    'cab-avocat-0001-0001-000000000001', 'avocat', 'secretariat',   'Mme Fatima ADAM',     '+22790100004', true, 'Fatima', 'ADAM'),

  -- Cabinet Notaire
  ('REMPLACER-UUID-NOTAIRE', 'cab-notaire-0001-0001-000000000002', 'notaire', 'admin',       'Me Hamidou GARBA',    '+22790200001', true, 'Hamidou', 'GARBA'),

  -- Cabinet Huissier
  ('REMPLACER-UUID-HUISSIER','cab-huissier-001-0001-000000000003', 'huissier', 'admin',      'Me Salissou IDRISSA', '+22790300001', true, 'Salissou', 'IDRISSA')
ON CONFLICT (id) DO NOTHING;
*/


-- ─── CLIENTS (Cabinet Avocat) ───

INSERT INTO clients (id, cabinet_id, full_name, client_type, phone, email, address, company_name)
VALUES
  ('cli-00000001-0001-0001-000000000001', 'cab-avocat-0001-0001-000000000001',
   'Amadou OUMAROU', 'physique', '+22796000001', 'amadou.oumarou@gmail.com',
   'Quartier Plateau, Niamey', NULL),

  ('cli-00000002-0001-0001-000000000002', 'cab-avocat-0001-0001-000000000001',
   'SONIDEP SA', 'morale', '+22720000100', 'juridique@sonidep.ne',
   'Zone Industrielle, Niamey', 'SONIDEP SA'),

  ('cli-00000003-0001-0001-000000000003', 'cab-avocat-0001-0001-000000000001',
   'Mariama ABDOU', 'physique', '+22796000003', 'mariama.abdou@yahoo.fr',
   'Quartier Yantala, Niamey', NULL),

  ('cli-00000004-0001-0001-000000000004', 'cab-avocat-0001-0001-000000000001',
   'Société Niger Lait SARL', 'morale', '+22720000200', 'direction@nigerlait.ne',
   'Route de Tillabéri, Niamey', 'Niger Lait SARL'),

  ('cli-00000005-0001-0001-000000000005', 'cab-avocat-0001-0001-000000000001',
   'Ibrahim MOUSSA', 'physique', '+22796000005', NULL,
   'Quartier Gamkallé, Niamey', NULL)
ON CONFLICT DO NOTHING;

-- Clients Cabinet Notaire
INSERT INTO clients (id, cabinet_id, full_name, client_type, phone, email, address)
VALUES
  ('cli-notaire-001-0001-000000000001', 'cab-notaire-0001-0001-000000000002',
   'Haoua SEYDOU', 'physique', '+22796100001', 'haoua@gmail.com', 'Niamey'),

  ('cli-notaire-002-0001-000000000002', 'cab-notaire-0001-0001-000000000002',
   'Moussa ADAMOU', 'physique', '+22796100002', NULL, 'Maradi')
ON CONFLICT DO NOTHING;

-- Clients Cabinet Huissier
INSERT INTO clients (id, cabinet_id, full_name, client_type, phone, email, address)
VALUES
  ('cli-huissier-01-0001-000000000001', 'cab-huissier-001-0001-000000000003',
   'Banque Atlantique Niger', 'morale', '+22720300001', 'contentieux@ba-niger.ne', 'Niamey'),

  ('cli-huissier-02-0001-000000000002', 'cab-huissier-001-0001-000000000003',
   'Issoufou ZAKARI', 'physique', '+22796200002', NULL, 'Zinder')
ON CONFLICT DO NOTHING;


-- ─── DOSSIERS (Cabinet Avocat) ───

INSERT INTO matters (id, cabinet_id, client_id, reference, title, description, status, juridiction, court_number, profession, tags)
VALUES
  ('mat-00000001-0001-0001-000000000001', 'cab-avocat-0001-0001-000000000001',
   'cli-00000001-0001-0001-000000000001',
   'DAV-2026-001', 'OUMAROU c/ SONIDEP - Licenciement abusif',
   'Contestation de licenciement pour faute grave. Le client conteste les motifs invoqués par l''employeur. Procédure devant le Tribunal du Travail de Niamey.',
   'en_cours', 'Tribunal du Travail de Niamey', 'RG 2026/0142', 'avocat',
   ARRAY['droit-travail', 'contentieux', 'urgent']),

  ('mat-00000002-0001-0001-000000000002', 'cab-avocat-0001-0001-000000000001',
   'cli-00000002-0001-0001-000000000002',
   'DAV-2026-002', 'SONIDEP - Conseil restructuration',
   'Accompagnement juridique dans la restructuration de la société. Rédaction des nouveaux statuts conformes à l''AUDSCGIE (OHADA).',
   'ouvert', NULL, NULL, 'avocat',
   ARRAY['droit-societes', 'ohada', 'conseil']),

  ('mat-00000003-0001-0001-000000000003', 'cab-avocat-0001-0001-000000000001',
   'cli-00000003-0001-0001-000000000003',
   'DAV-2026-003', 'ABDOU Mariama - Divorce par consentement mutuel',
   'Procédure de divorce amiable. Les époux sont d''accord sur le partage des biens et la garde des enfants.',
   'en_cours', 'TGI Hors Classe de Niamey', 'RG 2026/0089', 'avocat',
   ARRAY['droit-famille', 'divorce']),

  ('mat-00000004-0001-0001-000000000004', 'cab-avocat-0001-0001-000000000001',
   'cli-00000004-0001-0001-000000000004',
   'DAV-2026-004', 'Niger Lait - Recouvrement créances fournisseur',
   'Action en recouvrement de créances contre un fournisseur défaillant. Montant : 45.000.000 FCFA. Injonction de payer OHADA.',
   'ouvert', 'Tribunal de Commerce de Niamey', NULL, 'avocat',
   ARRAY['recouvrement', 'ohada', 'commercial']),

  ('mat-00000005-0001-0001-000000000005', 'cab-avocat-0001-0001-000000000001',
   'cli-00000005-0001-0001-000000000005',
   'DAV-2025-018', 'MOUSSA Ibrahim - Bail commercial litigieux',
   'Litige relatif à un bail commercial. Le bailleur demande l''expulsion malgré le paiement régulier des loyers.',
   'suspendu', 'TGI Hors Classe de Niamey', 'RG 2025/0534', 'avocat',
   ARRAY['bail-commercial', 'contentieux'])
ON CONFLICT DO NOTHING;

-- Dossiers Cabinet Notaire
INSERT INTO matters (id, cabinet_id, client_id, reference, title, description, status, profession)
VALUES
  ('mat-notaire-001-0001-000000000001', 'cab-notaire-0001-0001-000000000002',
   'cli-notaire-001-0001-000000000001',
   'NOT-2026-001', 'Vente immobilière - Parcelle Niamey',
   'Vente d''une parcelle de 500m² au Quartier Plateau. Vendeur : M. SEYDOU, Acheteur : Mme HAOUA.',
   'en_cours', 'notaire'),

  ('mat-notaire-002-0001-000000000002', 'cab-notaire-0001-0001-000000000002',
   'cli-notaire-002-0001-000000000002',
   'NOT-2026-002', 'Constitution SARL - Commerce Maradi',
   'Constitution d''une SARL au capital de 1.000.000 FCFA. Siège social à Maradi.',
   'ouvert', 'notaire')
ON CONFLICT DO NOTHING;

-- Dossiers Cabinet Huissier
INSERT INTO matters (id, cabinet_id, client_id, reference, title, description, status, profession)
VALUES
  ('mat-huissier-01-0001-000000000001', 'cab-huissier-001-0001-000000000003',
   'cli-huissier-01-0001-000000000001',
   'HUI-2026-001', 'Signification jugement - Banque Atlantique c/ IBRAHIM',
   'Signification d''un jugement ordonnant le paiement de 12.000.000 FCFA.',
   'en_cours', 'commissaire_justice'),

  ('mat-huissier-02-0001-000000000002', 'cab-huissier-001-0001-000000000003',
   'cli-huissier-02-0001-000000000002',
   'HUI-2026-002', 'Constat avant travaux - Immeuble Zinder',
   'Constat d''état des lieux avant travaux de rénovation.',
   'ouvert', 'commissaire_justice')
ON CONFLICT DO NOTHING;


-- ─── ÉVÉNEMENTS / AGENDA ───

INSERT INTO events (id, cabinet_id, matter_id, title, event_type, starts_at, ends_at, location, description)
VALUES
  (gen_random_uuid(), 'cab-avocat-0001-0001-000000000001',
   'mat-00000001-0001-0001-000000000001',
   'Audience - Tribunal du Travail', 'audience',
   (CURRENT_DATE + INTERVAL '3 days' + INTERVAL '9 hours')::timestamptz,
   (CURRENT_DATE + INTERVAL '3 days' + INTERVAL '11 hours')::timestamptz,
   'Tribunal du Travail de Niamey, Salle 2',
   'Première audience. Présenter les conclusions en demande.'),

  (gen_random_uuid(), 'cab-avocat-0001-0001-000000000001',
   'mat-00000003-0001-0001-000000000003',
   'RDV clients - Époux ABDOU', 'rdv',
   (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '14 hours')::timestamptz,
   (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '15 hours')::timestamptz,
   'Cabinet, Bureau 3',
   'Signature de la convention de divorce. Prévoir 2 exemplaires.'),

  (gen_random_uuid(), 'cab-avocat-0001-0001-000000000001',
   'mat-00000004-0001-0001-000000000004',
   'Deadline - Dépôt requête injonction de payer', 'deadline',
   (CURRENT_DATE + INTERVAL '5 days')::timestamptz,
   NULL, NULL,
   'Dépôt de la requête en injonction de payer auprès du Tribunal de Commerce.'),

  (gen_random_uuid(), 'cab-avocat-0001-0001-000000000001',
   NULL,
   'Réunion équipe hebdomadaire', 'rdv',
   (CURRENT_DATE + INTERVAL '2 days' + INTERVAL '8 hours')::timestamptz,
   (CURRENT_DATE + INTERVAL '2 days' + INTERVAL '9 hours')::timestamptz,
   'Salle de réunion', 'Point sur tous les dossiers en cours.')
ON CONFLICT DO NOTHING;


-- ─── FACTURES ───

INSERT INTO invoices (id, cabinet_id, client_id, matter_id, invoice_number, description, amount_ht, tva_rate, total_ttc, status, due_at, devise, objet)
VALUES
  (gen_random_uuid(), 'cab-avocat-0001-0001-000000000001',
   'cli-00000001-0001-0001-000000000001', 'mat-00000001-0001-0001-000000000001',
   'FAV-2026-001', 'Honoraires - Contentieux prud''homal OUMAROU c/ SONIDEP',
   500000, 19, 595000, 'envoyee',
   (CURRENT_DATE + INTERVAL '30 days')::date, 'XOF',
   'Honoraires de représentation devant le Tribunal du Travail'),

  (gen_random_uuid(), 'cab-avocat-0001-0001-000000000001',
   'cli-00000002-0001-0001-000000000002', 'mat-00000002-0001-0001-000000000002',
   'FAV-2026-002', 'Honoraires conseil - Restructuration SONIDEP',
   2000000, 19, 2380000, 'payee',
   (CURRENT_DATE - INTERVAL '10 days')::date, 'XOF',
   'Accompagnement restructuration société'),

  (gen_random_uuid(), 'cab-avocat-0001-0001-000000000001',
   'cli-00000004-0001-0001-000000000004', 'mat-00000004-0001-0001-000000000004',
   'FAV-2026-003', 'Honoraires - Recouvrement Niger Lait',
   750000, 19, 892500, 'brouillon',
   (CURRENT_DATE + INTERVAL '45 days')::date, 'XOF',
   'Procédure d''injonction de payer OHADA'),

  (gen_random_uuid(), 'cab-avocat-0001-0001-000000000001',
   'cli-00000003-0001-0001-000000000003', 'mat-00000003-0001-0001-000000000003',
   'FAV-2026-004', 'Honoraires - Divorce amiable ABDOU',
   300000, 19, 357000, 'en_retard',
   (CURRENT_DATE - INTERVAL '15 days')::date, 'XOF',
   'Rédaction convention de divorce et représentation')
ON CONFLICT DO NOTHING;


-- ─── TÂCHES ───

INSERT INTO tasks (id, cabinet_id, matter_id, title, description, priority, due_date, completed, statut)
VALUES
  (gen_random_uuid(), 'cab-avocat-0001-0001-000000000001',
   'mat-00000001-0001-0001-000000000001',
   'Préparer conclusions en demande', 'Rédiger les conclusions pour l''audience du Tribunal du Travail',
   'urgente', (CURRENT_DATE + INTERVAL '2 days')::date, false, 'en_cours'),

  (gen_random_uuid(), 'cab-avocat-0001-0001-000000000001',
   'mat-00000004-0001-0001-000000000004',
   'Rassembler pièces justificatives', 'Factures impayées, bons de commande, mise en demeure',
   'haute', (CURRENT_DATE + INTERVAL '4 days')::date, false, 'a_faire'),

  (gen_random_uuid(), 'cab-avocat-0001-0001-000000000001',
   'mat-00000003-0001-0001-000000000003',
   'Rédiger convention de divorce', 'Inclure : partage des biens, garde enfants, pension alimentaire',
   'normal', (CURRENT_DATE + INTERVAL '7 days')::date, false, 'a_faire'),

  (gen_random_uuid(), 'cab-avocat-0001-0001-000000000001',
   'mat-00000002-0001-0001-000000000002',
   'Vérifier statuts OHADA', 'Conformité avec l''Acte Uniforme AUDSCGIE',
   'normal', (CURRENT_DATE + INTERVAL '10 days')::date, false, 'a_faire'),

  (gen_random_uuid(), 'cab-avocat-0001-0001-000000000001',
   NULL,
   'Renouveler assurance RC professionnelle', 'Échéance fin du mois',
   'haute', (CURRENT_DATE + INTERVAL '15 days')::date, false, 'a_faire')
ON CONFLICT DO NOTHING;


-- ─── ALERTES ───

INSERT INTO alerts (id, cabinet_id, matter_id, message, level, read)
VALUES
  (gen_random_uuid(), 'cab-avocat-0001-0001-000000000001',
   'mat-00000001-0001-0001-000000000001',
   'Audience dans 3 jours — Tribunal du Travail (OUMAROU c/ SONIDEP)', 'warning', false),

  (gen_random_uuid(), 'cab-avocat-0001-0001-000000000001',
   'mat-00000003-0001-0001-000000000003',
   'Facture FAV-2026-004 en retard de 15 jours (ABDOU Mariama - 357 000 FCFA)', 'critical', false),

  (gen_random_uuid(), 'cab-avocat-0001-0001-000000000001',
   'mat-00000005-0001-0001-000000000005',
   'Dossier MOUSSA Ibrahim suspendu depuis 30+ jours — vérifier la situation', 'info', false)
ON CONFLICT DO NOTHING;


-- ─── SEED PERMISSIONS PAR DÉFAUT ───

SELECT seed_default_permissions('cab-avocat-0001-0001-000000000001');
SELECT seed_default_permissions('cab-notaire-0001-0001-000000000002');
SELECT seed_default_permissions('cab-huissier-001-0001-000000000003');


-- ============================================================
-- INSTRUCTIONS : COMMENT CRÉER LES UTILISATEURS AUTH
-- ============================================================
--
-- OPTION A — Via le Dashboard Supabase (le plus simple)
-- ─────────────────────────────────────────────────────
-- 1. Aller dans : Authentication → Users → Add User
-- 2. Créer chaque utilisateur :
--
--    Email: admin@numalex.ne     Password: NumaLex2026!
--    Email: avocat@numalex.ne    Password: Avocat2026!
--    Email: collab@numalex.ne    Password: Collab2026!
--    Email: secr@numalex.ne      Password: Secret2026!
--    Email: client@test.ne       Password: Client2026!
--    Email: notaire@numalex.ne   Password: Notaire2026!
--    Email: huissier@numalex.ne  Password: Huissier2026!
--
-- 3. Copier les UUIDs générés
-- 4. Décommenter le bloc INSERT INTO profiles ci-dessus
-- 5. Remplacer les REMPLACER-UUID-* par les vrais UUIDs
-- 6. Exécuter le bloc INSERT
--
--
-- OPTION B — Via Supabase CLI (automatisé)
-- ────────────────────────────────────────
-- Exécuter dans un terminal :
--
-- npx supabase functions invoke create-user --body '{"email":"admin@numalex.ne","password":"NumaLex2026!"}'
--
-- Ou via curl :
--
-- curl -X POST 'https://VOTRE_PROJECT.supabase.co/auth/v1/signup' \
--   -H 'apikey: VOTRE_ANON_KEY' \
--   -H 'Content-Type: application/json' \
--   -d '{"email":"admin@numalex.ne","password":"NumaLex2026!"}'
--
-- Répéter pour chaque utilisateur.
--
--
-- OPTION C — Via SQL directement (avancé, nécessite service_role)
-- ──────────────────────────────────────────────────────────────
-- ⚠️  Nécessite SUPABASE_SERVICE_ROLE_KEY
--
-- Exemple avec le script Node.js fourni ci-dessous.
-- ============================================================


-- ============================================================
-- SCRIPT NODE.JS POUR CRÉER LES UTILISATEURS (copier dans un fichier .mjs)
-- ============================================================
--
-- import { createClient } from '@supabase/supabase-js';
--
-- const supabase = createClient(
--   process.env.NEXT_PUBLIC_SUPABASE_URL,
--   process.env.SUPABASE_SERVICE_ROLE_KEY   // ⚠️ service_role, pas anon
-- );
--
-- const users = [
--   { email: 'admin@numalex.ne',    password: 'NumaLex2026!',  cabinet: 'cab-avocat-0001-0001-000000000001',  role: 'avocat',   rbac: 'admin',         name: 'Me Ibrahima DIALLO' },
--   { email: 'avocat@numalex.ne',   password: 'Avocat2026!',   cabinet: 'cab-avocat-0001-0001-000000000001',  role: 'avocat',   rbac: 'associe',       name: 'Me Aïssa MAHAMADOU' },
--   { email: 'collab@numalex.ne',   password: 'Collab2026!',   cabinet: 'cab-avocat-0001-0001-000000000001',  role: 'avocat',   rbac: 'collaborateur', name: 'Me Boubacar SEYNI' },
--   { email: 'secr@numalex.ne',     password: 'Secret2026!',   cabinet: 'cab-avocat-0001-0001-000000000001',  role: 'avocat',   rbac: 'secretariat',   name: 'Mme Fatima ADAM' },
--   { email: 'notaire@numalex.ne',  password: 'Notaire2026!',  cabinet: 'cab-notaire-0001-0001-000000000002', role: 'notaire',  rbac: 'admin',         name: 'Me Hamidou GARBA' },
--   { email: 'huissier@numalex.ne', password: 'Huissier2026!', cabinet: 'cab-huissier-001-0001-000000000003', role: 'huissier', rbac: 'admin',         name: 'Me Salissou IDRISSA' },
-- ];
--
-- for (const u of users) {
--   const { data, error } = await supabase.auth.admin.createUser({
--     email: u.email,
--     password: u.password,
--     email_confirm: true,  // Confirmer automatiquement
--   });
--
--   if (error) { console.error(`❌ ${u.email}:`, error.message); continue; }
--
--   // Créer le profil
--   await supabase.from('profiles').upsert({
--     id: data.user.id,
--     cabinet_id: u.cabinet,
--     role: u.role,
--     rbac_role: u.rbac,
--     full_name: u.name,
--     active: true,
--   });
--
--   console.log(`✅ ${u.email} → ${data.user.id}`);
-- }
--
-- // Créer l'accès portail client
-- // (à faire après avoir identifié le client_id et l'auth_user_id)
-- ============================================================


-- ┌──────────────────────────────────────────────────────────┐
-- │  VÉRIFICATION APRÈS SEED                                  │
-- └──────────────────────────────────────────────────────────┘

-- Exécuter ces requêtes pour vérifier :

-- SELECT count(*) as cabinets FROM cabinets;             -- → 3
-- SELECT count(*) as clients FROM clients;               -- → 9
-- SELECT count(*) as dossiers FROM matters;              -- → 9
-- SELECT count(*) as events FROM events;                 -- → 4
-- SELECT count(*) as factures FROM invoices;             -- → 4
-- SELECT count(*) as taches FROM tasks;                  -- → 5
-- SELECT count(*) as alertes FROM alerts;                -- → 3
-- SELECT count(*) as permissions FROM role_permissions;  -- → 15 (5 rôles × 3 cabinets)
