import os

# Set default Django settings module for 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

try:
    from celery import Celery
    app = Celery('chesshub_academy')

    # Configure Celery using settings.py options with CELERY_ prefix.
    app.config_from_object('django.conf:settings', namespace='CELERY')

    # Load task modules from all registered Django apps.
    app.autodiscover_tasks()

    @app.task(bind=True, ignore_result=True)
    def debug_task(self):
        print(f'Request: {self.request!r}')
except ImportError:
    # Fallback when Celery is not installed in the environment
    app = None
