-- CREATE TABLE customers (
--     customer_id VARCHAR(100) PRIMARY KEY,
--     first_name VARCHAR(100) NOT NULL,
--     last_name VARCHAR(100) NOT NULL,
--     email VARCHAR(255),
--     phone VARCHAR(50),
--     created_at DATE
-- );

CREATE TABLE onboarding_jobs (
    job_id VARCHAR(100) PRIMARY KEY,
    customer VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    records_received INTEGER DEFAULT 0,
    records_valid INTEGER DEFAULT 0,
    records_rejected INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);