-- 019_create_superadmin.sql
-- Create a `superadmin` role and a Superadmin user if one does not already exist.
-- Usage: adjust the placeholders below (email/name/password hash) and run once.

START TRANSACTION;

-- Ensure the 'superadmin' role exists (use id 3 to follow existing seeds)
INSERT IGNORE INTO
    roles (id, name, description)
VALUES (
        3,
        'superadmin',
        'Super administrator with full access (immutable from UI)'
    );

-- Replace these values before running the migration (or set them here):
SET @EMAIL = 'superadmin@inventos.io';

SET @NAME = 'Super Admin';
-- Generate a password hash with your project's hash helper, e.g.:
--   node scripts/hash-password.mjs "YourStrongPassword"
-- and paste the resulting scrypt hash string below.
SET
    @HASH = 'scrypt$16384$3cce1abe8df2593a206096061e4bf814$4da80cb1347d2e504231e4f8df621aa1a31d5a5cd2960174fe60abeef29a9c752659e1c268d1c0e418a8765dffe3d4e2b22af5a2c247d025ddb9005ef70aec7b';
-- replace with real hash

-- Create Superadmin user if not exists
INSERT INTO
    users (
        id,
        email,
        name,
        password_hash,
        active
    )
SELECT UUID(), @EMAIL, @NAME, @HASH, 1
WHERE
    NOT EXISTS (
        SELECT 1
        FROM users
        WHERE
            email = @EMAIL
    );

-- Link superadmin role to the newly created user
INSERT INTO
    user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE
    u.email = @EMAIL
    AND r.name = 'superadmin'
    AND NOT EXISTS (
        SELECT 1
        FROM user_roles ur
        WHERE
            ur.user_id = u.id
            AND ur.role_id = r.id
    );

-- Grant all current permissions to superadmin (if you use permissions table)
INSERT IGNORE INTO
    role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE
    r.name = 'superadmin'
    AND NOT EXISTS (
        SELECT 1
        FROM role_permissions rp
        WHERE
            rp.role_id = r.id
            AND rp.permission_id = p.id
    );

COMMIT;