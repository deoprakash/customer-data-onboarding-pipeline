import argparse
import pandas as pd

from app.config_loader import load_customer_config
from app.transformer import transform_customer
from app.loader import SessionLocal, insert_customer
from app.validator import validate_customer


def run_pipeline(customer_name: str, file_path: str, progress_callback=None):

    import time
    def report_progress(step, message):
        if progress_callback:
            progress_callback(step, message)
        time.sleep(1.5)

    print("=" * 50)
    print("CUSTOMER DATA ONBOARDING")
    print("=" * 50)

    print(f"Customer: {customer_name}")
    print(f"File: {file_path}")
    print()

    # 1. Load customer configuration
    report_progress('upload', f"Loading configuration for {customer_name}...")
    config = load_customer_config(customer_name)

    print("Customer configuration loaded")

    # 2. Read customer data
    report_progress('profile', f"Profiling records from uploaded file...")
    df = pd.read_csv(file_path)

    print(f"Records received: {len(df)}")

    report_progress('schema_mapping', f"Mapping schema for {len(df)} records...")
    # 3. Validate and transform records
    valid_records = []
    rejected_records = []

    report_progress('validation', f"Validating {len(df)} customer records...")
    for index, row in df.iterrows():

        errors = validate_customer(
            row,
            config
        )

        if errors:
            rejected_records.append({
                "row": index + 2,
                "errors": errors
            })
            continue

        try:
            record = transform_customer(
                row,
                config
            )
            valid_records.append(record)
        except Exception as e:
            rejected_records.append({
                "row": index + 2,
                "errors": [{"field": "transformation", "error": str(e), "value": ""}]
            })

    print(f"Valid records: {len(valid_records)}")
    print(f"Rejected records: {len(rejected_records)}")

    # Show rejection details
    if rejected_records:
        print()
        print("Rejected records:")
        print("-" * 50)
        for rejected in rejected_records:
            print(f"Row {rejected['row']}:")
            for err in rejected["errors"]:
                print(f"  - Field '{err['field']}': {err['error']} (Value: {err['value']})")

    # 4. Load valid records into PostgreSQL
    report_progress('transformation', f"Applying transformations to valid records...")
    session = SessionLocal()

    try:
        report_progress('load', f"Loading {len(valid_records)} valid records into PostgreSQL...")
        for record in valid_records:
            insert_customer(
                session,
                record
            )
        session.commit()
        print(f"Data loaded into PostgreSQL: {len(valid_records)} records")
    except Exception as e:
        session.rollback()
        print("Database load failed")
        print(e)
        raise
    finally:
        session.close()

    print()
    print("=" * 50)
    print("ONBOARDING COMPLETE")
    print("=" * 50)

    return {
        "customer": customer_name,
        "file": file_path,
        "received": len(df),
        "valid": len(valid_records),
        "rejected": len(rejected_records),
        "rejected_details": rejected_records
    }

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--customer", required=True)
    parser.add_argument("--file", required=True)
    args = parser.parse_args()

    run_pipeline(
        args.customer,
        args.file
    )