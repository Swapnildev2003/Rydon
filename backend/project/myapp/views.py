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
from rest_framework.decorators import api_view
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




from .models import PersonalDetails, GSTDetails, DocumentsUpload, BankDetails
from .serializers import (
    PersonalDetailsSerializer,
    GSTDetailsSerializer,
    DocumentsUploadSerializer,
    BankDetailsSerializer,
)

# -------------------- PERSONAL DETAILS --------------------

@api_view(['POST'])
def create_personal_details(request):
    serializer = PersonalDetailsSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

@api_view(['GET'])
def get_personal_details(request):
    data = PersonalDetails.objects.all()
    serializer = PersonalDetailsSerializer(data, many=True)
    return Response(serializer.data)

@api_view(['PUT'])
def update_personal_details(request, pk):
    try:
        instance = PersonalDetails.objects.get(pk=pk)
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
def create_gst_details(request):
    print("Incoming data:", request.data)  
    serializer = GSTDetailsSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

@api_view(['GET'])
def get_gst_details(request):
    data = GSTDetails.objects.all()
    serializer = GSTDetailsSerializer(data, many=True)
    return Response(serializer.data)

@api_view(['PUT'])
def update_gst_details(request, pk):
    try:
        instance = GSTDetails.objects.get(pk=pk)
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
def create_documents(request):
    serializer = DocumentsUploadSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

@api_view(['GET'])
def get_documents(request):
    data = DocumentsUpload.objects.all()
    serializer = DocumentsUploadSerializer(data, many=True)
    return Response(serializer.data)

@api_view(['PUT'])
def update_documents(request, pk):
    try:
        instance = DocumentsUpload.objects.get(pk=pk)
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
def create_bank_details(request):
    serializer = BankDetailsSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

@api_view(['GET'])
def get_bank_details(request):
    data = BankDetails.objects.all()
    serializer = BankDetailsSerializer(data, many=True)
    return Response(serializer.data)

@api_view(['PUT'])
def update_bank_details(request, pk):
    try:
        instance = BankDetails.objects.get(pk=pk)
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


#-------------Driver-----------------
def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }




# ----------------------------
# CREATE a new driver (POST)
# ----------------------------
@csrf_exempt
def signup_driver(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            serializer = DriverSerializer(data=data)
            if serializer.is_valid():
                driver = serializer.save()
                return JsonResponse({
                    'message': 'Driver signed up successfully',
                    'driver_id': driver.id
                }, status=201)
            return JsonResponse(serializer.errors, status=400)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        
@csrf_exempt        
def login_driver(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            email = data.get('email')
            password = data.get('password')
            driver = Driver.objects.filter(email=email, password=password).first()
            print(driver)
            if driver:
                tokens = generate_tokens_for_user(driver, 'driver')
             
                return JsonResponse(tokens)
            else:
                return JsonResponse({'error': 'Invalid credentials'}, status=401)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        

# ----------------------------
# READ all drivers (GET)
# ----------------------------
@csrf_exempt   
def get_driver_details(request):
    if request.method == 'GET':
        drivers = Driver.objects.all()
        serializer = DriverSerializer(drivers, many=True)
        return JsonResponse({'drivers': serializer.data}, safe=False, status=200)
    
@csrf_exempt   
def get_driver_details_id(request,driver_id):
    if request.method != 'GET':
         return JsonResponse({'error': 'Only GET requests are allowed'}, status=405)
    try:
       drivers = Driver.objects.get(pk=driver_id)
       print(drivers)
       serializer = DriverSerializer(drivers)
       
       return JsonResponse({'driver': serializer.data}, safe=False, status=200)
    except Driver.DoesNotExist:
       return JsonResponse({'error': 'Driver not found'}, status=404)
    
    

# ----------------------------
# UPDATE a driver by ID (PUT)
# ----------------------------
@csrf_exempt
def update_driver(request, driver_id):
    if request.method != 'PUT':
        
        return JsonResponse({'error': 'Only PUT requests are allowed'}, status=405)

    try:
        driver = Driver.objects.get(pk=driver_id)  # Get driver by ID
    except Driver.DoesNotExist:
        return JsonResponse({'error': 'Driver not found'}, status=404)

    try:
        data = json.loads(request.body.decode('utf-8'))  # Parse incoming JSON
        serializer = DriverSerializer(driver, data=data)  # Full update
        
        if serializer.is_valid():
            updated_driver = serializer.save()
            return JsonResponse({
                'message': 'Driver updated successfully',
                'driver_id': updated_driver.id,
                'name': updated_driver.name,
                'license_number': updated_driver.license_number
            }, status=200)
        else:
            return JsonResponse(serializer.errors, status=400)

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

# ----------------------------
# DELETE a driver by ID (DELETE)
# ----------------------------
@csrf_exempt
def delete_driver(request, driver_id):
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Only DELETE requests are allowed'}, status=405)

    try:
        driver = Driver.objects.get(pk=driver_id)
        driver.delete()
        return JsonResponse({'message': 'Driver deleted successfully'}, status=200)

    except Driver.DoesNotExist:
        return JsonResponse({'error': 'Driver not found'}, status=404)

    except Exception as e:
        return JsonResponse({'error': 'Failed to delete driver', 'details': str(e)}, status=500)







# ----------------------------
# CREATE a new conductor (POST)
# ----------------------------
@csrf_exempt
def signup_conductor(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            serializer = ConductorSerializer(data=data)
            if serializer.is_valid():
                conductor = serializer.save()
                return JsonResponse({
                    'message': 'Conductor signed up successfully',
                    'conductor_id': conductor.id
                }, status=201)
            return JsonResponse(serializer.errors, status=400)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
@csrf_exempt
def login_conductor(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            email = data.get('email')
            password = data.get('password')
            conductor = Conductor.objects.filter(email=email, password=password).first()
            if conductor:
                tokens = generate_tokens_for_user(conductor, 'conductor')
                return JsonResponse(tokens)
            else:
                return JsonResponse({'error': 'Invalid credentials'}, status=401)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
# ----------------------------
# READ all conductors (GET)
# ----------------------------
def get_conductor_details(request):
    if request.method == 'GET':
        conductors = Conductor.objects.all()
        serializer = ConductorSerializer(conductors, many=True)
        return JsonResponse({'conductors': serializer.data}, safe=False, status=200)


@csrf_exempt   
def get_conductor_details_id(request,conductor_id):
    if request.method != 'GET':
         return JsonResponse({'error': 'Only GET requests are allowed'}, status=405)
    try:
       conductor = Conductor.objects.get(pk=conductor_id)
       print(conductor)
       serializer = ConductorSerializer(conductor)
       
       return JsonResponse({'conductor': serializer.data}, safe=False, status=200)
    except Driver.DoesNotExist:
       return JsonResponse({'error': 'Conductor not found'}, status=404)
# ----------------------------
# UPDATE a conductor by ID (PUT)
# ----------------------------
@csrf_exempt
def update_conductor(request, conductor_id):
    if request.method != 'PUT':
        return JsonResponse({'error': 'Only PUT requests are allowed'}, status=405)

    try:
        conductor = Conductor.objects.get(pk=conductor_id)
    except Conductor.DoesNotExist:
        return JsonResponse({'error': 'Conductor not found'}, status=404)

    try:
        data = json.loads(request.body.decode('utf-8'))
        serializer = ConductorSerializer(conductor, data=data)

        if serializer.is_valid():
            updated = serializer.save()
            return JsonResponse({
                'message': 'Conductor updated successfully',
                'conductor_id': updated.id,
                'name': updated.name,
                'contact_number': updated.contact_number
            }, status=200)
        else:
            return JsonResponse(serializer.errors, status=400)

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)


# ----------------------------
# DELETE a conductor by ID (DELETE)
# ----------------------------
@csrf_exempt
def delete_conductor(request, conductor_id):
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Only DELETE requests are allowed'}, status=405)

    try:
        conductor = Conductor.objects.get(pk=conductor_id)
        conductor.delete()
        return JsonResponse({'message': 'Conductor deleted successfully'}, status=200)

    except Conductor.DoesNotExist:
        return JsonResponse({'error': 'Conductor not found'}, status=404)

    except Exception as e:
        return JsonResponse({'error': 'Failed to delete conductor', 'details': str(e)}, status=500)



# ----------------------------
# CREATE a new bus (POST)
# ----------------------------
@csrf_exempt
def create_bus(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            # print(data)
            serializer = BusSerializer(data=data)
            
            if serializer.is_valid():
                bus = serializer.save()
                return JsonResponse({
                    'message': 'Bus created successfully',
                    'bus_id': bus.id,
                    'license_plate': bus.license_plate
                }, status=201)
            else:
                print("Serializer errors:", serializer.errors)
                return JsonResponse(serializer.errors, status=400)
        except json.JSONDecodeError:
           
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

# ----------------------------
# READ all buses (GET)
# ----------------------------
def get_bus_details(request):
    if request.method == 'GET':
        buses = Bus.objects.all()
        serializer = BusSerializer(buses, many=True)
        return JsonResponse(serializer.data, safe=False, status=200)

# ----------------------------
# UPDATE a bus by ID (PUT)
# ----------------------------
@csrf_exempt
def update_bus(request, bus_id):
    if request.method != 'PUT':
        return JsonResponse({'error': 'Only PUT requests are allowed'}, status=405)

    try:
        bus = Bus.objects.get(pk=bus_id)
    except Bus.DoesNotExist:
        return JsonResponse({'error': 'Bus not found'}, status=404)

    try:
        data = json.loads(request.body.decode('utf-8'))
        serializer = BusSerializer(bus, data=data)

        if serializer.is_valid():
            updated_bus = serializer.save()
            return JsonResponse({
                'message': 'Bus updated successfully',
                'bus_id': updated_bus.id
            }, status=200)
        else:
            return JsonResponse(serializer.errors, status=400)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

# ----------------------------
# DELETE a bus by ID (DELETE)
# ----------------------------
@csrf_exempt
def delete_bus(request, bus_id):
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Only DELETE requests are allowed'}, status=405)

    try:
        bus = Bus.objects.get(pk=bus_id)
        bus.delete()
        return JsonResponse({'message': 'Bus deleted successfully'}, status=200)
    except Bus.DoesNotExist:
        return JsonResponse({'error': 'Bus not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': 'Failed to delete bus', 'details': str(e)}, status=500)
@csrf_exempt    
def get_bus_by_driver_id(request, driver_id):
    if request.method == 'GET':
        try:
            bus = Bus.objects.get(driver__id=driver_id)
            serializer = BusSerializer(bus)
            return JsonResponse(serializer.data, safe=False, status=200)
        except ObjectDoesNotExist:
            return JsonResponse({'error': 'Bus not found for the given driver ID.'}, status=404)
        except Exception as e:
            return JsonResponse({'error': f'An unexpected error occurred: {str(e)}'}, status=500)
    else:
        return JsonResponse({'error': 'Only GET method is allowed.'}, status=405)

@csrf_exempt
def get_bus_routes(request):
    if request.method == 'GET':
        routes = list(BusRoute.objects.values())
        return JsonResponse(routes, safe=False)
    return HttpResponseNotAllowed(['GET'])

@csrf_exempt
def get_bus_route(request, pk):
    if request.method == 'GET':
        try:
            route = BusRoute.objects.get(id=pk)
            return JsonResponse({
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
            return JsonResponse({'error': 'Bus route not found'}, status=404)
    return HttpResponseNotAllowed(['GET'])

from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json

@csrf_exempt
def create_bus_route(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            serializer = BusRouteSerializer(data=data)
            
            if serializer.is_valid():
                try:
                    vehicle = Bus.objects.get(id=data['vehicle'])
                except Bus.DoesNotExist:
                    return JsonResponse({'error': 'Bus with given ID not found'}, status=404)
                
                # Create the route with validated data
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
                return JsonResponse(serialized.data, safe=False)
            else:
                return JsonResponse({'errors': serializer.errors}, status=400)
                
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON data'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def update_bus_route(request, pk):
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            route = BusRoute.objects.get(id=pk)

            # Handle vehicle ForeignKey separately
            if 'vehicle' in data:
                try:
                    vehicle_id = data.pop('vehicle')  # Remove it from dict
                    bus_instance = Bus.objects.get(id=vehicle_id)
                    route.vehicle = bus_instance
                except Bus.DoesNotExist:
                    return JsonResponse({'error': 'Bus with given ID does not exist'}, status=400)

            # Update other fields
            for key, value in data.items():
                setattr(route, key, value)

            route.save()
            return JsonResponse({'message': 'Updated successfully'})

        except BusRoute.DoesNotExist:
            return JsonResponse({'error': 'Bus route not found'}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

    return HttpResponseNotAllowed(['PUT'])


@csrf_exempt
def delete_bus_route(request, pk):
    if request.method == 'DELETE':
        try:
            route = BusRoute.objects.get(id=pk)
            route.delete()
            return JsonResponse({'message': 'Deleted successfully'})
        except BusRoute.DoesNotExist:
            return JsonResponse({'error': 'Bus route not found'}, status=404)
    return HttpResponseNotAllowed(['DELETE'])

@csrf_exempt
def create_bus_checkpoint(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            route_id = data.get('route')
            route = BusRoute.objects.get(id=route_id)
           

            checkpoint = BusCheckpoint.objects.create(
                address=data.get('address'),
                lat=data.get('lat'),
                lng=data.get('lng'),
                route=route
            )

            return JsonResponse({'message': 'Checkpoint created', 'id': checkpoint.id})

        except BusRoute.DoesNotExist:
            return JsonResponse({'error': 'Route not found'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return HttpResponseNotAllowed(['POST'])
@csrf_exempt
def list_bus_checkpoints(request):
    if request.method == 'GET':
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
        return JsonResponse(data, safe=False)
    return HttpResponseNotAllowed(['GET'])
@csrf_exempt
def get_bus_checkpoint(request, pk):
    if request.method == 'GET':
        try:
            cp = BusCheckpoint.objects.get(id=pk)
            data = {
                'id': cp.id,
                'address': cp.address,
                'lat': cp.lat,
                'lng': cp.lng,
                'route': cp.route.id
            }
            return JsonResponse(data)
        except BusCheckpoint.DoesNotExist:
            return JsonResponse({'error': 'Checkpoint not found'}, status=404)

    return HttpResponseNotAllowed(['GET'])


@csrf_exempt
def update_bus_checkpoint(request, pk):
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            cp = BusCheckpoint.objects.get(id=pk)

            if 'route' in data:
                route = BusRoute.objects.get(id=data['route'])
                cp.route = route

            cp.address = data.get('address', cp.address)
            cp.lat = data.get('lat', cp.lat)
            cp.lng = data.get('lng', cp.lng)

            cp.save()
            return JsonResponse({'message': 'Checkpoint updated'})
        except BusCheckpoint.DoesNotExist:
            return JsonResponse({'error': 'Checkpoint not found'}, status=404)
        except BusRoute.DoesNotExist:
            return JsonResponse({'error': 'Route not found'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return HttpResponseNotAllowed(['PUT'])

@csrf_exempt
def delete_bus_checkpoint(request, pk):
    if request.method == 'DELETE':
        try:
            cp = BusCheckpoint.objects.get(id=pk)
            cp.delete()
            return JsonResponse({'message': 'Checkpoint deleted'})
        except BusCheckpoint.DoesNotExist:
            return JsonResponse({'error': 'Checkpoint not found'}, status=404)

    return HttpResponseNotAllowed(['DELETE'])


@csrf_exempt
def create_car(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            serializer = CarSerializer(data=data)

            if serializer.is_valid():
                car = serializer.save()
                return JsonResponse({
                    'message': 'Car created successfully',
                    'car_id': car.id
                }, status=201)
            else:
                return JsonResponse(serializer.errors, status=400)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

def get_car_details(request):
    if request.method == 'GET':
        cars = Car.objects.all()
        serializer = CarSerializer(cars, many=True)
        return JsonResponse(serializer.data, safe=False, status=200)

@csrf_exempt
def update_car(request, car_id):
    if request.method != 'PUT':
        return JsonResponse({'error': 'Only PUT requests are allowed'}, status=405)

    try:
        car = Car.objects.get(pk=car_id)
    except Car.DoesNotExist:
        return JsonResponse({'error': 'Car not found'}, status=404)

    try:
        data = json.loads(request.body.decode('utf-8'))
        serializer = CarSerializer(car, data=data)

        if serializer.is_valid():
            updated_car = serializer.save()
            return JsonResponse({'message': 'Car updated successfully'}, status=200)
        else:
            return JsonResponse(serializer.errors, status=400)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

@csrf_exempt
def delete_car(request, car_id):
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Only DELETE requests are allowed'}, status=405)

    try:
        car = Car.objects.get(pk=car_id)
        car.delete()
        return JsonResponse({'message': 'Car deleted successfully'}, status=200)
    except Car.DoesNotExist:
        return JsonResponse({'error': 'Car not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': 'Failed to delete car', 'details': str(e)}, status=500)

@csrf_exempt
def get_car_by_driver_id(request, driver_id):
    if request.method == 'GET':
        try:
            car = Car.objects.get(driver__id=driver_id)
            serializer = CarSerializer(car)
            return JsonResponse(serializer.data, safe=False, status=200)
        except ObjectDoesNotExist:
            return JsonResponse({'error': 'Car not found for the given driver ID.'}, status=404)
        except Exception as e:
            return JsonResponse({'error': f'An unexpected error occurred: {str(e)}'}, status=500)
    else:
        return JsonResponse({'error': 'Only GET method is allowed.'}, status=405)
    
# ------------------ CAR ROUTE ------------------ #

@csrf_exempt
def create_car_route(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        try:
            car = Car.objects.get(id=data['vehicle'])
            car_route = CarRoute.objects.create(
                name=data.get('name'),
                from_location=data.get('from_location'),
                to_location=data.get('to_location'),
                start_date=data.get('start_date'),
                end_date=data.get('end_date'),
                polyline=data.get('polyline'),
                distance=data.get('distance'),
                duration=data.get('duration'),
                vehicle=car
            )
            return JsonResponse({'message': 'Car route created', 'id': car_route.id})
        except Car.DoesNotExist:
            return JsonResponse({'error': 'Car not found'}, status=400)
    return HttpResponseNotAllowed(['POST'])

@csrf_exempt
def list_car_routes(request):
    if request.method == 'GET':
        routes = CarRoute.objects.all()
        data = [{'id': r.id, 'name': r.name, 'vehicle_id': r.vehicle.id} for r in routes]
        return JsonResponse(data, safe=False)
    return HttpResponseNotAllowed(['GET'])

@csrf_exempt
def get_car_route(request, pk):
    if request.method == 'GET':
        try:
            route = CarRoute.objects.get(id=pk)
            data = {
                'id': route.id,
                'name': route.name,
                'vehicle_id': route.vehicle.id
            }
            return JsonResponse(data)
        except CarRoute.DoesNotExist:
            return JsonResponse({'error': 'Car route not found'}, status=404)
    return HttpResponseNotAllowed(['GET'])

@csrf_exempt
def update_car_route(request, pk):
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            route = CarRoute.objects.get(id=pk)
            for key, value in data.items():
                if key == "vehicle":
                    value = Car.objects.get(id=value)
                setattr(route, key, value)
            route.save()
            return JsonResponse({'message': 'Car route updated'})
        except CarRoute.DoesNotExist:
            return JsonResponse({'error': 'Car route not found'}, status=404)
    return HttpResponseNotAllowed(['PUT'])

@csrf_exempt
def delete_car_route(request, pk):
    if request.method == 'DELETE':
        try:
            route = CarRoute.objects.get(id=pk)
            route.delete()
            return JsonResponse({'message': 'Car route deleted'})
        except CarRoute.DoesNotExist:
            return JsonResponse({'error': 'Car route not found'}, status=404)
    return HttpResponseNotAllowed(['DELETE'])
@csrf_exempt
def create_bike(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            serializer = BikeSerializer(data=data)

            if serializer.is_valid():
                bike = serializer.save()
                return JsonResponse({
                    'message': 'Bike created successfully',
                    'bike_id': bike.id
                }, status=201)
            else:
                return JsonResponse(serializer.errors, status=400)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

def get_bike_details(request):
    if request.method == 'GET':
        bikes = Bike.objects.all()
        serializer = BikeSerializer(bikes, many=True)
        return JsonResponse(serializer.data, safe=False, status=200)

@csrf_exempt
def update_bike(request, bike_id):
    if request.method != 'PUT':
        return JsonResponse({'error': 'Only PUT requests are allowed'}, status=405)

    try:
        bike = Bike.objects.get(pk=bike_id)
    except Bike.DoesNotExist:
        return JsonResponse({'error': 'Bike not found'}, status=404)

    try:
        data = json.loads(request.body.decode('utf-8'))
        serializer = BikeSerializer(bike, data=data)

        if serializer.is_valid():
            updated_bike = serializer.save()
            return JsonResponse({'message': 'Bike updated successfully'}, status=200)
        else:
            return JsonResponse(serializer.errors, status=400)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

@csrf_exempt
def delete_bike(request, bike_id):
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Only DELETE requests are allowed'}, status=405)

    try:
        bike = Bike.objects.get(pk=bike_id)
        bike.delete()
        return JsonResponse({'message': 'Bike deleted successfully'}, status=200)
    except Bike.DoesNotExist:
        return JsonResponse({'error': 'Bike not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': 'Failed to delete bike', 'details': str(e)}, status=500)
@csrf_exempt
def get_bike_by_driver_id(request, driver_id):
    if request.method == 'GET':
        try:
            bike = Bike.objects.get(driver__id=driver_id)
            serializer = BikeSerializer(bike)
            return JsonResponse(serializer.data, safe=False, status=200)
        except ObjectDoesNotExist:
            return JsonResponse({'error': 'Bike not found for the given driver ID.'}, status=404)
        except Exception as e:
            return JsonResponse({'error': f'An unexpected error occurred: {str(e)}'}, status=500)
    else:
        return JsonResponse({'error': 'Only GET method is allowed.'}, status=405)
    
@csrf_exempt
def create_bike_route(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        try:
            bike = Bike.objects.get(id=data['vehicle'])
            bike_route = BikeRoute.objects.create(
                name=data.get('name'),
                from_location=data.get('from_location'),
                to_location=data.get('to_location'),
                start_date=data.get('start_date'),
                end_date=data.get('end_date'),
                polyline=data.get('polyline'),
                distance=data.get('distance'),
                duration=data.get('duration'),
                vehicle=bike
            )
            return JsonResponse({'message': 'Bike route created', 'id': bike_route.id})
        except Bike.DoesNotExist:
            return JsonResponse({'error': 'Bike not found'}, status=400)
    return HttpResponseNotAllowed(['POST'])

@csrf_exempt
def list_bike_routes(request):
    if request.method == 'GET':
        routes = BikeRoute.objects.all()
        data = [{'id': r.id, 'name': r.name, 'vehicle_id': r.vehicle.id} for r in routes]
        return JsonResponse(data, safe=False)
    return HttpResponseNotAllowed(['GET'])

@csrf_exempt
def get_bike_route(request, pk):
    if request.method == 'GET':
        try:
            route = BikeRoute.objects.get(id=pk)
            data = {
                'id': route.id,
                'name': route.name,
                'vehicle_id': route.vehicle.id
            }
            return JsonResponse(data)
        except BikeRoute.DoesNotExist:
            return JsonResponse({'error': 'Bike route not found'}, status=404)
    return HttpResponseNotAllowed(['GET'])

@csrf_exempt
def update_bike_route(request, pk):
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            route = BikeRoute.objects.get(id=pk)
            for key, value in data.items():
                if key == "vehicle":
                    value = Bike.objects.get(id=value)
                setattr(route, key, value)
            route.save()
            return JsonResponse({'message': 'Bike route updated'})
        except BikeRoute.DoesNotExist:
            return JsonResponse({'error': 'Bike route not found'}, status=404)
    return HttpResponseNotAllowed(['PUT'])

@csrf_exempt
def delete_bike_route(request, pk):
    if request.method == 'DELETE':
        try:
            route = BikeRoute.objects.get(id=pk)
            route.delete()
            return JsonResponse({'message': 'Bike route deleted'})
        except BikeRoute.DoesNotExist:
            return JsonResponse({'error': 'Bike route not found'}, status=404)
    return HttpResponseNotAllowed(['DELETE'])


from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.parsers import JSONParser
import json
from .models import BookingRequest
from .serializers import BookingRequestSerializer


@csrf_exempt

@csrf_exempt
def create_booking(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST requests are allowed'}, status=405)

    try:
        data = json.loads(request.body.decode('utf-8'))
        
        # Handle both 'driver' and 'driver_id' input for backward compatibility
        if 'driver_id' in data and 'driver' not in data:
            data['driver'] = data.pop('driver_id')
        
        # Convert driver object to ID if needed
        if isinstance(data.get('driver'), dict):
            data['driver'] = data['driver'].get('id')

        serializer = BookingRequestSerializer(data=data)
        
        if serializer.is_valid():
            booking = serializer.save()
            return JsonResponse({
                'message': 'Booking created successfully',
                'booking_id': booking.id,
                'driver': booking.driver.id,  # Changed from driver_id to driver
                'status': booking.status,
                'created_at': booking.created_at
            }, status=201)
        return JsonResponse(serializer.errors, status=400)
            
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
    
@csrf_exempt
def get_booking_requests(request):
    if request.method == 'GET':
        bookings = BookingRequest.objects.all().values()
        return JsonResponse(list(bookings), safe=False)
    else:
        return JsonResponse({'error': 'GET method required'}, status=400)
    
@csrf_exempt
def get_bookings_by_driver(request):
    if request.method == 'GET':
        driver_id = request.GET.get('driver_id')
        print(driver_id)
        if not driver_id:
            return JsonResponse({'error': 'driver_id is required as a query parameter'}, status=400)

        bookings = BookingRequest.objects.filter(driver_id=driver_id).values()
        return JsonResponse(list(bookings), safe=False)
    else:
        return JsonResponse({'error': 'Only GET method is allowed'}, status=405)