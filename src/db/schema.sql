-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id INTEGER NOT NULL REFERENCES roles(id),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id)
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
  ('admin', 'Administrator with full access'),
  ('user', 'Regular user with limited access')
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions
INSERT INTO permissions (name, description) VALUES
  ('view', 'Can view resources'),
  ('create', 'Can create new resources'),
  ('update', 'Can update existing resources'),
  ('delete', 'Can delete resources')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
-- Admin role gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'admin'),
  id
FROM permissions
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- User role gets only view permission
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'user'),
  (SELECT id FROM permissions WHERE name = 'view')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_modtime
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_roles_modtime
BEFORE UPDATE ON roles
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Create a sample admin user (password: admin123)
-- Using simplified SHA-256 hash for demo purposes
INSERT INTO users (username, email, password_hash, role_id)
VALUES (
  'admin',
  'admin@example.com',
  'demo-salt:f6f2ea8f45d8a057c9566a33f99474da2e5c6a6604d736121650e2730c6fb0a3', -- simplified hash for 'admin123'
  (SELECT id FROM roles WHERE name = 'admin')
)
ON CONFLICT (username) DO NOTHING;

-- Create a sample regular user (password: user123)
INSERT INTO users (username, email, password_hash, role_id)
VALUES (
  'user',
  'user@example.com',
  'demo-salt:8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', -- simplified hash for 'user123'
  (SELECT id FROM roles WHERE name = 'user')
)
ON CONFLICT (username) DO NOTHING; 