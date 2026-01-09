-- Initialize databases for Order Management System microservices
-- This script runs automatically when the PostgreSQL container starts

-- Create databases for each service
CREATE DATABASE oms_orders_db;
CREATE DATABASE oms_products_db;
CREATE DATABASE oms_users_db;
CREATE DATABASE oms_payments_db;

-- Create dedicated users for each service (following principle of least privilege)
CREATE USER orders_user WITH PASSWORD 'orders_pass';
CREATE USER products_user WITH PASSWORD 'products_pass';
CREATE USER users_user WITH PASSWORD 'users_pass';
CREATE USER payments_user WITH PASSWORD 'payments_pass';

-- Grant all privileges on respective databases to service users
GRANT ALL PRIVILEGES ON DATABASE oms_orders_db TO orders_user;
GRANT ALL PRIVILEGES ON DATABASE oms_products_db TO products_user;
GRANT ALL PRIVILEGES ON DATABASE oms_users_db TO users_user;
GRANT ALL PRIVILEGES ON DATABASE oms_payments_db TO payments_user;

-- Connect to each database and grant schema privileges
\c oms_orders_db;
GRANT ALL ON SCHEMA public TO orders_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO orders_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO orders_user;

\c oms_products_db;
GRANT ALL ON SCHEMA public TO products_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO products_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO products_user;

\c oms_users_db;
GRANT ALL ON SCHEMA public TO users_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO users_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO users_user;

\c oms_payments_db;
GRANT ALL ON SCHEMA public TO payments_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO payments_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO payments_user;

-- Switch back to default database
\c postgres;
