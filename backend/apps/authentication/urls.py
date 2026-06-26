from django.urls import path
from authentication.views import (
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    LogoutView,
    RegisterUserView,
    UserMeView,
    PasswordResetRequestView
)

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('register/', RegisterUserView.as_view(), name='register_user'),
    path('me/', UserMeView.as_view(), name='user_me'),
    path('reset-password/', PasswordResetRequestView.as_view(), name='password_reset'),
]
