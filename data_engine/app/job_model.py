from sqlalchemy import text


def create_job(session, job_id, customer, file_name):

    query = text("""
        INSERT INTO onboarding_jobs (
            job_id,
            customer,
            file_name,
            status
        )
        VALUES (
            :job_id,
            :customer,
            :file_name,
            'QUEUED'
        )
    """)

    session.execute(
        query,
        {
            "job_id": job_id,
            "customer": customer,
            "file_name": file_name
        }
    )


def update_job_status(
    session,
    job_id,
    status,
    records_received=0,
    records_valid=0,
    records_rejected=0,
    error_message=None,
    current_step=None,
    status_message=None
):

    query = text("""
        UPDATE onboarding_jobs
        SET
            status = :status,
            records_received = :records_received,
            records_valid = :records_valid,
            records_rejected = :records_rejected,
            error_message = :error_message,
            current_step = :current_step,
            status_message = :status_message,
            updated_at = CURRENT_TIMESTAMP
        WHERE job_id = :job_id
    """)

    session.execute(
        query,
        {
            "job_id": job_id,
            "status": status,
            "records_received": records_received,
            "records_valid": records_valid,
            "records_rejected": records_rejected,
            "error_message": error_message,
            "current_step": current_step,
            "status_message": status_message
        }
    )

def insert_rejected_record(session, job_id, row_number, customer, field_name, error_message, raw_value):
    query = text("""
        INSERT INTO rejected_records (
            job_id,
            row_number,
            customer,
            field_name,
            error_message,
            raw_value
        )
        VALUES (
            :job_id,
            :row_number,
            :customer,
            :field_name,
            :error_message,
            :raw_value
        )
    """)

    session.execute(
        query,
        {
            "job_id": job_id,
            "row_number": row_number,
            "customer": customer,
            "field_name": field_name,
            "error_message": error_message,
            "raw_value": raw_value
        }
    )