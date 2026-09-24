from app.queue import redis_client

try:

    redis_client.ping()

    print("Redis connection successful")

except Exception as e:

    print("Redis Connection failed")
    print(e)