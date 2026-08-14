# SBD Belt Intelligence Platform — Data Retention Policy

**Owner:** SIPS Healthcare Solutions (master administrators)
**System:** SBD Belt Intelligence Platform, https://belt.sterilebydesign.ai/ (Supabase project `mhijaqahbceuahfzezbh`)
**Adopted:** 2026-08-12 (T33 / security review issue S13)
**Review cadence:** annually, or on any change to the data model that adds a new category of personal data.

This policy covers the belt platform's tables only. The Supabase project also hosts
other SIPS properties (`bb_*`, `aip_*`, `demo_*`, `tco_*`, `hfl_*`, `op44_*`,
`underwriting_*`, `page_events`); those are outside this policy's scope (TASKS.md
Risks §6) and carry their own obligations.

## 1. What the platform stores

The platform manages **workforce certification data** for sterile processing
department technicians: identity and contact details of portal users and staff,
belt/certification progress, assessment results and history, observation and
training records, scheduling and attendance, AI-assistant conversations and usage
metering, and operational audit logs. **The platform stores no patient data and no
PHI.** It stores no payment data. No files are held in public storage buckets.

## 2. Retention schedule

| Category | Where it lives | Retention | Disposal |
|---|---|---|---|
| User accounts & portal profiles | `auth.users`, `sbd_portal_users` | Indefinite. **No account is ever deleted** (client rule, TASKS.md T31, 2026-07-27); departed users are **deactivated** (`active=false`), which blocks sign-in and token refresh. | Deactivation on departure; PII correction on request. |
| Staff certification records | `staff`, `assessment_history`, `sbd_belt_tests`, `sbd_belt_test_results`, `placement_reviews` | 7 years after the staff member leaves the SIPS network — certification evidence for healthcare-facility audit purposes. | Reviewed annually; anonymize or delete after the period, by migration, on master-admin sign-off. |
| Training progress | `foundations_*`, `instrument_*`, `practice_scores`, `practice_attempts`, `staff.oip`, `staff.ps_tracks` | Same as certification records (7 years post-departure). | Same as above. |
| Scheduling & attendance | `sbd_schedule`, `sbd_attendance` | 3 years from the shift date. | Annual purge by migration. |
| Assessment queue, PINs, unlock attempts | `sbd_assessment_queue`, `sbd_assessment_pins`, `sbd_observer_pins`, `assessment_pin_attempts` | PINs are single-use and expire on issue-defined windows; rows purged 1 year after use/expiry. | Annual purge by migration. |
| AI assistant (DAVID) conversations | `david_chat_sessions` | 2 years from last activity. | Annual purge by migration. |
| AI usage metering & cost | `david_usage_logs`, `david_analytics_summary` | 2 years (billing/ground-truth cost history). | Annual purge by migration. |
| Audit logs | `david_audit_logs`, `sbd_report_audit_log`, `activity_log` | Minimum 2 years; audit logs are tamper-evident (write-only for the system, read-only for master admins) and are never edited, only aged out. | Annual purge by migration, oldest-first. |
| Email queue & password resets | `sbd_email_queue`, `sbd_password_resets` | Transient: 90 days. Service-role-only access (unreachable over the data interface). | Quarterly purge. |
| Pending registrations | `registrations` | 1 year after approval/denial. | Annual purge by migration. |
| Browser-side state | `localStorage` (`sbd_session`, `sbd_*` onboarding keys) | Session token cleared on sign-out; onboarding/tour state persists on the user's own device only. | User-controlled (browser storage). |
| Database backups | Supabase automated backups | Per the Supabase project plan's rolling window; expire automatically. | Automatic. |

## 3. Enforcement status (honest accounting)

As of adoption, disposal is **procedural, not automated**: purges run as reviewed
migrations on the schedule above (first annual review due 2026 Q4 for the
transient categories). Every schema change, including retention purges, must ship
as a file in `supabase/migrations/` (ENGINEERING_STANDARDS.md B2) — no dashboard
deletes. Destructive operations additionally require explicit session confirmation
(CLAUDE.md safety rules). Automating the transient purges (email queue, expired
PINs) as scheduled jobs is tracked follow-up work, not claimed here.

## 4. Access control & requests

- Access to every category is role-scoped and enforced at the database (RLS), with
  admin-tier access additionally requiring multi-factor authentication (migration
  `20260812130000`, T33).
- **Subject requests** (correction, export, deletion) go to a SIPS master admin.
  Deletion requests are honored by deactivation plus anonymization of PII fields
  where the certification-evidence obligation permits; the account row itself is
  retained per the T31 rule.
- **MFA break-glass:** an administrator who loses their authenticator is restored
  by a master admin deleting their factor row in the Supabase dashboard
  (Authentication → Users → factors), after identity verification out-of-band.

## 5. Exceptions

Any retention exception (legal hold, incident investigation) is recorded in
`docs/decisions/` with date, scope, and the master admin who approved it, and is
reviewed at the next annual cycle.
