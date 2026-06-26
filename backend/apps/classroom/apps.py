from django.apps import AppConfig


class ClassroomConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'classroom'

    def ready(self):
        import sys
        if 'runserver' in sys.argv:
            try:
                from django.core.management import call_command
                call_command('migrate', 'classroom', interactive=False)
                print("Classroom migrations applied successfully.")
            except Exception as e:
                print(f"Error applying classroom migrations: {e}")
