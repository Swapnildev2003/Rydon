from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from .models import Driver, Conductor


class DriverJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that looks up Driver instead of Django User.
    
    Normal flow (broken):
        Token has user_id=1 → SimpleJWT looks in auth_user table → Not found → 401
    
    Custom flow (fixed):
        Token has user_id=1 → We look in Driver table → Found! → ✅
    """

    def get_user(self, validated_token):
        try:
            user_id = validated_token["user_id"]
            role = validated_token.get("role", "driver")

            if role == "conductor":
                return Conductor.objects.get(id=user_id)
            else:
                return Driver.objects.get(id=user_id)

        except (Driver.DoesNotExist, Conductor.DoesNotExist):
            raise InvalidToken("User not found")
