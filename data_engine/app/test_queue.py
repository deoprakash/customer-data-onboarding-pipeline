from app.queue import enqueue_job

job = {
    "job_id": "job-002",
    "customer": "acme",
    "file": "../sample-data/acme/customers.csv"
}

enqueue_job(job)

print("Job added to queue")