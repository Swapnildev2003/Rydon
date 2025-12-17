from rest_framework import serializers
from .models import *
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils.dateparse import parse_date
from .constants import get_role_choices

class PhoneSerializer(serializers.Serializer):
    phone = serializers.RegexField(regex=r"^\d{10}$", max_length=15)
    role = serializers.ChoiceField(choices=get_role_choices())

class OTPVerifySerializer(serializers.Serializer):
    phone = serializers.RegexField(regex=r"^\d{10}$", max_length=15)
    otp = serializers.CharField(max_length=6)
    role = serializers.ChoiceField(choices=get_role_choices())

    
class PersonalDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PersonalDetails
        fields = ['full_name', 'email', 'phone_number', 'address']  # Exclude user field

class GSTDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = GSTDetails
        fields = ['gst_number', 'gst_certificate_url']  # Exclude user field

class DocumentsUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentsUpload
        fields = ['pan_card_url', 'aadhaar_card_url', 'supporting_documents_urls']  # Exclude user field

class BankDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankDetails
        fields = ['bank_name', 'branch_name', 'account_number', 'ifsc_code']  # Exclude user field
        
class DriverSerializer(serializers.ModelSerializer):
    class Meta:
        model = Driver
        fields = '__all__'    
        
class ConductorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conductor
        fields = '__all__'
        
        
        
class BusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bus
        fields = '__all__'

class CarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Car
        fields = '__all__'

class BikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bike
        fields = '__all__'
        
class BusRouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusRoute
        fields = '__all__'

    def validate_start_date(self, value):
        if isinstance(value, str):
            try:
                return parse_date(value)
            except (ValueError, TypeError):
                raise serializers.ValidationError("Date must be in YYYY-MM-DD format")
        return value

    def validate_end_date(self, value):
        if isinstance(value, str):
            try:
                return parse_date(value)
            except (ValueError, TypeError):
                raise serializers.ValidationError("Date must be in YYYY-MM-DD format")
        return value

class BookingRequestSerializer(serializers.ModelSerializer):
    driver = serializers.PrimaryKeyRelatedField(queryset=Driver.objects.all())
    user = serializers.PrimaryKeyRelatedField(queryset=PhoneOTP.objects.all())

    class Meta:
        model = BookingRequest
        fields = ['id', 'user', 'driver', 'from_address', 'to_address', 'status', 'created_at']
        read_only_fields = ['status', 'created_at']
# class DriverResponseSerializer(serializers.Serializer):
#     request_id = serializers.IntegerField()
#     status = serializers.ChoiceField(choices=['accepted', 'rejected'])
    
#     def validate_request_id(self, value):
#         try:
#             BookingRequest.objects.get(id=value)
#         except BookingRequest.DoesNotExist:
#             raise serializers.ValidationError("Invalid booking request ID")
#         return value

class CarRouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarRoute
        fields = '__all__'

class BikeRouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = BikeRoute
        fields = '__all__'
        
class BusCheckpointSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusCheckpoint
        fields = '__all__'
        
class CarRouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarRoute
        fields = '__all__'

class BikeRouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = BikeRoute
        fields = '__all__'
        
def generate_tokens_for_user(user, role):
    refresh = RefreshToken.for_user(user)  # Generate JWT tokens
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
         f'{role}_id': user.id,
        'role': role,
        'name': user.name,
    }