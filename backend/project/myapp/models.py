from django.db import models
# from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.contrib.auth.hashers import make_password, check_password
from .constants import ROLE_CHOICES

class PhoneOTP(models.Model):
    phone = models.CharField(max_length=15)
    # Store a hashed OTP to avoid keeping raw codes at rest.
    otp = models.CharField(max_length=128)
    verified = models.BooleanField(default=False)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="user")
    expires_at = models.DateTimeField(null=True, blank=True)
    attempts = models.PositiveIntegerField(default=0)
    last_sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Phone OTP"
        verbose_name_plural = "Phone OTPs"
        unique_together = [['phone', 'role']]  # Same phone can have different OTPs for different roles

    def __str__(self):
        return f"{self.phone} - {self.role} - Verified: {self.verified}"


class PersonalDetails(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='personal_details')
    full_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone_number = models.CharField(max_length=15)
    address = models.TextField()

    class Meta:
        verbose_name = "Personal Detail"
        verbose_name_plural = "Personal Details"
        unique_together = [['user']]  # One record per user
        indexes = [
            models.Index(fields=['user']),  # Index for faster queries
        ]

    def __str__(self):
        return f"{self.full_name}"

class GSTDetails(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='gst_details')
    gst_number = models.CharField(max_length=20)
    gst_certificate_url = models.URLField()

    class Meta:
        verbose_name = "GST Detail"
        verbose_name_plural = "GST Details"
        unique_together = [['user']]  # One record per user
        indexes = [
            models.Index(fields=['user']),  # Index for faster queries
        ]

    def __str__(self):
        return f"{self.gst_number}"

class DocumentsUpload(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents')
    pan_card_url = models.URLField()
    aadhaar_card_url = models.URLField()
    supporting_documents_urls = models.URLField(blank=True, null=True)

    class Meta:
        verbose_name = "Document Upload"
        verbose_name_plural = "Document Uploads"
        unique_together = [['user']]  # One record per user
        indexes = [
            models.Index(fields=['user']),  # Index for faster queries
        ]

    def __str__(self):
        return f"{self.pan_card_url}"

class BankDetails(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bank_details')
    bank_name = models.CharField(max_length=100)
    branch_name = models.CharField(max_length=100)
    account_number = models.CharField(max_length=20)
    ifsc_code = models.CharField(max_length=15)

    class Meta:
        verbose_name = "Bank Detail"
        verbose_name_plural = "Bank Details"
        unique_together = [['user']]  # One record per user
        indexes = [
            models.Index(fields=['user']),  # Index for faster queries
        ]

    def __str__(self):
        return f"{self.bank_name}"
    

#-------------operator-dasboard-----------------

class Driver(models.Model):
   
    
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    contact_number = models.CharField(max_length=15)
    license_number = models.CharField(max_length=50)
    joining_date = models.DateField()
    
    # Assigned vehicle info (updated when vehicle is assigned)
    vehicle_type = models.CharField(
        max_length=10, 
        null=True, 
        blank=True,
        choices=[('bus', 'Bus'), ('car', 'Car'), ('bike', 'Bike')]
    )
    vehicle_id = models.PositiveIntegerField(null=True, blank=True)

   
    
    class Meta:
        verbose_name = "Driver"
        verbose_name_plural = "Drivers"
    
    def __str__(self):
        return f"{self.name} ({self.license_number})"

class Conductor(models.Model):
  
   
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    contact_number = models.CharField(max_length=15)
    joining_date = models.DateField()
  
    
    class Meta:
        verbose_name = "Conductor"
        verbose_name_plural = "Conductors"
    
    def __str__(self):
        return f"{self.name} "

class Vehicle(models.Model):
   
    
    
    license_plate = models.CharField(max_length=20, unique=True)
    registration_number = models.CharField(max_length=50, unique=True)
    vehicle_type = models.CharField(max_length=10)
    fuel_type = models.CharField(max_length=10)
    model_year = models.PositiveIntegerField()
    initial_status = models.CharField(max_length=12, default='Active')
    is_booked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True
        verbose_name = "Vehicle"
        verbose_name_plural = "Vehicles"

    def __str__(self):
        return f"{self.vehicle_type} ({self.license_plate})"

class AbstractRoute(models.Model):
    name = models.CharField(max_length=100)
    from_location = models.CharField(max_length=255)
    to_location = models.CharField(max_length=255)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    polyline = models.TextField(blank=True, null=True)
    distance = models.CharField(max_length=50, blank=True, null=True)
    duration = models.CharField(max_length=50, blank=True, null=True)
    
    class Meta:
        abstract = True
        verbose_name = "Route"
        verbose_name_plural = "Routes"
    
    def clean(self):
        if self.end_date and self.start_date and self.end_date < self.start_date:
            raise ValidationError("End date cannot be before start date")
    
    def __str__(self):
        return f"{self.name} ({self.from_location} to {self.to_location})"

class AbstractCheckpoint(models.Model):
    address = models.CharField(max_length=255)
    lat = models.FloatField(blank=True, null=True)
    lng = models.FloatField(blank=True, null=True)
   
    class Meta:
        abstract = True
        verbose_name = "Checkpoint"
        verbose_name_plural = "Checkpoints"
      
    def __str__(self):
        return f"Checkpoint {self.address}"

class Bus(Vehicle):
   
    
    bus_type = models.CharField(max_length=15)
    seating_capacity = models.PositiveIntegerField()
    has_ac = models.BooleanField(default=False)
    has_wifi = models.BooleanField(default=False)
    
    driver = models.OneToOneField(
        Driver,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
       
    )
    conductor = models.OneToOneField(
        Conductor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        
    )
    
    class Meta:
        verbose_name = "Bus"
        verbose_name_plural = "Buses"

class BusRoute(AbstractRoute):
    vehicle = models.ForeignKey(
        Bus,
        on_delete=models.CASCADE,
      
    )
    
    class Meta:
        verbose_name = "Bus Route"
        verbose_name_plural = "Bus Routes"

class BusCheckpoint(AbstractCheckpoint):
    route = models.ForeignKey(
        BusRoute,
        on_delete=models.CASCADE,
       
    )
    
    class Meta:
        verbose_name = "Bus Checkpoint"
        verbose_name_plural = "Bus Checkpoints"

class Car(Vehicle):
   
    
    car_type = models.CharField(max_length=15)
    
    seating_capacity= models.PositiveIntegerField(default=4)
    
    driver = models.OneToOneField(
        Driver,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
       
    )
    
    class Meta:
        verbose_name = "Car"
        verbose_name_plural = "Cars"

class CarRoute(AbstractRoute):
    vehicle = models.ForeignKey(
        Car,
        on_delete=models.CASCADE,
       
    )
    
    class Meta:
        verbose_name = "Car Route"
        verbose_name_plural = "Car Routes"



class Bike(Vehicle):
   
    
    bike_type = models.CharField(max_length=15)
    # helmet_provided = models.BooleanField(default=True)
    
    driver = models.OneToOneField(
        Driver,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
       
    )
    
    class Meta:
        verbose_name = "Bike"
        verbose_name_plural = "Bikes"

class BikeRoute(AbstractRoute):
    vehicle = models.ForeignKey(
        Bike,
        on_delete=models.CASCADE,
       
    )
    
    class Meta:
        verbose_name = "Bike Route"
        verbose_name_plural = "Bike Routes"



class AbstractRuntimeData(models.Model):
    current_status = models.CharField(
        max_length=12,
        choices=[
            ('Active', 'Active'),
            ('Maintenance', 'Maintenance'),
            ('Inactive', 'Inactive'),
        ],
        default='Active'
    )
    current_lat = models.FloatField(null=True, blank=True)
    current_lng = models.FloatField(null=True, blank=True)
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True
        verbose_name = "Runtime Data"
        verbose_name_plural = "Runtime Data"

class BusRuntimeData(AbstractRuntimeData):
    vehicle = models.OneToOneField(
        Bus,
        on_delete=models.CASCADE,
       
    )
    passenger_count = models.PositiveIntegerField(default=0)
    current_route = models.ForeignKey(
        BusRoute,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    current_checkpoint = models.ForeignKey(
        BusCheckpoint,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    class Meta:
        verbose_name = "Bus Runtime Data"
        verbose_name_plural = "Bus Runtime Data"

class CarRuntimeData(AbstractRuntimeData):
    vehicle = models.OneToOneField(
        Car,
        on_delete=models.CASCADE,
       
    )
    current_route = models.ForeignKey(
        CarRoute,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    current_lat = models.DecimalField(max_digits=9, decimal_places=6)
    current_lng = models.DecimalField(max_digits=9, decimal_places=6)
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Car Runtime Data"
        verbose_name_plural = "Car Runtime Data"

class BikeRuntimeData(AbstractRuntimeData):
    vehicle = models.OneToOneField(
        Bike,
        on_delete=models.CASCADE,
        
    )
    current_route = models.ForeignKey(
        BikeRoute,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    class Meta:
        verbose_name = "Bike Runtime Data"
        verbose_name_plural = "Bike Runtime Data"


# class Alert(models.Model):
#     SEVERITY_CHOICES = [
#         ('Low', 'Low'),
#         ('Medium', 'Medium'),
#         ('High', 'High'),
#         ('Critical', 'Critical'),
#     ]
    
#     content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
#     object_id = models.PositiveIntegerField()
#     vehicle = GenericForeignKey('content_type', 'object_id')
    
#     message = models.CharField(max_length=255)
#     severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='Medium')
#     created_at = models.DateTimeField(auto_now_add=True)
#     resolved = models.BooleanField(default=False)
#     resolved_at = models.DateTimeField(null=True, blank=True)
    
#     def save(self, *args, **kwargs):
#         if self.resolved and not self.resolved_at:
#             self.resolved_at = timezone.now()
#         super().save(*args, **kwargs)
    
#     def __str__(self):
#         return f"{self.vehicle.vehicle_id if self.vehicle else 'Unknown'} - {self.message}"

# class Alert(models.Model):
#     SEVERITY_CHOICES = [
#         ('Low', 'Low'),
#         ('Medium', 'Medium'),
#         ('High', 'High'),
#         ('Critical', 'Critical'),
#     ]
    
#     vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE)
#     message = models.CharField(max_length=255)
#     severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='Medium')
#     created_at = models.DateTimeField(auto_now_add=True)
#     resolved = models.BooleanField(default=False)
#     resolved_at = models.DateTimeField(null=True, blank=True)
    
#     def save(self, *args, **kwargs):
#         if self.resolved and not self.resolved_at:
#             self.resolved_at = timezone.now()
#         super().save(*args, **kwargs)
    
#     def __str__(self):
#         return f"{self.vehicle.vehicle_id} - {self.message}"


class BookingRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected')
    ]

    user = models.ForeignKey(PhoneOTP, on_delete=models.CASCADE)
    drivers = models.ForeignKey(Driver, on_delete=models.CASCADE, related_name='booking_requests')
    from_address = models.CharField(max_length=255)
    to_address = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)  # Add this field

    def __str__(self):
        return f"Booking #{self.id} - {self.status}"

    class Meta:
        ordering = ['-created_at']  # Newest first
        get_latest_by = 'created_at'
        
        
        