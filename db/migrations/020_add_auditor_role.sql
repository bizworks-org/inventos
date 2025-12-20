-- 020_add_auditor_role.sql
-- Purpose: Add 'auditor' role with read-only permissions for assets, vendors, licenses

START TRANSACTION;

INSERT IGNORE INTO roles (name, description) VALUES
  ('auditor', 'Read-only auditor');

-- Grant read permissions to auditor (if permissions exist)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id AS role_id, p.id AS permission_id
FROM roles r
JOIN permissions p ON p.name IN ('read_assets', 'read_vendors', 'read_licenses')
WHERE r.name = 'auditor';

COMMIT;
