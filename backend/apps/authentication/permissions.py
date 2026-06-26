from rest_framework import permissions


class IsAcademyManager(permissions.BasePermission):
    """
    Allows access only to Academy Managers.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'manager'
        )


class IsCoach(permissions.BasePermission):
    """
    Allows access only to Coaches.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'coach'
        )


class IsStudent(permissions.BasePermission):
    """
    Allows access only to Students.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'student'
        )


class IsManagerOrCoach(permissions.BasePermission):
    """
    Allows access to either Academy Managers or Coaches.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['manager', 'coach']
        )

