-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User context functions
CREATE OR REPLACE FUNCTION get_current_user_id() RETURNS INTEGER AS $$
BEGIN
    RETURN NULLIF(current_setting('app.user_id', TRUE), '')::INTEGER;
EXCEPTION 
    WHEN OTHERS THEN 
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Core tables
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS access_codes (
    id SERIAL PRIMARY KEY,
    code CHAR(8) NOT NULL UNIQUE,
    created_by INTEGER NOT NULL REFERENCES users(id),
    is_used BOOLEAN DEFAULT FALSE,
    used_by INTEGER REFERENCES users(id),
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS videos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    playlist_url TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    author VARCHAR(100) NOT NULL,
    number_of_videos INTEGER,
    labels TEXT[] DEFAULT '{}',
    created_by INTEGER NOT NULL REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- New tables for video interactions
CREATE TABLE IF NOT EXISTS video_likes (
    id SERIAL PRIMARY KEY,
    video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(video_id, user_id)
);

CREATE TABLE IF NOT EXISTS video_comments (
    id SERIAL PRIMARY KEY,
    video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);

-- Triggers for video interactions
CREATE OR REPLACE FUNCTION update_video_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE videos SET likes_count = likes_count + 1 WHERE id = NEW.video_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE videos SET likes_count = likes_count - 1 WHERE id = OLD.video_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_video_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE videos SET comments_count = comments_count + 1 WHERE id = NEW.video_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE videos SET comments_count = comments_count - 1 WHERE id = OLD.video_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_video_likes_count_trigger
    AFTER INSERT OR DELETE ON video_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_video_likes_count();

CREATE TRIGGER update_video_comments_count_trigger
    AFTER INSERT OR DELETE ON video_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_video_comments_count();

-- Access code management functions
CREATE OR REPLACE FUNCTION verify_access_code(code_to_verify VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM access_codes 
        WHERE code = code_to_verify 
        AND is_used = FALSE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION mark_code_as_used(code_to_mark VARCHAR, user_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE access_codes 
    SET is_used = TRUE,
        used_by = user_id,
        used_at = NOW()
    WHERE code = code_to_mark 
    AND is_used = FALSE;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for marking access code as used
CREATE OR REPLACE FUNCTION handle_user_creation()
RETURNS TRIGGER AS $$
BEGIN
    IF current_setting('app.access_code', TRUE) IS NOT NULL THEN
        PERFORM mark_code_as_used(
            current_setting('app.access_code', TRUE),
            NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER after_user_creation
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION handle_user_creation();

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated timestamp triggers for each table
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

CREATE TRIGGER update_comments_modtime
    BEFORE UPDATE ON video_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY users_view_policy ON users
    FOR SELECT
    TO PUBLIC
    USING (
        get_current_user_id() IS NOT NULL AND (
            id = get_current_user_id() OR 
            get_current_user_role() = 'admin'
        )
    );

CREATE POLICY users_insert_policy ON users
    FOR INSERT
    TO PUBLIC
    WITH CHECK (
        get_current_user_role() = 'admin' OR
        verify_access_code(current_setting('app.access_code', TRUE))
    );

CREATE POLICY users_update_policy ON users
    FOR UPDATE
    TO PUBLIC
    USING (
        get_current_user_id() IS NOT NULL AND (
            id = get_current_user_id() OR 
            get_current_user_role() = 'admin'
        )
    );

CREATE POLICY users_delete_policy ON users
    FOR DELETE
    TO PUBLIC
    USING (
        get_current_user_role() = 'admin'
    );

-- RLS Policies for videos table
CREATE POLICY videos_view_policy ON videos
    FOR SELECT
    TO PUBLIC
    USING (
        get_current_user_id() IS NOT NULL AND
        is_active = true
    );

CREATE POLICY videos_insert_policy ON videos
    FOR INSERT
    TO PUBLIC
    WITH CHECK (
        get_current_user_role() = 'admin'
    );

CREATE POLICY videos_update_policy ON videos
    FOR UPDATE
    TO PUBLIC
    USING (
        get_current_user_role() = 'admin'
    );

CREATE POLICY videos_delete_policy ON videos
    FOR DELETE
    TO PUBLIC
    USING (
        get_current_user_role() = 'admin'
    );

-- RLS Policies for access_codes table
CREATE POLICY access_codes_view_policy ON access_codes
    FOR SELECT
    TO PUBLIC
    USING (
        get_current_user_role() = 'admin'
    );

CREATE POLICY access_codes_insert_policy ON access_codes
    FOR INSERT
    TO PUBLIC
    WITH CHECK (
        get_current_user_role() = 'admin'
    );

CREATE POLICY access_codes_delete_policy ON access_codes
    FOR DELETE
    TO PUBLIC
    USING (
        get_current_user_role() = 'admin'
    );

-- RLS Policies for video_likes table
CREATE POLICY video_likes_view_policy ON video_likes
    FOR SELECT
    TO PUBLIC
    USING (
        get_current_user_id() IS NOT NULL
    );

CREATE POLICY video_likes_insert_policy ON video_likes
    FOR INSERT
    TO PUBLIC
    WITH CHECK (
        get_current_user_id() IS NOT NULL AND
        get_current_user_id() = user_id
    );

CREATE POLICY video_likes_delete_policy ON video_likes
    FOR DELETE
    TO PUBLIC
    USING (
        get_current_user_id() IS NOT NULL AND
        get_current_user_id() = user_id
    );

-- RLS Policies for video_comments table
CREATE POLICY video_comments_view_policy ON video_comments
    FOR SELECT
    TO PUBLIC
    USING (
        get_current_user_id() IS NOT NULL
    );

CREATE POLICY video_comments_insert_policy ON video_comments
    FOR INSERT
    TO PUBLIC
    WITH CHECK (
        get_current_user_id() IS NOT NULL AND
        get_current_user_id() = user_id
    );

CREATE POLICY video_comments_update_policy ON video_comments
    FOR UPDATE
    TO PUBLIC
    USING (
        get_current_user_id() IS NOT NULL AND
        get_current_user_id() = user_id
    );

CREATE POLICY video_comments_delete_policy ON video_comments
    FOR DELETE
    TO PUBLIC
    USING (
        get_current_user_id() IS NOT NULL AND (
            get_current_user_id() = user_id OR
            get_current_user_role() = 'admin'
        )
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
    ('delete', 'Can delete resources'),
    ('like', 'Can like videos'),
    ('comment', 'Can comment on videos')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
-- Admin role gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'admin'),
    id
FROM permissions
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- User role gets view, like, and comment permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'user'),
    id
FROM permissions 
WHERE name IN ('view', 'like', 'comment')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Create default admin user (password: admin123)
INSERT INTO users (username, email, password_hash, role_id)
VALUES (
    'admin',
    'admin@example.com',
    'demo-salt:8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
    (SELECT id FROM roles WHERE name = 'admin')
)
ON CONFLICT (username) DO NOTHING; 