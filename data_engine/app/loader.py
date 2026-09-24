import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


def insert_customer(session, customer):

    query = text("""
        INSERT INTO customers (
            customer_id,
            first_name,
            last_name,
            email,
            phone,
            created_at
        )
        VALUES (
            :customer_id,
            :first_name,
            :last_name,
            :email,
            :phone,
            :created_at
        )
        ON CONFLICT (customer_id)
        DO UPDATE SET
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            email = EXCLUDED.email,
            phone = EXCLUDED.phone,
            created_at = EXCLUDED.created_at
    """)

    session.execute(
        query,
        customer
    )