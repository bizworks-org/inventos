-- 002_auth_users.sql
-- Purpose: Create users, roles, permissions and session tables for authentication and RBAC
-- Engine: MySQL 8+

START TRANSACTION;

-- Roles master table
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(32) NOT NULL UNIQUE,
  description VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL PRIMARY KEY,           -- store UUIDs in canonical form
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,        -- format: scrypt$N$salt$hash
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Roles (supports multiple roles per user)
CREATE TABLE IF NOT EXISTS user_roles (
  user_id CHAR(36) NOT NULL,
  role_id INT NOT NULL,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permissions (optional granular RBAC)
CREATE TABLE IF NOT EXISTS permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(64) NOT NULL UNIQUE,
  description VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_roleperm_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_roleperm_perm FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions (optional, for managed sessions if you choose to store them)
CREATE TABLE IF NOT EXISTS sessions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token_hash VARBINARY(64) NULL,              -- store hash of token if persisting
  issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NULL,
  user_agent VARCHAR(255) NULL,
  ip_address VARCHAR(45) NULL,
  revoked_at DATETIME NULL,
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sessions_user (user_id),
  INDEX idx_sessions_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed base roles
INSERT IGNORE INTO roles (id, name, description) VALUES
  (1, 'admin', 'Full administrative access'),
  (2, 'user', 'Standard user');

-- Seed permissions (extend as needed)
INSERT IGNORE INTO permissions (id, name, description) VALUES
  (1, 'manage_users', 'Create and manage users'),
  (2, 'read_assets', 'View assets'),
  (3, 'write_assets', 'Create/update/delete assets'),
  (4, 'read_licenses', 'View licenses'),
  (5, 'write_licenses', 'Create/update/delete licenses'),
  (6, 'read_vendors', 'View vendors'),
  (7, 'write_vendors', 'Create/update/delete vendors'),
  (8, 'read_events', 'View events');

-- Grant all permissions to admin role
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 1 AS role_id, p.id FROM permissions p;

-- Optional: grant read-only to user role
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
  (2, 2), (2, 4), (2, 6), (2, 8);

-- NOTE: To create an initial admin user, run something like:
-- INSERT INTO users (id, email, name, password_hash, active)
-- VALUES (UUID(), 'admin@inventos.io', 'Admin User', 'scrypt$16384$<salt>$<hash>', 1);
-- Then link role:
-- INSERT INTO user_roles (user_id, role_id) VALUES ('<the-user-uuid>', 1);

COMMIT;
