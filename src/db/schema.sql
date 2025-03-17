-- Enable database session variables for user context
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to get current user context
CREATE OR REPLACE FUNCTION get_current_user_id() RETURNS INTEGER AS $$
BEGIN
    RETURN NULLIF(current_setting('app.user_id', TRUE), '')::INTEGER;
EXCEPTION 
    WHEN OTHERS THEN 
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user role
CREATE OR REPLACE FUNCTION get_current_user_role() RETURNS VARCHAR AS $$
BEGIN
    RETURN (
        SELECT r.name 
        FROM roles r 
        JOIN users u ON u.role_id = r.id 
        WHERE u.id = get_current_user_id()
    );
EXCEPTION 
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  playlist_url TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  author VARCHAR(100) NOT NULL,
  number_of_videos INTEGER,
  created_by INTEGER NOT NULL REFERENCES users(id),
  is_active BOOLEAN DEFAULT TRUE,
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

-- Enable Row Level Security on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for users table
CREATE POLICY users_view_policy ON users
    FOR SELECT
    TO PUBLIC
    USING (
        -- Users can view their own data, admins can view all
        get_current_user_id() IS NOT NULL AND (
            id = get_current_user_id() OR 
            get_current_user_role() = 'admin'
        )
    );

CREATE POLICY users_insert_policy ON users
    FOR INSERT
    TO PUBLIC
    WITH CHECK (
        -- Only admins can create users
        get_current_user_role() = 'admin'
    );

CREATE POLICY users_update_policy ON users
    FOR UPDATE
    TO PUBLIC
    USING (
        -- Users can update their own data, admins can update all
        get_current_user_id() IS NOT NULL AND (
            id = get_current_user_id() OR 
            get_current_user_role() = 'admin'
        )
    );

CREATE POLICY users_delete_policy ON users
    FOR DELETE
    TO PUBLIC
    USING (
        -- Only admins can delete users
        get_current_user_role() = 'admin'
    );

-- Create RLS Policies for videos table
CREATE POLICY videos_view_policy ON videos
    FOR SELECT
    TO PUBLIC
    USING (
        -- Authenticated users can view active videos
        get_current_user_id() IS NOT NULL AND
        is_active = true
    );

CREATE POLICY videos_insert_policy ON videos
    FOR INSERT
    TO PUBLIC
    WITH CHECK (
        -- Only admins can create videos
        get_current_user_role() = 'admin'
    );

CREATE POLICY videos_update_policy ON videos
    FOR UPDATE
    TO PUBLIC
    USING (
        -- Only admins can update videos
        get_current_user_role() = 'admin'
    );

CREATE POLICY videos_delete_policy ON videos
    FOR DELETE
    TO PUBLIC
    USING (
        -- Only admins can delete videos
        get_current_user_role() = 'admin'
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

CREATE TRIGGER update_videos_modtime
BEFORE UPDATE ON videos
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Create a sample admin user (password: admin123)
-- Using hardcoded hash for demo purposes
INSERT INTO users (username, email, password_hash, role_id)
VALUES (
  'admin',
  'admin@example.com',
  'demo-salt:8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', -- hardcoded hash for 'admin123'
  (SELECT id FROM roles WHERE name = 'admin')
)
ON CONFLICT (username) DO NOTHING;

-- Create a sample regular user (password: user123)
INSERT INTO users (username, email, password_hash, role_id)
VALUES (
  'user',
  'user@example.com',
  'demo-salt:8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', -- hardcoded hash for 'user123'
  (SELECT id FROM roles WHERE name = 'user')
)
ON CONFLICT (username) DO NOTHING; 