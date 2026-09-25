from app.queue import get_next_job
from run_pipeline import run_pipeline
from app.loader import SessionLocal
from app.job_model import create_job, update_job_status
from app.schema_healer import attempt_schema_healing


def _collect_error_messages(e: Exception, result: dict | None) -> list[str]:
    """Collect all meaningful error strings from a pipeline failure."""
    messages = [str(e)]
    if result and result.get("rejected_details"):
        for rej in result["rejected_details"]:
            for err in rej["errors"]:
                msg = f"Row {rej['row']} | field '{err['field']}': {err['error']} (value: {err['value']})"
                messages.append(msg)
    return messages


def process_job(job):

    print()
    print("=" * 50)
    print("PROCESSING ONBOARDING JOB")
    print("=" * 50)

    print(f"Job ID: {job['job_id']}")
    print(f"Customer: {job['customer']}")
    print(f"File: {job['file']}")

    session = SessionLocal()

    try:

        # Create job record
        create_job(
            session,
            job["job_id"],
            job["customer"],
            job["file"]
        )

        session.commit()

        # Mark job as processing
        update_job_status(
            session,
            job["job_id"],
            "PROCESSING"
        )

        session.commit()

        # Define progress callback
        def progress_callback(step, message):
            update_job_status(
                session,
                job["job_id"],
                "PROCESSING",
                current_step=step,
                status_message=message
            )
            session.commit()

        # ------------------------------------------------------------------ #
        # First attempt: run the onboarding pipeline normally                 #
        # ------------------------------------------------------------------ #
        pipeline_error = None
        result = None

        try:
            result = run_pipeline(
                customer_name=job["customer"],
                file_path=job["file"],
                progress_callback=progress_callback
            )
        except Exception as first_error:
            pipeline_error = first_error
            print()
            print("PIPELINE FAILED ON FIRST ATTEMPT — collecting errors...")
            print(first_error)

        # ------------------------------------------------------------------ #
        # Self-healing: if pipeline failed, ask the LLM to fix the schema    #
        # and retry once                                                       #
        # ------------------------------------------------------------------ #
        if pipeline_error is not None:
            error_messages = _collect_error_messages(pipeline_error, result)

            update_job_status(
                session,
                job["job_id"],
                "PROCESSING",
                current_step="schema_mapping",
                status_message="Schema error detected — LLM self-healing in progress..."
            )
            session.commit()

            healed = attempt_schema_healing(
                customer_name=job["customer"],
                file_path=job["file"],
                error_messages=error_messages
            )

            if healed:
                print()
                print("Retrying pipeline with healed schema...")
                update_job_status(
                    session,
                    job["job_id"],
                    "PROCESSING",
                    current_step="validation",
                    status_message="Retrying with corrected schema..."
                )
                session.commit()

                try:
                    result = run_pipeline(
                        customer_name=job["customer"],
                        file_path=job["file"],
                        progress_callback=progress_callback
                    )
                    pipeline_error = None  # healed successfully
                except Exception as retry_error:
                    pipeline_error = retry_error
                    print()
                    print("PIPELINE FAILED EVEN AFTER SELF-HEALING")
                    print(retry_error)
            else:
                print("  [Healer] Self-healing was not possible.")

        # If still failing after healing attempt, raise to mark job FAILED
        if pipeline_error is not None:
            raise pipeline_error

        # ------------------------------------------------------------------ #
        # Success path: persist rejected records and mark COMPLETED           #
        # ------------------------------------------------------------------ #
        from app.job_model import insert_rejected_record
        if "rejected_details" in result and result["rejected_details"]:
            for rej in result["rejected_details"]:
                for err in rej["errors"]:
                    insert_rejected_record(
                        session,
                        job_id=job["job_id"],
                        row_number=rej["row"],
                        customer=job["customer"],
                        field_name=err["field"],
                        error_message=err["error"],
                        raw_value=err["value"]
                    )
            session.commit()

        # Mark job as completed
        update_job_status(
            session,
            job["job_id"],
            "COMPLETED",
            records_received=result["received"],
            records_valid=result["valid"],
            records_rejected=result["rejected"]
        )

        session.commit()

        print()
        print("JOB RESULT")
        print("-" * 50)
        print(f"Records received: {result['received']}")
        print(f"Records valid: {result['valid']}")
        print(f"Records rejected: {result['rejected']}")

        print()
        print("Job completed successfully")

    except Exception as e:

        session.rollback()

        print()
        print("JOB FAILED")
        print(e)

        try:

            update_job_status(
                session,
                job["job_id"],
                "FAILED",
                error_message=str(e)
            )

            session.commit()

        except Exception as status_error:

            session.rollback()

            print("Failed to update job status")
            print(status_error)

    finally:

        session.close()


def start_worker():

    print("Worker started...")
    print("Waiting for jobs...")

    while True:

        job = get_next_job()

        if job is None:
            continue

        process_job(job)


if __name__ == "__main__":
    start_worker()