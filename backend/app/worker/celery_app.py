import os
from celery import Celery
from celery.schedules import crontab

# Fetch the Redis URLs from the environment variables Docker passed in
broker_url = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0")
result_backend = os.environ.get("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")

# Initialize the Celery application
celery_app = Celery(
    "kerdion_worker",
    broker=broker_url,
    backend=result_backend
)

# Standard production settings
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    # This tells Celery where to look for tasks later on
    include=["app.worker.tasks"],
    # Scheduled background tasks
    beat_schedule={
        "predict-every-15-min": {
            "task": "app.worker.tasks.fetch_data_and_predict_task",
            "schedule": 900.0,  # Every 15 minutes (in seconds)
        },
        "rolling-dm-test-daily": {
            "task": "app.worker.tasks.compute_rolling_dm_test",
            "schedule": crontab(hour=3, minute=0),  # Runs every day at 03:00 UTC
        },
    },
)