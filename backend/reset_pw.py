import os, django
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

print("=== ALL USERS ===")
for u in User.objects.all():
    print(f"  {u.email} | role={u.role} | active={u.is_active}")

# Reset password for manager
try:
    mgr = User.objects.get(email='manager@chesshubacademy.online')
    mgr.set_password('ChessHub2026!')
    mgr.is_active = True
    mgr.save()
    print(f"\n✅ Password reset for {mgr.email} -> ChessHub2026!")
except User.DoesNotExist:
    print("\n❌ manager@chesshubacademy.online not found")

# Also reset coach
try:
    coach = User.objects.get(email='coach@chesshubacademy.online')
    coach.set_password('ChessHub2026!')
    coach.is_active = True
    coach.save()
    print(f"✅ Password reset for {coach.email} -> ChessHub2026!")
except User.DoesNotExist:
    print("❌ coach@chesshubacademy.online not found")

# Also reset student
try:
    student = User.objects.get(email='student@chesshubacademy.online')
    student.set_password('ChessHub2026!')
    student.is_active = True
    student.save()
    print(f"✅ Password reset for {student.email} -> ChessHub2026!")
except User.DoesNotExist:
    print("❌ student@chesshubacademy.online not found")
