from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings

class JWTCookieAuthentication(JWTAuthentication):
    """
    Custom JWT Authentication class that falls back to reading the access token
    from cookies if it is not present in the Authorization header.
    """
    def authenticate(self, request):
        header = self.get_header(request)
        
        raw_token = None
        if header is None:
            # Read access token from HttpOnly cookies
            raw_token = request.COOKIES.get('access_token')
        else:
            raw_token = self.get_raw_token(header)
            
        if raw_token is None:
            return None
            
        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token
