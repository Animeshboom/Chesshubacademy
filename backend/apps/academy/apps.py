import os
from django.apps import AppConfig


class AcademyConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'academy'

    def ready(self):
        import sys
        if 'runserver' in sys.argv and os.environ.get('RUN_MAIN') == 'true':
            try:
                from .verify_system import run_verification
                run_verification()
            except Exception as e:
                print(f"Failed to run verification: {e}")




