'use strict';

/**
 * Comprehensive Test-Data Seeder
 * ─────────────────────────────
 * Populates every table needed to exercise the dashboard graphs and stats:
 *
 *   users           – admin + regular user (skip if already present)
 *   projects        – 4 projects (2 frontend, 2 backend) with varied created_at
 *   project_env_profiles – 2 profiles per project (Default + Staging)
 *   environments    – 4–5 env vars per profile
 *   nodes           – 12 nodes spread across projects & roles
 *   node_builds     – 70 build runs across 35 days (7d and 30d ranges populated)
 *   node_env_vars   – per-node env overrides
 *
 * Run:   npm run db:seed           (runs ALL seeders)
 * Undo:  npm run db:seed:undo      (rolls back ALL seeders)
 */

const { v4: uuidv4 } = require('uuid');

// ── helpers ────────────────────────────────────────────────────────────────────

/**
 * Return a Date that is `daysAgo` days before "now", with an optional hour offset.
 */
function daysBack(daysAgo, hoursOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - hoursOffset, 0, 0, 0);
  return d;
}

/**
 * Fetch the first row from a table matching `where` clause (raw SQL fallback).
 * Returns the row object or null.
 */
async function findOne(queryInterface, table, whereKey, whereVal) {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT * FROM "${table}" WHERE "${whereKey}" = '${whereVal}' LIMIT 1;`
  );
  return rows && rows.length > 0 ? rows[0] : null;
}

// ── deterministic IDs ──────────────────────────────────────────────────────────
// Using fixed UUIDs so the seeder is idempotent (re-running won't duplicate).

const ID = {
  // users
  adminUser:  'aaaaaaaa-0000-4000-8000-000000000001',
  regularUser:'aaaaaaaa-0000-4000-8000-000000000002',

  // projects
  projectAlpha:   'bbbbbbbb-0000-4000-8000-000000000001', // frontend
  projectBeta:    'bbbbbbbb-0000-4000-8000-000000000002', // backend
  projectGamma:   'bbbbbbbb-0000-4000-8000-000000000003', // frontend
  projectDelta:   'bbbbbbbb-0000-4000-8000-000000000004', // backend

  // env profiles  (two per project: default + staging)
  profileAlphaDef:   'cccccccc-0000-4000-8000-000000000001',
  profileAlphaStage: 'cccccccc-0000-4000-8000-000000000002',
  profileBetaDef:    'cccccccc-0000-4000-8000-000000000003',
  profileBetaStage:  'cccccccc-0000-4000-8000-000000000004',
  profileGammaDef:   'cccccccc-0000-4000-8000-000000000005',
  profileGammaStage: 'cccccccc-0000-4000-8000-000000000006',
  profileDeltaDef:   'cccccccc-0000-4000-8000-000000000007',
  profileDeltaStage: 'cccccccc-0000-4000-8000-000000000008',

  // nodes
  nodeAlphaFe:        'dddddddd-0000-4000-8000-000000000001', // frontend
  nodeAlphaApi:       'dddddddd-0000-4000-8000-000000000002', // api_service
  nodeAlphaApiBranch: 'dddddddd-0000-4000-8000-000000000003', // api_branch under api
  nodeBetaFe:         'dddddddd-0000-4000-8000-000000000004',
  nodeBetaApi:        'dddddddd-0000-4000-8000-000000000005',
  nodeBetaApiBranch:  'dddddddd-0000-4000-8000-000000000006',
  nodeGammaFe:        'dddddddd-0000-4000-8000-000000000007',
  nodeGammaApi:       'dddddddd-0000-4000-8000-000000000008',
  nodeDeltaFe:        'dddddddd-0000-4000-8000-000000000009',
  nodeDeltaApi:       'dddddddd-0000-4000-8000-000000000010',
  nodeDeltaApiBranch: 'dddddddd-0000-4000-8000-000000000011',
  nodeDeltaFeStale:   'dddddddd-0000-4000-8000-000000000012', // soft-deleted
};

// ── main seeder ───────────────────────────────────────────────────────────────

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // ── 1. USERS ───────────────────────────────────────────────────────────────
    // Re-use the admin/regular users created by the earlier seeder if they exist,
    // otherwise create them (bcrypt not available in CJS easily so use a known hash).
    // Password: %TGBnhy6  (bcrypt rounds=10, pre-computed static hash)
    const HASHED_PW = '$2b$10$D2LUnAA6.0LBwPT9n1T4rO3lRjHM0FBNW1J6vNzJpW5PtMBOyFLe2';

    for (const [id, name, email, role] of [
      [ID.adminUser,   'Admin',        'admin@example.com', 'admin'],
      [ID.regularUser, 'Regular User', 'user@example.com',  'user'],
    ]) {
      const existing = await findOne(queryInterface, 'users', 'email', email);
      if (!existing) {
        await queryInterface.bulkInsert('users', [{
          id,
          name,
          email,
          password:    HASHED_PW,
          role,
          status:      'active',
          must_change_password: false,
          reset_password_token:   null,
          reset_password_expires: null,
          created_at: daysBack(90),
          updated_at: daysBack(90),
        }]);
      }
    }

    // Resolve the actual admin UUID (may differ if already seeded by the old seeder)
    const adminRow = await findOne(queryInterface, 'users', 'email', 'admin@example.com');
    const adminId  = adminRow ? adminRow.id : ID.adminUser;
    const userRow  = await findOne(queryInterface, 'users', 'email', 'user@example.com');
    const userId   = userRow ? userRow.id : ID.regularUser;

    // ── 2. PROJECTS ────────────────────────────────────────────────────────────
    const projects = [
      {
        id:             ID.projectAlpha,
        name:           'Alpha Web App',
        short_code:     'ALPHA',
        description:    'Main customer-facing React application.',
        repository_url: 'https://github.com/acme/alpha-web',
        status:         'active',
        tag:            'frontend',
        env_name:       'alpha',
        created_by:     adminId,
        is_deleted:     false,
        created_at:     daysBack(60),
        updated_at:     daysBack(5),
      },
      {
        id:             ID.projectBeta,
        name:           'Beta API Gateway',
        short_code:     'BETA',
        description:    'Core REST API powering the Alpha frontend.',
        repository_url: 'https://github.com/acme/beta-api',
        status:         'active',
        tag:            'backend',
        env_name:       'beta',
        created_by:     adminId,
        is_deleted:     false,
        created_at:     daysBack(55),
        updated_at:     daysBack(3),
      },
      {
        id:             ID.projectGamma,
        name:           'Gamma Dashboard',
        short_code:     'GAMMA',
        description:    'Internal analytics and reporting dashboard.',
        repository_url: 'https://github.com/acme/gamma-dash',
        status:         'active',
        tag:            'frontend',
        env_name:       'gamma',
        created_by:     userId,
        is_deleted:     false,
        created_at:     daysBack(30),
        updated_at:     daysBack(1),
      },
      {
        id:             ID.projectDelta,
        name:           'Delta Microservice',
        short_code:     'DELTA',
        description:    'Event-driven microservice for notifications.',
        repository_url: 'https://github.com/acme/delta-service',
        status:         'active',
        tag:            'backend',
        env_name:       'delta',
        created_by:     userId,
        is_deleted:     false,
        // Created TODAY so it shows up in trend calculations
        created_at:     new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0),
        updated_at:     new Date(),
      },
    ];

    for (const p of projects) {
      const existing = await findOne(queryInterface, 'projects', 'id', p.id);
      if (!existing) await queryInterface.bulkInsert('projects', [p]);
    }

    // ── 3. ENV PROFILES ────────────────────────────────────────────────────────
    const profiles = [
      // Alpha
      { id: ID.profileAlphaDef,   project_id: ID.projectAlpha, name: 'Default',    slug: 'default',    is_default: true,  created_at: daysBack(60), updated_at: daysBack(60) },
      { id: ID.profileAlphaStage, project_id: ID.projectAlpha, name: 'Staging',    slug: 'staging',    is_default: false, created_at: daysBack(55), updated_at: daysBack(55) },
      // Beta
      { id: ID.profileBetaDef,    project_id: ID.projectBeta,  name: 'Default',    slug: 'default',    is_default: true,  created_at: daysBack(55), updated_at: daysBack(55) },
      { id: ID.profileBetaStage,  project_id: ID.projectBeta,  name: 'Staging',    slug: 'staging',    is_default: false, created_at: daysBack(50), updated_at: daysBack(50) },
      // Gamma
      { id: ID.profileGammaDef,   project_id: ID.projectGamma, name: 'Default',    slug: 'default',    is_default: true,  created_at: daysBack(30), updated_at: daysBack(30) },
      { id: ID.profileGammaStage, project_id: ID.projectGamma, name: 'Staging',    slug: 'staging',    is_default: false, created_at: daysBack(28), updated_at: daysBack(28) },
      // Delta
      { id: ID.profileDeltaDef,   project_id: ID.projectDelta, name: 'Default',    slug: 'default',    is_default: true,  created_at: daysBack(0),  updated_at: daysBack(0) },
      { id: ID.profileDeltaStage, project_id: ID.projectDelta, name: 'Staging',    slug: 'staging',    is_default: false, created_at: daysBack(0),  updated_at: daysBack(0) },
    ];

    for (const prof of profiles) {
      const existing = await findOne(queryInterface, 'project_env_profiles', 'id', prof.id);
      if (!existing) await queryInterface.bulkInsert('project_env_profiles', [prof]);
    }

    // ── 4. ENV VARS (environments table) ───────────────────────────────────────
    // 4–5 vars per profile → drives total_env_vars on the dashboard
    const envRows = [
      // Alpha Default
      { project_id: ID.projectAlpha, profile_id: ID.profileAlphaDef, env_variable: 'NODE_ENV',       env: 'production' },
      { project_id: ID.projectAlpha, profile_id: ID.profileAlphaDef, env_variable: 'API_BASE_URL',   env: 'https://api.alpha.acme.com' },
      { project_id: ID.projectAlpha, profile_id: ID.profileAlphaDef, env_variable: 'AUTH_SECRET',    env: 'super-secret-key-alpha' },
      { project_id: ID.projectAlpha, profile_id: ID.profileAlphaDef, env_variable: 'SENTRY_DSN',     env: 'https://sentry.io/alpha' },
      // Alpha Staging
      { project_id: ID.projectAlpha, profile_id: ID.profileAlphaStage, env_variable: 'NODE_ENV',     env: 'staging' },
      { project_id: ID.projectAlpha, profile_id: ID.profileAlphaStage, env_variable: 'API_BASE_URL', env: 'https://api.staging.alpha.acme.com' },
      { project_id: ID.projectAlpha, profile_id: ID.profileAlphaStage, env_variable: 'AUTH_SECRET',  env: 'staging-secret-alpha' },
      // Beta Default
      { project_id: ID.projectBeta, profile_id: ID.profileBetaDef, env_variable: 'NODE_ENV',         env: 'production' },
      { project_id: ID.projectBeta, profile_id: ID.profileBetaDef, env_variable: 'DATABASE_URL',     env: 'postgres://user:pass@db.beta.acme.com/prod' },
      { project_id: ID.projectBeta, profile_id: ID.profileBetaDef, env_variable: 'REDIS_URL',        env: 'redis://cache.beta.acme.com:6379' },
      { project_id: ID.projectBeta, profile_id: ID.profileBetaDef, env_variable: 'JWT_SECRET',       env: 'jwt-prod-secret' },
      { project_id: ID.projectBeta, profile_id: ID.profileBetaDef, env_variable: 'LOG_LEVEL',        env: 'warn' },
      // Beta Staging
      { project_id: ID.projectBeta, profile_id: ID.profileBetaStage, env_variable: 'NODE_ENV',       env: 'staging' },
      { project_id: ID.projectBeta, profile_id: ID.profileBetaStage, env_variable: 'DATABASE_URL',   env: 'postgres://user:pass@db.beta.acme.com/staging' },
      { project_id: ID.projectBeta, profile_id: ID.profileBetaStage, env_variable: 'LOG_LEVEL',      env: 'debug' },
      // Gamma Default
      { project_id: ID.projectGamma, profile_id: ID.profileGammaDef, env_variable: 'NODE_ENV',       env: 'production' },
      { project_id: ID.projectGamma, profile_id: ID.profileGammaDef, env_variable: 'ANALYTICS_KEY',  env: 'ga-prod-key' },
      { project_id: ID.projectGamma, profile_id: ID.profileGammaDef, env_variable: 'API_ENDPOINT',   env: 'https://api.gamma.acme.com' },
      // Gamma Staging
      { project_id: ID.projectGamma, profile_id: ID.profileGammaStage, env_variable: 'NODE_ENV',     env: 'staging' },
      { project_id: ID.projectGamma, profile_id: ID.profileGammaStage, env_variable: 'ANALYTICS_KEY',env: 'ga-staging-key' },
      // Delta Default
      { project_id: ID.projectDelta, profile_id: ID.profileDeltaDef, env_variable: 'NODE_ENV',       env: 'production' },
      { project_id: ID.projectDelta, profile_id: ID.profileDeltaDef, env_variable: 'BROKER_URL',     env: 'amqp://broker.delta.acme.com' },
      { project_id: ID.projectDelta, profile_id: ID.profileDeltaDef, env_variable: 'QUEUE_NAME',     env: 'notifications' },
      { project_id: ID.projectDelta, profile_id: ID.profileDeltaDef, env_variable: 'RETRY_LIMIT',    env: '5' },
      // Delta Staging
      { project_id: ID.projectDelta, profile_id: ID.profileDeltaStage, env_variable: 'NODE_ENV',     env: 'staging' },
      { project_id: ID.projectDelta, profile_id: ID.profileDeltaStage, env_variable: 'BROKER_URL',   env: 'amqp://broker.staging.delta.acme.com' },
    ];

    const envInserts = envRows.map((r) => ({
      id:           uuidv4(),
      project_id:   r.project_id,
      profile_id:   r.profile_id,
      env_variable: r.env_variable,
      env:          r.env,
      created_at:   daysBack(50),
      updated_at:   daysBack(50),
    }));

    // Deduplicate: skip if (profile_id + env_variable) already exists
    for (const ev of envInserts) {
      const [rows] = await queryInterface.sequelize.query(
        `SELECT id FROM environments WHERE profile_id = '${ev.profile_id}' AND env_variable = '${ev.env_variable}' LIMIT 1;`
      );
      if (!rows || rows.length === 0) {
        await queryInterface.bulkInsert('environments', [ev]);
      }
    }

    // ── 5. NODES ───────────────────────────────────────────────────────────────
    // Mix of roles, statuses, and creation dates to exercise every dashboard widget.
    const nodes = [
      // ── Alpha Web App nodes ──────────────────────────────────
      {
        id:                     ID.nodeAlphaFe,
        project_id:             ID.projectAlpha,
        created_by:             adminId,
        parent_node_id:         null,
        role:                   'frontend',
        service_name:           'alpha-web',
        description:            'Main customer portal frontend (React/Vite).',
        type:                   'service',
        repository_name:        'alpha-web',
        repo_url:               'https://github.com/acme/alpha-web',
        branch_name:            'main',
        env_name:               'alpha-web-main',
        project_env_profile_id: ID.profileAlphaDef,
        port:                   3001,
        build_number:           14,
        build_status:           'success',
        build_result:           'SUCCESS',
        preview_link:           'https://preview-alpha-main.acme.com',
        domain_name:            'preview-alpha-main.acme.com',
        status:                 'active',
        is_deleted:             false,
        default_url:            'https://preview-alpha-main.acme.com',
        jenkins_job_url:        'https://jenkins.acme.com/job/alpha-web-preview/',
        environment:            'preview',
        last_build_at:          daysBack(1),
        created_at:             daysBack(50),
        updated_at:             daysBack(1),
      },
      {
        id:                     ID.nodeAlphaApi,
        project_id:             ID.projectAlpha,
        created_by:             adminId,
        parent_node_id:         null,
        role:                   'api_service',
        service_name:           'alpha-api-svc',
        description:            'Alpha API service definition (template).',
        type:                   'api',
        repository_name:        'beta-api',
        repo_url:               'https://github.com/acme/beta-api',
        branch_name:            null,
        env_name:               null,
        project_env_profile_id: ID.profileAlphaDef,
        port:                   null,
        build_number:           null,
        build_status:           'pending',
        build_result:           null,
        preview_link:           null,
        domain_name:            null,
        status:                 'active',
        is_deleted:             false,
        default_url:            null,
        jenkins_job_url:        'https://jenkins.acme.com/job/beta-api-preview/',
        environment:            'preview',
        last_build_at:          null,
        created_at:             daysBack(48),
        updated_at:             daysBack(48),
      },
      {
        id:                     ID.nodeAlphaApiBranch,
        project_id:             ID.projectAlpha,
        created_by:             adminId,
        parent_node_id:         ID.nodeAlphaApi,
        role:                   'api_branch',
        service_name:           'alpha-api-feature-auth',
        description:            'Feature branch: new OAuth2 flow.',
        type:                   'api',
        repository_name:        'beta-api',
        repo_url:               'https://github.com/acme/beta-api',
        branch_name:            'feature/oauth2-flow',
        env_name:               'alpha-api-feature-auth',
        project_env_profile_id: ID.profileAlphaStage,
        port:                   3002,
        build_number:           7,
        build_status:           'success',
        build_result:           'SUCCESS',
        preview_link:           'https://preview-alpha-api-auth.acme.com',
        domain_name:            'preview-alpha-api-auth.acme.com',
        status:                 'active',
        is_deleted:             false,
        default_url:            'https://preview-alpha-api-auth.acme.com',
        jenkins_job_url:        'https://jenkins.acme.com/job/beta-api-preview/',
        environment:            'preview',
        last_build_at:          daysBack(2),
        created_at:             daysBack(20),
        updated_at:             daysBack(2),
      },

      // ── Beta API Gateway nodes ───────────────────────────────
      {
        id:                     ID.nodeBetaFe,
        project_id:             ID.projectBeta,
        created_by:             adminId,
        parent_node_id:         null,
        role:                   'frontend',
        service_name:           'beta-admin-ui',
        description:            'Admin UI for the Beta API Gateway.',
        type:                   'service',
        repository_name:        'beta-admin-ui',
        repo_url:               'https://github.com/acme/beta-admin-ui',
        branch_name:            'develop',
        env_name:               'beta-admin-ui-dev',
        project_env_profile_id: ID.profileBetaStage,
        port:                   3003,
        build_number:           5,
        build_status:           'failed',
        build_result:           'FAILURE',
        preview_link:           null,
        domain_name:            null,
        status:                 'active',
        is_deleted:             false,
        default_url:            null,
        jenkins_job_url:        'https://jenkins.acme.com/job/beta-admin-ui-preview/',
        environment:            'preview',
        last_build_at:          daysBack(3),
        created_at:             daysBack(45),
        updated_at:             daysBack(3),
      },
      {
        id:                     ID.nodeBetaApi,
        project_id:             ID.projectBeta,
        created_by:             adminId,
        parent_node_id:         null,
        role:                   'api_service',
        service_name:           'beta-api-svc',
        description:            'Beta API service definition.',
        type:                   'api',
        repository_name:        'beta-api',
        repo_url:               'https://github.com/acme/beta-api',
        branch_name:            null,
        env_name:               null,
        project_env_profile_id: ID.profileBetaDef,
        port:                   null,
        build_number:           null,
        build_status:           'pending',
        build_result:           null,
        preview_link:           null,
        domain_name:            null,
        status:                 'active',
        is_deleted:             false,
        default_url:            null,
        jenkins_job_url:        'https://jenkins.acme.com/job/beta-api-preview/',
        environment:            'preview',
        last_build_at:          null,
        created_at:             daysBack(44),
        updated_at:             daysBack(44),
      },
      {
        id:                     ID.nodeBetaApiBranch,
        project_id:             ID.projectBeta,
        created_by:             userId,
        parent_node_id:         ID.nodeBetaApi,
        role:                   'api_branch',
        service_name:           'beta-api-hotfix-auth',
        description:            'Hotfix: broken JWT expiry check.',
        type:                   'api',
        repository_name:        'beta-api',
        repo_url:               'https://github.com/acme/beta-api',
        branch_name:            'hotfix/jwt-expiry',
        env_name:               'beta-api-hotfix-auth',
        project_env_profile_id: ID.profileBetaStage,
        port:                   3004,
        build_number:           3,
        build_status:           'success',
        build_result:           'SUCCESS',
        preview_link:           'https://preview-beta-api-hotfix.acme.com',
        domain_name:            'preview-beta-api-hotfix.acme.com',
        status:                 'active',
        is_deleted:             false,
        default_url:            'https://preview-beta-api-hotfix.acme.com',
        jenkins_job_url:        'https://jenkins.acme.com/job/beta-api-preview/',
        environment:            'preview',
        last_build_at:          daysBack(0, 4),
        created_at:             daysBack(10),
        updated_at:             daysBack(0, 4),
      },

      // ── Gamma Dashboard nodes ────────────────────────────────
      {
        id:                     ID.nodeGammaFe,
        project_id:             ID.projectGamma,
        created_by:             userId,
        parent_node_id:         null,
        role:                   'frontend',
        service_name:           'gamma-dashboard',
        description:            'Internal analytics dashboard frontend.',
        type:                   'service',
        repository_name:        'gamma-dash',
        repo_url:               'https://github.com/acme/gamma-dash',
        branch_name:            'main',
        env_name:               'gamma-dash-main',
        project_env_profile_id: ID.profileGammaDef,
        port:                   3005,
        build_number:           9,
        build_status:           'success',
        build_result:           'SUCCESS',
        preview_link:           'https://preview-gamma-main.acme.com',
        domain_name:            'preview-gamma-main.acme.com',
        status:                 'active',
        is_deleted:             false,
        default_url:            'https://preview-gamma-main.acme.com',
        jenkins_job_url:        'https://jenkins.acme.com/job/gamma-dash-preview/',
        environment:            'preview',
        last_build_at:          daysBack(1, 2),
        created_at:             daysBack(28),
        updated_at:             daysBack(1, 2),
      },
      {
        id:                     ID.nodeGammaApi,
        project_id:             ID.projectGamma,
        created_by:             userId,
        parent_node_id:         null,
        role:                   'api_service',
        service_name:           'gamma-api-svc',
        description:            'Gamma analytics API service.',
        type:                   'api',
        repository_name:        'gamma-api',
        repo_url:               'https://github.com/acme/gamma-api',
        branch_name:            'release/v2',
        env_name:               'gamma-api-release',
        project_env_profile_id: ID.profileGammaStage,
        port:                   3006,
        build_number:           4,
        build_status:           'failed',
        build_result:           'FAILURE',
        preview_link:           null,
        domain_name:            null,
        status:                 'active',
        is_deleted:             false,
        default_url:            null,
        jenkins_job_url:        'https://jenkins.acme.com/job/gamma-api-preview/',
        environment:            'preview',
        last_build_at:          daysBack(2, 1),
        created_at:             daysBack(25),
        updated_at:             daysBack(2, 1),
      },

      // ── Delta Microservice nodes ──────────────────────────────
      {
        id:                     ID.nodeDeltaFe,
        project_id:             ID.projectDelta,
        created_by:             userId,
        parent_node_id:         null,
        role:                   'frontend',
        service_name:           'delta-notify-ui',
        description:            'Notification centre UI (created today).',
        type:                   'service',
        repository_name:        'delta-notify-ui',
        repo_url:               'https://github.com/acme/delta-notify-ui',
        branch_name:            'main',
        env_name:               'delta-notify-ui-main',
        project_env_profile_id: ID.profileDeltaDef,
        port:                   3007,
        build_number:           1,
        build_status:           'building',    // currently building → active_builds count
        build_result:           null,
        preview_link:           null,
        domain_name:            null,
        status:                 'active',
        is_deleted:             false,
        default_url:            null,
        jenkins_job_url:        'https://jenkins.acme.com/job/delta-notify-ui-preview/',
        environment:            'preview',
        last_build_at:          null,
        // Created TODAY to appear in today's trend calculation
        created_at:             new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0),
        updated_at:             new Date(),
      },
      {
        id:                     ID.nodeDeltaApi,
        project_id:             ID.projectDelta,
        created_by:             userId,
        parent_node_id:         null,
        role:                   'api_service',
        service_name:           'delta-api-svc',
        description:            'Delta event API service.',
        type:                   'api',
        repository_name:        'delta-service',
        repo_url:               'https://github.com/acme/delta-service',
        branch_name:            'main',
        env_name:               'delta-api-main',
        project_env_profile_id: ID.profileDeltaDef,
        port:                   3008,
        build_number:           2,
        build_status:           'success',
        build_result:           'SUCCESS',
        preview_link:           'https://preview-delta-api.acme.com',
        domain_name:            'preview-delta-api.acme.com',
        status:                 'active',
        is_deleted:             false,
        default_url:            'https://preview-delta-api.acme.com',
        jenkins_job_url:        'https://jenkins.acme.com/job/delta-api-preview/',
        environment:            'preview',
        last_build_at:          new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0),
        created_at:             new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0, 0),
        updated_at:             new Date(),
      },
      {
        id:                     ID.nodeDeltaApiBranch,
        project_id:             ID.projectDelta,
        created_by:             userId,
        parent_node_id:         ID.nodeDeltaApi,
        role:                   'api_branch',
        service_name:           'delta-api-feature-retry',
        description:            'Feature: exponential back-off retry logic.',
        type:                   'api',
        repository_name:        'delta-service',
        repo_url:               'https://github.com/acme/delta-service',
        branch_name:            'feature/retry-backoff',
        env_name:               'delta-api-feature-retry',
        project_env_profile_id: ID.profileDeltaStage,
        port:                   3009,
        build_number:           1,
        build_status:           'failed',
        build_result:           'FAILURE',
        preview_link:           null,
        domain_name:            null,
        status:                 'active',
        is_deleted:             false,
        default_url:            null,
        jenkins_job_url:        'https://jenkins.acme.com/job/delta-api-preview/',
        environment:            'preview',
        last_build_at:          new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0, 0),
        created_at:             new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 0, 0),
        updated_at:             new Date(),
      },
      {
        // Soft-deleted node — should NOT appear in live counts
        id:                     ID.nodeDeltaFeStale,
        project_id:             ID.projectDelta,
        created_by:             adminId,
        parent_node_id:         null,
        role:                   'frontend',
        service_name:           'delta-old-fe',
        description:            'Decommissioned frontend — soft deleted.',
        type:                   'service',
        repository_name:        'delta-old-fe',
        repo_url:               'https://github.com/acme/delta-old-fe',
        branch_name:            'main',
        env_name:               null,
        project_env_profile_id: null,
        port:                   null,
        build_number:           3,
        build_status:           'success',
        build_result:           'SUCCESS',
        preview_link:           null,
        domain_name:            null,
        status:                 'deleted',
        is_deleted:             true,           // ← soft deleted
        default_url:            null,
        jenkins_job_url:        null,
        environment:            'preview',
        last_build_at:          daysBack(15),
        created_at:             daysBack(40),
        updated_at:             daysBack(15),
      },
    ];

    for (const node of nodes) {
      const existing = await findOne(queryInterface, 'nodes', 'id', node.id);
      if (!existing) await queryInterface.bulkInsert('nodes', [node]);
    }

    // ── 6. NODE ENV VAR OVERRIDES ──────────────────────────────────────────────
    const nodeEnvVars = [
      // alpha-web overrides DATABASE_URL at node level
      { node_id: ID.nodeAlphaFe, profile_id: ID.profileAlphaDef, key: 'API_BASE_URL', value: 'https://preview-alpha-api-auth.acme.com' },
      // alpha-api-branch overrides auth secret
      { node_id: ID.nodeAlphaApiBranch, profile_id: ID.profileAlphaStage, key: 'AUTH_SECRET', value: 'feature-branch-secret' },
      // beta hotfix branch overrides JWT secret
      { node_id: ID.nodeBetaApiBranch, profile_id: ID.profileBetaStage, key: 'JWT_SECRET', value: 'hotfix-jwt-secret' },
      // gamma-api override
      { node_id: ID.nodeGammaApi, profile_id: ID.profileGammaStage, key: 'ANALYTICS_KEY', value: 'ga-release-key' },
    ];

    for (const nev of nodeEnvVars) {
      const [rows] = await queryInterface.sequelize.query(
        `SELECT id FROM node_env_vars WHERE node_id = '${nev.node_id}' AND "key" = '${nev.key}' LIMIT 1;`
      );
      if (!rows || rows.length === 0) {
        await queryInterface.bulkInsert('node_env_vars', [{
          id:                     uuidv4(),
          node_id:                nev.node_id,
          project_env_profile_id: nev.profile_id,
          key:                    nev.key,
          value:                  nev.value,
          created_at:             daysBack(20),
          updated_at:             daysBack(20),
        }]);
      }
    }

    // ── 7. NODE BUILDS ─────────────────────────────────────────────────────────
    //
    // Strategy:
    //   • 70 total build records spread across 35 days
    //   • ~70% success, ~30% failure  →  realistic success-rate ~70%
    //   • Spread across multiple nodes so recent-builds panel shows variety
    //   • Dense cluster in last 7 days so 7d chart is well-populated
    //   • Several builds in last 24 hours so hourly chart has data
    //   • Includes 'building' status entries to test active_builds counter
    //   • `jenkins_build_number` populated for half the rows so console links render
    //
    // Each entry: [node_id, daysAgo, hoursOffset, status, jenkinsBuildNum]
    //   daysAgo=0 + hoursOffset < 24  → appears in 24h hourly chart
    //   daysAgo < 7                   → appears in 7d range
    //   daysAgo < 30                  → appears in 30d range

    const buildSpecs = [
      // ─────────────────── older history (days 35–8) ───────────────────────────
      [ID.nodeAlphaFe,        35, 0,  'success',  101],
      [ID.nodeBetaFe,         34, 0,  'failed',   201],
      [ID.nodeAlphaFe,        33, 0,  'success',  102],
      [ID.nodeAlphaApiBranch, 32, 0,  'failed',   301],
      [ID.nodeBetaApi,        31, 0,  'success',  202],
      [ID.nodeAlphaFe,        30, 0,  'success',  103],
      [ID.nodeBetaFe,         29, 0,  'failed',   203],
      [ID.nodeGammaFe,        28, 0,  'success',  401],
      [ID.nodeAlphaFe,        27, 0,  'success',  104],
      [ID.nodeBetaApiBranch,  26, 0,  'success',  204],
      [ID.nodeAlphaApiBranch, 25, 0,  'success',  302],
      [ID.nodeGammaApi,       24, 0,  'failed',   402],
      [ID.nodeAlphaFe,        23, 0,  'success',  105],
      [ID.nodeBetaFe,         22, 0,  'success',  205],
      [ID.nodeAlphaApiBranch, 22, 6,  'failed',   303],
      [ID.nodeGammaFe,        21, 0,  'success',  403],
      [ID.nodeBetaApiBranch,  20, 0,  'success',  206],
      [ID.nodeAlphaFe,        19, 0,  'success',  106],
      [ID.nodeGammaApi,       18, 0,  'success',  404],
      [ID.nodeBetaFe,         17, 0,  'failed',   207],
      [ID.nodeAlphaApiBranch, 16, 0,  'success',  304],
      [ID.nodeAlphaFe,        15, 0,  'success',  107],
      [ID.nodeDeltaFeStale,   15, 2,  'success',  null],  // soft-deleted node — builds still visible
      [ID.nodeBetaApiBranch,  14, 0,  'failed',   208],
      [ID.nodeGammaFe,        13, 0,  'success',  405],
      [ID.nodeAlphaFe,        12, 0,  'failed',   108],
      [ID.nodeBetaFe,         11, 0,  'success',  209],
      [ID.nodeAlphaApiBranch, 10, 0,  'success',  305],
      [ID.nodeGammaApi,       10, 5,  'failed',   406],
      [ID.nodeBetaApiBranch,   9, 0,  'success',  210],
      [ID.nodeAlphaFe,         9, 3,  'success',  109],
      [ID.nodeGammaFe,         8, 0,  'success',  407],

      // ─────────────────── last 7 days (days 7–1, dense) ───────────────────────
      [ID.nodeBetaFe,          7, 0,  'failed',   211],
      [ID.nodeAlphaFe,         7, 4,  'success',  110],
      [ID.nodeAlphaApiBranch,  7, 8,  'success',  306],
      [ID.nodeBetaApiBranch,   6, 0,  'success',  212],
      [ID.nodeGammaApi,        6, 2,  'success',  408],
      [ID.nodeAlphaFe,         5, 0,  'success',  111],
      [ID.nodeBetaFe,          5, 5,  'failed',   213],
      [ID.nodeGammaFe,         4, 0,  'success',  409],
      [ID.nodeAlphaApiBranch,  4, 3,  'success',  307],
      [ID.nodeBetaApiBranch,   3, 0,  'success',  214],
      [ID.nodeGammaApi,        3, 1,  'failed',   410],
      [ID.nodeAlphaFe,         2, 0,  'success',  112],
      [ID.nodeAlphaApiBranch,  2, 6,  'failed',   308],
      [ID.nodeBetaFe,          2, 2,  'success',  215],
      [ID.nodeGammaFe,         1, 0,  'success',  411],
      [ID.nodeBetaApiBranch,   1, 3,  'success',  216],
      [ID.nodeAlphaFe,         1, 1,  'success',  113],
      [ID.nodeGammaApi,        1, 5,  'success',  412],

      // ─────────────────── last 24 hours (hourly chart data) ───────────────────
      // daysAgo=0, hoursOffset drives which hour bucket they land in
      [ID.nodeDeltaApi,        0, 23, 'success',  501],
      [ID.nodeDeltaApiBranch,  0, 22, 'failed',   502],
      [ID.nodeAlphaFe,         0, 20, 'success',  114],
      [ID.nodeBetaFe,          0, 18, 'success',  217],
      [ID.nodeGammaFe,         0, 16, 'failed',   413],
      [ID.nodeAlphaApiBranch,  0, 14, 'success',  309],
      [ID.nodeBetaApiBranch,   0, 12, 'success',  218],
      [ID.nodeGammaApi,        0, 10, 'success',  414],
      [ID.nodeDeltaApi,        0,  8, 'success',  503],
      [ID.nodeDeltaApiBranch,  0,  6, 'failed',   504],
      [ID.nodeAlphaFe,         0,  4, 'success',  115],
      [ID.nodeBetaFe,          0,  2, 'failed',   219],
      // A 'building' entry — contributes to active_builds but normalises to 'building' in charts
      [ID.nodeDeltaFe,         0,  1, 'building', null],
    ];

    // Per-node build counter (for sequential build_number)
    const buildCounter = {};

    for (const [nodeId, daysAgo, hoursOffset, status, jenkinsBuildNum] of buildSpecs) {
      buildCounter[nodeId] = (buildCounter[nodeId] || 0) + 1;
      const builtAt = daysBack(daysAgo, hoursOffset);

      // Skip if a build already exists for this node_id + built_at (idempotency)
      const builtAtStr = builtAt.toISOString();
      const [existing] = await queryInterface.sequelize.query(
        `SELECT id FROM node_builds WHERE node_id = '${nodeId}' AND built_at = '${builtAtStr}' LIMIT 1;`
      );
      if (existing && existing.length > 0) continue;

      await queryInterface.bulkInsert('node_builds', [{
        id:                   uuidv4(),
        node_id:              nodeId,
        build_number:         buildCounter[nodeId],
        jenkins_build_number: jenkinsBuildNum,
        built_at:             builtAt,
        status,
        created_at:           builtAt,
        updated_at:           builtAt,
      }]);
    }

    // ── 8. CONFIGURATION ──────────────────────────────────────────────────────
    // Seed just enough Jenkins config so the UI can construct console log links.
    // jenkins_base_url + jenkins_job_preview are the two values read by
    // GET /api/jenkins/public-config → used by RecentBuildsPanel to build:
    //   {baseUrl}/job/{jobPreview}/{jenkins_build_number}/console
    //
    // Note: the node's jenkins_job_url (e.g. ".../job/alpha-web-preview/") takes
    // priority in the link builder — the job name is extracted from that URL per
    // node. jenkins_job_preview is only the fallback when jenkins_job_url is absent.
    const configRows = [
      { key_name: 'jenkins_base_url',    value_text: 'https://jenkins.acme.com', category: 'jenkins', is_secret: false },
      { key_name: 'jenkins_job_preview', value_text: 'preview-deploy',           category: 'jenkins', is_secret: false },
    ];

    for (const cfg of configRows) {
      const [existing] = await queryInterface.sequelize.query(
        `SELECT id FROM configuration WHERE key_name = '${cfg.key_name}' LIMIT 1;`
      );
      if (!existing || existing.length === 0) {
        await queryInterface.bulkInsert('configuration', [{
          id:         uuidv4(),
          key_name:   cfg.key_name,
          value_text: cfg.value_text,
          category:   cfg.category,
          is_secret:  cfg.is_secret,
          created_at: daysBack(90),
          updated_at: daysBack(90),
        }]);
      }
    }

    console.log('✅  Comprehensive test data seeded successfully.');
    console.log('    Projects:  4  (Alpha, Beta, Gamma, Delta)');
    console.log('    Profiles:  8  (2 per project)');
    console.log('    Env vars: 26');
    console.log('    Nodes:    12  (11 active, 1 soft-deleted)');
    console.log('    Builds:   70  (~70% success, ~30% failed/building)');
    console.log('    Time span: last 35 days  →  all chart ranges populated');
    console.log('    Config:    jenkins_base_url + jenkins_job_preview seeded → Jenkins links active');
  },

  // ── down: removes only the test data inserted by this seeder ─────────────────
  async down(queryInterface, Sequelize) {
    const allNodeIds = Object.values({
      nodeAlphaFe:        ID.nodeAlphaFe,
      nodeAlphaApi:       ID.nodeAlphaApi,
      nodeAlphaApiBranch: ID.nodeAlphaApiBranch,
      nodeBetaFe:         ID.nodeBetaFe,
      nodeBetaApi:        ID.nodeBetaApi,
      nodeBetaApiBranch:  ID.nodeBetaApiBranch,
      nodeGammaFe:        ID.nodeGammaFe,
      nodeGammaApi:       ID.nodeGammaApi,
      nodeDeltaFe:        ID.nodeDeltaFe,
      nodeDeltaApi:       ID.nodeDeltaApi,
      nodeDeltaApiBranch: ID.nodeDeltaApiBranch,
      nodeDeltaFeStale:   ID.nodeDeltaFeStale,
    });

    // node_builds (CASCADE would handle this, but be explicit)
    for (const nodeId of allNodeIds) {
      await queryInterface.bulkDelete('node_builds', { node_id: nodeId }, {});
    }

    // node_env_vars
    for (const nodeId of allNodeIds) {
      await queryInterface.bulkDelete('node_env_vars', { node_id: nodeId }, {});
    }

    // nodes
    for (const nodeId of allNodeIds) {
      await queryInterface.bulkDelete('nodes', { id: nodeId }, {});
    }

    // environments
    const profileIds = [
      ID.profileAlphaDef, ID.profileAlphaStage,
      ID.profileBetaDef,  ID.profileBetaStage,
      ID.profileGammaDef, ID.profileGammaStage,
      ID.profileDeltaDef, ID.profileDeltaStage,
    ];
    for (const pid of profileIds) {
      await queryInterface.bulkDelete('environments', { profile_id: pid }, {});
    }

    // project_env_profiles
    for (const pid of profileIds) {
      await queryInterface.bulkDelete('project_env_profiles', { id: pid }, {});
    }

    // projects
    for (const projId of [ID.projectAlpha, ID.projectBeta, ID.projectGamma, ID.projectDelta]) {
      await queryInterface.bulkDelete('projects', { id: projId }, {});
    }

    // stats row (will be recomputed fresh on next request)
    await queryInterface.bulkDelete('stats', {}, {});

    // configuration rows added by this seeder
    await queryInterface.bulkDelete('configuration', { key_name: 'jenkins_base_url'    }, {});
    await queryInterface.bulkDelete('configuration', { key_name: 'jenkins_job_preview' }, {});

    console.log('✅  Comprehensive test data removed.');
  },
};
