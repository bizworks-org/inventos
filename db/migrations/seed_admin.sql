-- seed_admin.sql (manual seed helper)
-- Usage: replace placeholders and run once

-- Replace with your values
SET @EMAIL = 'admin@inventos.io';
SET @NAME = 'Admin User';
SET @HASH = 'scrypt$16384$<salt>$<hash>'; -- generate via: npm run hash:pw -- "YourStrongPassword"

-- Create user if not exists
INSERT INTO users (id, email, name, password_hash, active)
SELECT UUID(), @EMAIL, @NAME, @HASH, 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = @EMAIL);

-- Link admin role
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = @EMAIL AND r.name = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id
  );
