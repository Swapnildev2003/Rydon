from django.shortcuts import render
from rest_framework_simplejwt.tokens import RefreshToken

# Create your views here.
import random
from datetime import timedelta
from twilio.rest import Client
from django.conf import settings
from django.utils import timezone
from django.contrib.auth.hashers import make_password, check_password
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from .models import PhoneOTP
from .serializers import PhoneSerializer, OTPVerifySerializer,generate_tokens_for_user

from django.contrib.auth.models import User

from django.views.decorators.csrf import csrf_exempt
from .models import Conductor
from .serializers import ConductorSerializer
from .models import*
from django.views.decorators.csrf import csrf_exempt   # ← import
from rest_framework_simplejwt.tokens import RefreshToken
import json
from django.http import JsonResponse, HttpResponseNotAllowed
from .models import Driver
from .serializers import DriverSerializer
from .serializers import BusSerializer
from .serializers import CarSerializer
from .serializers import BikeSerializer
from .serializers import BusRouteSerializer
from django.core.exceptions import ObjectDoesNotExist
from .models import PersonalDetails, GSTDetails, DocumentsUpload, BankDetails
from .serializers import (
    PersonalDetailsSerializer,
    GSTDetailsSerializer,
    DocumentsUploadSerializer,
    BankDetailsSerializer,
)


def update_driver_vehicle_info(driver_id, vehicle_type, vehicle_id):
    """
    Update driver's vehicle_type and vehicle_id when a vehicle is assigned.
    Also clears the old driver's vehicle info if vehicle is reassigned.
    """
    if not driver_id:
        return
    
    try:
        driver = Driver.objects.get(pk=driver_id)
        driver.vehicle_type = vehicle_type
        driver.vehicle_id = vehicle_id
        driver.save(update_fields=['vehicle_type', 'vehicle_id'])
    except Driver.DoesNotExist:
        pass


def clear_driver_vehicle_info(driver_id):
    """
    Clear driver's vehicle info when vehicle is unassigned.
    """
    if not driver_id:
        return
    
    try:
        driver = Driver.objects.get(pk=driver_id)
        driver.vehicle_type = None
        driver.vehicle_id = None
        driver.save(update_fields=['vehicle_type', 'vehicle_id'])
    except Driver.DoesNotExist:
        pass


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)

    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }
# Generate a 4-digit OTP


def generate_otp():
    return str(random.randint(1000, 9999))



@csrf_exempt
def get_all_otp_entries(request):
    """
    Get all OTP entries (for debugging/admin purposes only).
    SECURITY: Never expose OTP values, even if hashed.
    """
    if request.method == 'GET':
        try:
            # Get all PhoneOTP records but exclude sensitive OTP data
            otp_entries = PhoneOTP.objects.all().values(
                'id', 'phone', 'verified', 'role', 
                'expires_at', 'attempts', 'last_sent_at'
            )
            # Note: 'otp' field is intentionally excluded for security
            
            # Convert QuerySet to list for JSON serialization
            data = list(otp_entries)
            
            return JsonResponse({'otp_entries': data}, safe=False)
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Only GET method allowed'}, status=405)

# Send OTP via Twilio SMS with a DEBUG fallback (simulated send).
def send_otp_sms(phone, otp):
    sid = getattr(settings, "TWILIO_ACCOUNT_SID", None)
    token = getattr(settings, "TWILIO_AUTH_TOKEN", None)
    from_number = getattr(settings, "TWILIO_PHONE_NUMBER", None)

    if not all([sid, token, from_number]):
        if settings.DEBUG:
            # Simulate send in development so local testing works without Twilio creds.
            return "dev-simulated-sid"
        raise ValueError("Twilio credentials are not configured")

    client = Client(sid, token)
    try:
        message = client.messages.create(
            body=f"Your OTP is {otp}",
            from_=from_number,
            to=f"+91{phone}",  # change country code if needed
        )
        return message.sid
    except Exception as exc:
        if settings.DEBUG:
            # In debug we allow the flow to continue while surfacing the error text.
            return f"dev-simulated-sid-error:{exc}"
        raise



# Send OTP endpoint
@api_view(['POST'])
def send_otp(request):
    serializer = PhoneSerializer(data=request.data)
     # Use request.data instead
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
   
    phone = serializer.validated_data['phone']
    role = serializer.validated_data['role']
    otp = generate_otp()
    now = timezone.now()
    cooldown_seconds = 60
    expiry_minutes = 5

    existing = PhoneOTP.objects.filter(phone=phone, role=role).first()
    if existing and existing.last_sent_at and (now - existing.last_sent_at).total_seconds() < cooldown_seconds:
        wait = cooldown_seconds - int((now - existing.last_sent_at).total_seconds())
        return Response({"error": f"Please wait {wait}s before requesting another OTP"}, status=429)

    try:
        message_sid = send_otp_sms(phone, otp)
        PhoneOTP.objects.update_or_create(
            phone=phone,
            role=role,
            defaults={
                'otp': make_password(otp),
                'verified': False,
                'expires_at': now + timedelta(minutes=expiry_minutes),
                'attempts': 0,
                'last_sent_at': now,
            }
        )
        
        # Security: Never send OTP in API response, even in DEBUG mode
        # For local development, OTP is logged to server console only
        if settings.DEBUG:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(
                f"[DEBUG MODE] OTP for {phone} ({role}): {otp} | "
                f"Expires at: {now + timedelta(minutes=expiry_minutes)}"
            )
            # Also print to console for immediate visibility in development
            print(f"\n{'='*60}")
            print(f"[DEBUG] OTP sent to {phone} ({role})")
            print(f"OTP: {otp}")
            print(f"Expires at: {now + timedelta(minutes=expiry_minutes)}")
            print(f"{'='*60}\n")
        
        return Response({"message": "OTP sent successfully"})
    except Exception as e:
        return Response({"error": str(e)}, status=500)


# Verify OTP endpoint
@api_view(['POST'])
def verify_otp(request):
    serializer = OTPVerifySerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    phone = serializer.validated_data['phone']
    otp = serializer.validated_data['otp']
    role = serializer.validated_data['role']

    try:
        user_otp = PhoneOTP.objects.get(phone=phone, role=role)
    except PhoneOTP.DoesNotExist:
        return Response({"error": "Phone number not found for this role"}, status=404)

    now = timezone.now()
    if user_otp.expires_at and now > user_otp.expires_at:
        return Response({"error": "OTP expired"}, status=400)

    if user_otp.attempts >= 5:
        return Response({"error": "Too many attempts, please request a new OTP"}, status=429)

    if check_password(otp, user_otp.otp):
        user_otp.verified = True
        user_otp.attempts = 0
        user_otp.save(update_fields=["verified", "attempts"])

        user, created = User.objects.get_or_create(username=phone)
        tokens = get_tokens_for_user(user)

        return Response({
            "message": "OTP verified",
            "tokens": tokens,
            "role": role
        })
    
    user_otp.attempts += 1
    user_otp.save(update_fields=["attempts"])
    return Response({"error": "Invalid OTP"}, status=400)





# -------------------- PERSONAL DETAILS --------------------

@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def create_personal_details(request):
    # Check if user already has personal details
    existing = PersonalDetails.objects.filter(user=request.user).first()
    if existing:
        # Update existing record instead of creating duplicate
        serializer = PersonalDetailsSerializer(existing, data=request.data, partial=True)
    else:
        # Create new record linked to authenticated user
        serializer = PersonalDetailsSerializer(data=request.data)
    
    if serializer.is_valid():
        serializer.save(user=request.user)  # Auto-link to authenticated user
        return Response(serializer.data, status=201 if not existing else 200)
    return Response(serializer.errors, status=400)

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_personal_details(request):
    # Only return the authenticated user's personal details
    try:
        # Filter by user, handling both old (nullable) and new (required) schema
        data = PersonalDetails.objects.filter(user=request.user).first()
        if data:
            serializer = PersonalDetailsSerializer(data)
            return Response(serializer.data)
        return Response({"message": "No personal details found"}, status=404)
    except Exception as e:
        # Handle ProgrammingError if database schema doesn't match
        return Response({"error": str(e), "message": "Database migration may be required. Please run: python manage.py migrate"}, status=500)

@api_view(['PUT'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def update_personal_details(request, pk):
    try:
        # Only allow updating own records
        instance = PersonalDetails.objects.get(pk=pk, user=request.user)
    except PersonalDetails.DoesNotExist:
        return Response({"error": "Not found"}, status=404)

    serializer = PersonalDetailsSerializer(instance, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)

@api_view(['DELETE'])
def delete_personal_details(request, pk):
    try:
        instance = PersonalDetails.objects.get(pk=pk)
        instance.delete()
        return Response({"message": "Deleted successfully"}, status=204)
    except PersonalDetails.DoesNotExist:
        return Response({"error": "Not found"}, status=404)

# -------------------- GST DETAILS --------------------

@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def create_gst_details(request):
    # Check if user already has GST details
    existing = GSTDetails.objects.filter(user=request.user).first()
    if existing:
        # Update existing record instead of creating duplicate
        serializer = GSTDetailsSerializer(existing, data=request.data, partial=True)
    else:
        # Create new record linked to authenticated user
        serializer = GSTDetailsSerializer(data=request.data)
    
    if serializer.is_valid():
        serializer.save(user=request.user)  # Auto-link to authenticated user
        return Response(serializer.data, status=201 if not existing else 200)
    return Response(serializer.errors, status=400)

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_gst_details(request):
    # Only return the authenticated user's GST details
    try:
        data = GSTDetails.objects.get(user=request.user)
        serializer = GSTDetailsSerializer(data)
        return Response(serializer.data)
    except GSTDetails.DoesNotExist:
        return Response({"message": "No GST details found"}, status=404)

@api_view(['PUT'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def update_gst_details(request, pk):
    try:
        # Only allow updating own records
        instance = GSTDetails.objects.get(pk=pk, user=request.user)
    except GSTDetails.DoesNotExist:
        return Response({"error": "Not found"}, status=404)

    serializer = GSTDetailsSerializer(instance, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)

@api_view(['DELETE'])
def delete_gst_details(request, pk):
    try:
        instance = GSTDetails.objects.get(pk=pk)
        instance.delete()
        return Response({"message": "Deleted successfully"}, status=204)
    except GSTDetails.DoesNotExist:
        return Response({"error": "Not found"}, status=404)

# -------------------- DOCUMENTS UPLOAD --------------------

@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def create_documents(request):
    # Check if user already has documents
    existing = DocumentsUpload.objects.filter(user=request.user).first()
    if existing:
        # Update existing record instead of creating duplicate
        serializer = DocumentsUploadSerializer(existing, data=request.data, partial=True)
    else:
        # Create new record linked to authenticated user
        serializer = DocumentsUploadSerializer(data=request.data)
    
    if serializer.is_valid():
        serializer.save(user=request.user)  # Auto-link to authenticated user
        return Response(serializer.data, status=201 if not existing else 200)
    return Response(serializer.errors, status=400)

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_documents(request):
    # Only return the authenticated user's documents
    try:
        data = DocumentsUpload.objects.get(user=request.user)
        serializer = DocumentsUploadSerializer(data)
        return Response(serializer.data)
    except DocumentsUpload.DoesNotExist:
        return Response({"message": "No documents found"}, status=404)

@api_view(['PUT'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def update_documents(request, pk):
    try:
        # Only allow updating own records
        instance = DocumentsUpload.objects.get(pk=pk, user=request.user)
    except DocumentsUpload.DoesNotExist:
        return Response({"error": "Not found"}, status=404)

    serializer = DocumentsUploadSerializer(instance, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)

@api_view(['DELETE'])
def delete_documents(request, pk):
    try:
        instance = DocumentsUpload.objects.get(pk=pk)
        instance.delete()
        return Response({"message": "Deleted successfully"}, status=204)
    except DocumentsUpload.DoesNotExist:
        return Response({"error": "Not found"}, status=404)

# -------------------- BANK DETAILS --------------------

@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def create_bank_details(request):
    # Check if user already has bank details
    existing = BankDetails.objects.filter(user=request.user).first()
    if existing:
        # Update existing record instead of creating duplicate
        serializer = BankDetailsSerializer(existing, data=request.data, partial=True)
    else:
        # Create new record linked to authenticated user
        serializer = BankDetailsSerializer(data=request.data)
    
    if serializer.is_valid():
        serializer.save(user=request.user)  # Auto-link to authenticated user
        return Response(serializer.data, status=201 if not existing else 200)
    return Response(serializer.errors, status=400)

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def get_bank_details(request):
    # Only return the authenticated user's bank details
    try:
        data = BankDetails.objects.get(user=request.user)
        serializer = BankDetailsSerializer(data)
        return Response(serializer.data)
    except BankDetails.DoesNotExist:
        return Response({"message": "No bank details found"}, status=404)

@api_view(['PUT'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def update_bank_details(request, pk):
    try:
        # Only allow updating own records
        instance = BankDetails.objects.get(pk=pk, user=request.user)
    except BankDetails.DoesNotExist:
        return Response({"error": "Not found"}, status=404)

    serializer = BankDetailsSerializer(instance, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)

@api_view(['DELETE'])
def delete_bank_details(request, pk):
    try:
        instance = BankDetails.objects.get(pk=pk)
        instance.delete()
        return Response({"message": "Deleted successfully"}, status=204)
    except BankDetails.DoesNotExist:
        return Response({"error": "Not found"}, status=404)







# ----------------------------
# CREATE a new driver (POST)
# ----------------------------
@api_view(['POST'])
def signup_driver(request):
    serializer = DriverSerializer(data=request.data)
    if serializer.is_valid():
        driver = serializer.save()
        return Response({
            'message': 'Driver signed up successfully',
            'driver_id': driver.id
        }, status=201)
    return Response(serializer.errors, status=400)
        
@api_view(['POST'])
def login_driver(request):
    email = request.data.get('email')
    password = request.data.get('password')
    driver = Driver.objects.filter(email=email, password=password).first()
    if driver:
        tokens = generate_tokens_for_user(driver, 'driver')
        return Response(tokens)
    else:
        return Response({'error': 'Invalid credentials'}, status=401)
        

# ----------------------------
# READ all drivers (GET)
# ----------------------------
@api_view(['GET'])
def get_driver_details(request):
    drivers = Driver.objects.all()
    serializer = DriverSerializer(drivers, many=True)
    return Response({'drivers': serializer.data}, status=200)
    
@api_view(['GET'])
def get_driver_details_id(request, driver_id):
    try:
        driver = Driver.objects.get(pk=driver_id)
        serializer = DriverSerializer(driver)
        return Response({'driver': serializer.data}, status=200)
    except Driver.DoesNotExist:
        return Response({'error': 'Driver not found'}, status=404)
    
    

# ----------------------------
# UPDATE a driver by ID (PUT)
# ----------------------------
@api_view(['PUT'])
def update_driver(request, driver_id):
    try:
        driver = Driver.objects.get(pk=driver_id)
    except Driver.DoesNotExist:
        return Response({'error': 'Driver not found'}, status=404)

    serializer = DriverSerializer(driver, data=request.data)
    if serializer.is_valid():
        updated_driver = serializer.save()
        return Response({
            'message': 'Driver updated successfully',
            'driver_id': updated_driver.id,
            'name': updated_driver.name,
            'license_number': updated_driver.license_number
        }, status=200)
    return Response(serializer.errors, status=400)

# ----------------------------
# DELETE a driver by ID (DELETE)
# ----------------------------
@api_view(['DELETE'])
def delete_driver(request, driver_id):
    try:
        driver = Driver.objects.get(pk=driver_id)
        driver.delete()
        return Response({'message': 'Driver deleted successfully'}, status=200)
    except Driver.DoesNotExist:
        return Response({'error': 'Driver not found'}, status=404)
    except Exception as e:
        return Response({'error': 'Failed to delete driver', 'details': str(e)}, status=500)







# ----------------------------
# CREATE a new conductor (POST)
# ----------------------------
@api_view(['POST'])
def signup_conductor(request):
    serializer = ConductorSerializer(data=request.data)
    if serializer.is_valid():
        conductor = serializer.save()
        return Response({
            'message': 'Conductor signed up successfully',
            'conductor_id': conductor.id
        }, status=201)
    return Response(serializer.errors, status=400)

@api_view(['POST'])
def login_conductor(request):
    email = request.data.get('email')
    password = request.data.get('password')
    conductor = Conductor.objects.filter(email=email, password=password).first()
    if conductor:
        tokens = generate_tokens_for_user(conductor, 'conductor')
        return Response(tokens)
    else:
        return Response({'error': 'Invalid credentials'}, status=401)

# ----------------------------
# READ all conductors (GET)
# ----------------------------
@api_view(['GET'])
def get_conductor_details(request):
    conductors = Conductor.objects.all()
    serializer = ConductorSerializer(conductors, many=True)
    return Response({'conductors': serializer.data}, status=200)


@api_view(['GET'])
def get_conductor_details_id(request, conductor_id):
    try:
        conductor = Conductor.objects.get(pk=conductor_id)
        serializer = ConductorSerializer(conductor)
        return Response({'conductor': serializer.data}, status=200)
    except Conductor.DoesNotExist:
        return Response({'error': 'Conductor not found'}, status=404)
# ----------------------------
# UPDATE a conductor by ID (PUT)
# ----------------------------
@api_view(['PUT'])
def update_conductor(request, conductor_id):
    try:
        conductor = Conductor.objects.get(pk=conductor_id)
    except Conductor.DoesNotExist:
        return Response({'error': 'Conductor not found'}, status=404)

    serializer = ConductorSerializer(conductor, data=request.data)
    if serializer.is_valid():
        updated = serializer.save()
        return Response({
            'message': 'Conductor updated successfully',
            'conductor_id': updated.id,
            'name': updated.name,
            'contact_number': updated.contact_number
        }, status=200)
    return Response(serializer.errors, status=400)


# ----------------------------
# DELETE a conductor by ID (DELETE)
# ----------------------------
@api_view(['DELETE'])
def delete_conductor(request, conductor_id):
    try:
        conductor = Conductor.objects.get(pk=conductor_id)
        conductor.delete()
        return Response({'message': 'Conductor deleted successfully'}, status=200)
    except Conductor.DoesNotExist:
        return Response({'error': 'Conductor not found'}, status=404)
    except Exception as e:
        return Response({'error': 'Failed to delete conductor', 'details': str(e)}, status=500)



# ----------------------------
# CREATE a new bus (POST)
# ----------------------------
@api_view(['POST'])
def create_bus(request):
    serializer = BusSerializer(data=request.data)
    if serializer.is_valid():
        bus = serializer.save()
        # Update driver's vehicle info if driver is assigned
        if bus.driver_id:
            update_driver_vehicle_info(bus.driver_id, 'bus', bus.id)
        return Response({
            'message': 'Bus created successfully',
            'bus_id': bus.id,
            'license_plate': bus.license_plate
        }, status=201)
    return Response(serializer.errors, status=400)

# ----------------------------
# READ all buses (GET)
# ----------------------------
@api_view(['GET'])
def get_bus_details(request):
    buses = Bus.objects.all()
    serializer = BusSerializer(buses, many=True)
    return Response(serializer.data, status=200)

# ----------------------------
# UPDATE a bus by ID (PUT)
# ----------------------------
@api_view(['PUT'])
def update_bus(request, bus_id):
    try:
        bus = Bus.objects.get(pk=bus_id)
    except Bus.DoesNotExist:
        return Response({'error': 'Bus not found'}, status=404)

    old_driver_id = bus.driver_id  # Save old driver before update
    serializer = BusSerializer(bus, data=request.data)
    if serializer.is_valid():
        updated_bus = serializer.save()
        # Handle driver change
        new_driver_id = updated_bus.driver_id
        if old_driver_id != new_driver_id:
            if old_driver_id:
                clear_driver_vehicle_info(old_driver_id)
            if new_driver_id:
                update_driver_vehicle_info(new_driver_id, 'bus', updated_bus.id)
        return Response({
            'message': 'Bus updated successfully',
            'bus_id': updated_bus.id
        }, status=200)
    return Response(serializer.errors, status=400)

# ----------------------------
# DELETE a bus by ID (DELETE)
# ----------------------------
@api_view(['DELETE'])
def delete_bus(request, bus_id):
    try:
        bus = Bus.objects.get(pk=bus_id)
        bus.delete()
        return Response({'message': 'Bus deleted successfully'}, status=200)
    except Bus.DoesNotExist:
        return Response({'error': 'Bus not found'}, status=404)
    except Exception as e:
        return Response({'error': 'Failed to delete bus', 'details': str(e)}, status=500)

@api_view(['GET'])
def get_bus_by_driver_id(request, driver_id):
    try:
        bus = Bus.objects.get(driver__id=driver_id)
        serializer = BusSerializer(bus)
        return Response(serializer.data, status=200)
    except ObjectDoesNotExist:
        return Response({'error': 'Bus not found for the given driver ID.'}, status=404)
    except Exception as e:
        return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=500)

@api_view(['GET'])
def get_bus_routes(request):
    routes = list(BusRoute.objects.values())
    return Response(routes)

@api_view(['GET'])
def get_bus_route(request, pk):
    try:
        route = BusRoute.objects.get(id=pk)
        return Response({
            'id': route.id,
            'name': route.name,
            'from_location': route.from_location,
            'to_location': route.to_location,
            'start_date': str(route.start_date),
            'end_date': str(route.end_date),
            'polyline': route.polyline,
            'distance': route.distance,
            'duration': route.duration,
            'vehicle_id': route.vehicle_id
        })
    except BusRoute.DoesNotExist:
        return Response({'error': 'Bus route not found'}, status=404)


@api_view(['POST'])
def create_bus_route(request):
    serializer = BusRouteSerializer(data=request.data)
    if serializer.is_valid():
        try:
            vehicle = Bus.objects.get(id=request.data['vehicle'])
        except Bus.DoesNotExist:
            return Response({'error': 'Bus with given ID not found'}, status=404)
        route = BusRoute.objects.create(
            name=serializer.validated_data['name'],
            from_location=serializer.validated_data['from_location'],
            to_location=serializer.validated_data['to_location'],
            start_date=serializer.validated_data.get('start_date'),
            end_date=serializer.validated_data.get('end_date'),
            polyline=serializer.validated_data.get('polyline', ''),
            distance=serializer.validated_data.get('distance', ''),
            duration=serializer.validated_data.get('duration', ''),
            vehicle=vehicle
        )
        serialized = BusRouteSerializer(route)
        return Response(serialized.data, status=201)
    return Response({'errors': serializer.errors}, status=400)

@api_view(['PUT'])
def update_bus_route(request, pk):
    try:
        route = BusRoute.objects.get(id=pk)
    except BusRoute.DoesNotExist:
        return Response({'error': 'Bus route not found'}, status=404)
    
    data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
    if 'vehicle' in data:
        try:
            vehicle_id = data.pop('vehicle')
            bus_instance = Bus.objects.get(id=vehicle_id)
            route.vehicle = bus_instance
        except Bus.DoesNotExist:
            return Response({'error': 'Bus with given ID does not exist'}, status=400)
    for key, value in data.items():
        setattr(route, key, value)
    route.save()
    return Response({'message': 'Updated successfully'})

@api_view(['DELETE'])
def delete_bus_route(request, pk):
    try:
        route = BusRoute.objects.get(id=pk)
        route.delete()
        return Response({'message': 'Deleted successfully'})
    except BusRoute.DoesNotExist:
        return Response({'error': 'Bus route not found'}, status=404)

@api_view(['POST'])
def create_bus_checkpoint(request):
    try:
        route_id = request.data.get('route')
        route = BusRoute.objects.get(id=route_id)
        checkpoint = BusCheckpoint.objects.create(
            address=request.data.get('address'),
            lat=request.data.get('lat'),
            lng=request.data.get('lng'),
            route=route
        )
        return Response({'message': 'Checkpoint created', 'id': checkpoint.id}, status=201)
    except BusRoute.DoesNotExist:
        return Response({'error': 'Route not found'}, status=400)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
def list_bus_checkpoints(request):
    checkpoints = BusCheckpoint.objects.all()
    data = [
        {
            'id': cp.id,
            'address': cp.address,
            'lat': cp.lat,
            'lng': cp.lng,
            'route': cp.route.id
        } for cp in checkpoints
    ]
    return Response(data)

@api_view(['GET'])
def get_bus_checkpoint(request, pk):
    try:
        cp = BusCheckpoint.objects.get(id=pk)
        data = {
            'id': cp.id,
            'address': cp.address,
            'lat': cp.lat,
            'lng': cp.lng,
            'route': cp.route.id
        }
        return Response(data)
    except BusCheckpoint.DoesNotExist:
        return Response({'error': 'Checkpoint not found'}, status=404)

@api_view(['PUT'])
def update_bus_checkpoint(request, pk):
    try:
        cp = BusCheckpoint.objects.get(id=pk)
        if 'route' in request.data:
            route = BusRoute.objects.get(id=request.data['route'])
            cp.route = route
        cp.address = request.data.get('address', cp.address)
        cp.lat = request.data.get('lat', cp.lat)
        cp.lng = request.data.get('lng', cp.lng)
        cp.save()
        return Response({'message': 'Checkpoint updated'})
    except BusCheckpoint.DoesNotExist:
        return Response({'error': 'Checkpoint not found'}, status=404)
    except BusRoute.DoesNotExist:
        return Response({'error': 'Route not found'}, status=400)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['DELETE'])
def delete_bus_checkpoint(request, pk):
    try:
        cp = BusCheckpoint.objects.get(id=pk)
        cp.delete()
        return Response({'message': 'Checkpoint deleted'})
    except BusCheckpoint.DoesNotExist:
        return Response({'error': 'Checkpoint not found'}, status=404)


@api_view(['POST'])
def create_car(request):
    serializer = CarSerializer(data=request.data)
    if serializer.is_valid():
        car = serializer.save()
        if car.driver_id:
            update_driver_vehicle_info(car.driver_id, 'car', car.id)
        return Response({
            'message': 'Car created successfully',
            'car_id': car.id
        }, status=201)
    return Response(serializer.errors, status=400)

@api_view(['GET'])
def get_car_details(request):
    cars = Car.objects.all()
    serializer = CarSerializer(cars, many=True)
    return Response(serializer.data, status=200)

@api_view(['PUT'])
def update_car(request, car_id):
    try:
        car = Car.objects.get(pk=car_id)
    except Car.DoesNotExist:
        return Response({'error': 'Car not found'}, status=404)

    old_driver_id = car.driver_id
    serializer = CarSerializer(car, data=request.data)
    if serializer.is_valid():
        updated_car = serializer.save()
        new_driver_id = updated_car.driver_id
        if old_driver_id != new_driver_id:
            if old_driver_id:
                clear_driver_vehicle_info(old_driver_id)
            if new_driver_id:
                update_driver_vehicle_info(new_driver_id, 'car', updated_car.id)
        return Response({'message': 'Car updated successfully'}, status=200)
    return Response(serializer.errors, status=400)

@api_view(['DELETE'])
def delete_car(request, car_id):
    try:
        car = Car.objects.get(pk=car_id)
        car.delete()
        return Response({'message': 'Car deleted successfully'}, status=200)
    except Car.DoesNotExist:
        return Response({'error': 'Car not found'}, status=404)
    except Exception as e:
        return Response({'error': 'Failed to delete car', 'details': str(e)}, status=500)

@api_view(['GET'])
def get_car_by_driver_id(request, driver_id):
    try:
        car = Car.objects.get(driver__id=driver_id)
        serializer = CarSerializer(car)
        return Response(serializer.data, status=200)
    except ObjectDoesNotExist:
        return Response({'error': 'Car not found for the given driver ID.'}, status=404)
    except Exception as e:
        return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=500)
    
# ------------------ CAR ROUTE ------------------ #

@api_view(['POST'])
def create_car_route(request):
    try:
        car = Car.objects.get(id=request.data['vehicle'])
        car_route = CarRoute.objects.create(
            name=request.data.get('name'),
            from_location=request.data.get('from_location'),
            to_location=request.data.get('to_location'),
            start_date=request.data.get('start_date'),
            end_date=request.data.get('end_date'),
            polyline=request.data.get('polyline'),
            distance=request.data.get('distance'),
            duration=request.data.get('duration'),
            vehicle=car
        )
        return Response({'message': 'Car route created', 'id': car_route.id}, status=201)
    except Car.DoesNotExist:
        return Response({'error': 'Car not found'}, status=400)

@api_view(['GET'])
def list_car_routes(request):
    routes = CarRoute.objects.all()
    data = [{'id': r.id, 'name': r.name, 'vehicle_id': r.vehicle.id} for r in routes]
    return Response(data)

@api_view(['GET'])
def get_car_route(request, pk):
    try:
        route = CarRoute.objects.get(id=pk)
        data = {
            'id': route.id,
            'name': route.name,
            'vehicle_id': route.vehicle.id
        }
        return Response(data)
    except CarRoute.DoesNotExist:
        return Response({'error': 'Car route not found'}, status=404)

@api_view(['PUT'])
def update_car_route(request, pk):
    try:
        route = CarRoute.objects.get(id=pk)
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        for key, value in data.items():
            if key == "vehicle":
                value = Car.objects.get(id=value)
            setattr(route, key, value)
        route.save()
        return Response({'message': 'Car route updated'})
    except CarRoute.DoesNotExist:
        return Response({'error': 'Car route not found'}, status=404)

@api_view(['DELETE'])
def delete_car_route(request, pk):
    try:
        route = CarRoute.objects.get(id=pk)
        route.delete()
        return Response({'message': 'Car route deleted'})
    except CarRoute.DoesNotExist:
        return Response({'error': 'Car route not found'}, status=404)
@api_view(['POST'])
def create_bike(request):
    serializer = BikeSerializer(data=request.data)
    if serializer.is_valid():
        bike = serializer.save()
        if bike.driver_id:
            update_driver_vehicle_info(bike.driver_id, 'bike', bike.id)
        return Response({
            'message': 'Bike created successfully',
            'bike_id': bike.id
        }, status=201)
    return Response(serializer.errors, status=400)

@api_view(['GET'])
def get_bike_details(request):
    bikes = Bike.objects.all()
    serializer = BikeSerializer(bikes, many=True)
    return Response(serializer.data, status=200)

@api_view(['PUT'])
def update_bike(request, bike_id):
    try:
        bike = Bike.objects.get(pk=bike_id)
    except Bike.DoesNotExist:
        return Response({'error': 'Bike not found'}, status=404)

    old_driver_id = bike.driver_id
    serializer = BikeSerializer(bike, data=request.data)
    if serializer.is_valid():
        updated_bike = serializer.save()
        new_driver_id = updated_bike.driver_id
        if old_driver_id != new_driver_id:
            if old_driver_id:
                clear_driver_vehicle_info(old_driver_id)
            if new_driver_id:
                update_driver_vehicle_info(new_driver_id, 'bike', updated_bike.id)
        return Response({'message': 'Bike updated successfully'}, status=200)
    return Response(serializer.errors, status=400)

@api_view(['DELETE'])
def delete_bike(request, bike_id):
    try:
        bike = Bike.objects.get(pk=bike_id)
        bike.delete()
        return Response({'message': 'Bike deleted successfully'}, status=200)
    except Bike.DoesNotExist:
        return Response({'error': 'Bike not found'}, status=404)
    except Exception as e:
        return Response({'error': 'Failed to delete bike', 'details': str(e)}, status=500)

@api_view(['GET'])
def get_bike_by_driver_id(request, driver_id):
    try:
        bike = Bike.objects.get(driver__id=driver_id)
        serializer = BikeSerializer(bike)
        return Response(serializer.data, status=200)
    except ObjectDoesNotExist:
        return Response({'error': 'Bike not found for the given driver ID.'}, status=404)
    except Exception as e:
        return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=500)

@api_view(['POST'])
def create_bike_route(request):
    try:
        bike = Bike.objects.get(id=request.data['vehicle'])
        bike_route = BikeRoute.objects.create(
            name=request.data.get('name'),
            from_location=request.data.get('from_location'),
            to_location=request.data.get('to_location'),
            start_date=request.data.get('start_date'),
            end_date=request.data.get('end_date'),
            polyline=request.data.get('polyline'),
            distance=request.data.get('distance'),
            duration=request.data.get('duration'),
            vehicle=bike
        )
        return Response({'message': 'Bike route created', 'id': bike_route.id}, status=201)
    except Bike.DoesNotExist:
        return Response({'error': 'Bike not found'}, status=400)

@api_view(['GET'])
def list_bike_routes(request):
    routes = BikeRoute.objects.all()
    data = [{'id': r.id, 'name': r.name, 'vehicle_id': r.vehicle.id} for r in routes]
    return Response(data)

@api_view(['GET'])
def get_bike_route(request, pk):
    try:
        route = BikeRoute.objects.get(id=pk)
        data = {
            'id': route.id,
            'name': route.name,
            'vehicle_id': route.vehicle.id
        }
        return Response(data)
    except BikeRoute.DoesNotExist:
        return Response({'error': 'Bike route not found'}, status=404)

@api_view(['PUT'])
def update_bike_route(request, pk):
    try:
        route = BikeRoute.objects.get(id=pk)
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        for key, value in data.items():
            if key == "vehicle":
                value = Bike.objects.get(id=value)
            setattr(route, key, value)
        route.save()
        return Response({'message': 'Bike route updated'})
    except BikeRoute.DoesNotExist:
        return Response({'error': 'Bike route not found'}, status=404)

@api_view(['DELETE'])
def delete_bike_route(request, pk):
    try:
        route = BikeRoute.objects.get(id=pk)
        route.delete()
        return Response({'message': 'Bike route deleted'})
    except BikeRoute.DoesNotExist:
        return Response({'error': 'Bike route not found'}, status=404)



from .models import BookingRequest
from .serializers import BookingRequestSerializer


@api_view(['POST'])
def create_booking(request):
    try:
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        
        # Handle 'driver' key → rename to 'drivers' to match model field
        if 'driver' in data and 'drivers' not in data:
            data['drivers'] = data.pop('driver')

        serializer = BookingRequestSerializer(data=data)
        
        if serializer.is_valid():
            booking = serializer.save()
            return Response({
                'message': 'Booking created successfully',
                'booking_id': booking.id,
                'drivers': booking.drivers.id,
                'status': booking.status,
                'created_at': booking.created_at
            }, status=201)
        return Response(serializer.errors, status=400)
            
    except Exception as e:
        return Response({'error': str(e)}, status=500)
    
    
@api_view(['GET'])
def get_booking_requests(request):
    bookings = BookingRequest.objects.all().values()
    return Response(list(bookings))
    
@api_view(['GET'])
def get_bookings_by_driver(request):
    driver_id = request.GET.get('driver_id')
    if not driver_id:
        return Response({'error': 'driver_id is required as a query parameter'}, status=400)

    bookings = BookingRequest.objects.filter(drivers_id=driver_id).values()
    return Response(list(bookings))

@api_view(['POST'])
def update_booking_status(request, booking_id):
    try:
        status = request.data.get('status')
        vehicle_type = request.data.get('vehicle_type', '').lower()
        
        if status not in ['accepted', 'rejected']:
            return Response({'error': 'Invalid status. Choose accepted or rejected'}, status=400)
        
        booking = BookingRequest.objects.get(id=booking_id)
        
        # If trying to accept, check if user already has an accepted booking
        if status == 'accepted':
            # Check if this user already has an accepted booking with another driver
            existing_accepted = BookingRequest.objects.filter(
                user=booking.user,
                status='accepted'
            ).exclude(id=booking_id).first() #or use .exist
            
            if existing_accepted:
                return Response({
                    'error': 'This user already has an active ride with another driver.',
                    # 'existing_booking_id': existing_accepted.id,
                    # 'existing_driver_id': existing_accepted.driver.id
                }, status=400)
        
        booking.status = status
        booking.save()
        
        if status == 'accepted':
            driver = booking.drivers
            from .models import Bus, Car, Bike
            
            vehicle_model = None
            if vehicle_type == 'bus':
                vehicle_model = Bus
            elif vehicle_type == 'car':
                vehicle_model = Car
            elif vehicle_type == 'bike':
                vehicle_model = Bike
            
            if vehicle_model:
                vehicle = vehicle_model.objects.filter(driver=driver).first()
                if vehicle:
                    vehicle.is_booked = True
                    vehicle.save()
                    return Response({'message': f'Booking accepted and {vehicle_type} marked as booked'}, status=200)
                else:
                    return Response({'error': f'No {vehicle_type} found for this driver'}, status=404)
            else:
                found = False
                for model, name in [(Bus, 'bus'), (Car, 'car'), (Bike, 'bike')]:
                    vehicle = model.objects.filter(driver=driver).first()
                    if vehicle:
                        vehicle.is_booked = True
                        vehicle.save()
                        found = True
                        return Response({'message': f'Booking accepted and {name} marked as booked (auto-detected)'}, status=200)
                
                if not found:
                    return Response({'message': 'Booking accepted but no vehicle found for driver'}, status=200)
        
        return Response({'message': 'Booking rejected'}, status=200)
        
    except BookingRequest.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)