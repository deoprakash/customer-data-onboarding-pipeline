import redis
import json

redis_client = redis.Redis(
    host="localhost",
    port=6379,
    decode_responses=True
)

QUEUE_NAME = "customer_onboarding_jobs"

def enqueue_job(job):

    redis_client.rpush(
        QUEUE_NAME,
        json.dumps(job)
    )

def get_next_job():

    result = redis_client.blpop(
        QUEUE_NAME,
        timeout=5
    )

    if result is None:
        return None

    _, job_data = result

    return json.loads(job_data)