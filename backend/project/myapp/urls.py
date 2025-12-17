from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenRefreshView



urlpatterns = [
    path('send-otp/', views.send_otp),
    path('verify-otp/', views.verify_otp),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
      # Personal Details
    path('personal-details/', views.get_personal_details),
    path('personal-details/create/', views.create_personal_details),
    path('personal-details/<int:pk>/update/', views.update_personal_details),
    path('personal-details/<int:pk>/delete/', views.delete_personal_details),

    # GST Details
    path('gst-details/', views.get_gst_details),
    path('gst-details/create/', views.create_gst_details),
    path('gst-details/<int:pk>/update/', views.update_gst_details),
    path('gst-details/<int:pk>/delete/', views.delete_gst_details),

    # Documents Upload
    path('documents/', views.get_documents),
    path('documents/create/', views.create_documents),
    path('documents/<int:pk>/update/', views.update_documents),
    path('documents/<int:pk>/delete/', views.delete_documents),

    # Bank Details
    path('bank-details/', views.get_bank_details),
    path('bank-details/create/', views.create_bank_details),
    path('bank-details/<int:pk>/update/', views.update_bank_details),
    path('bank-details/<int:pk>/delete/', views.delete_bank_details),
    
    path('signup/driver/',views.signup_driver),
    path('login/driver/', views.login_driver),

    path('driver-details/',views.get_driver_details,name='get-driver'),
    path('driver-details/<int:driver_id>/',views.get_driver_details_id),
    path('update-driver/<int:driver_id>/',views.update_driver,name='update-driver'),
    path('delete-driver/<int:driver_id>/',views.delete_driver,name='delete-driver'),
    path('signup/conductor/', views.signup_conductor, name='create-conductor'),
    path('login/conductor/', views.login_conductor),
    path('conductor-details/', views.get_conductor_details, name='get-conductor'),
    path('conductor-details/<int:conductor_id>/', views.get_conductor_details_id),
    path('update-conductor/<int:conductor_id>/', views.update_conductor, name='update-conductor'),
    path('delete-conductor/<int:conductor_id>/', views.delete_conductor, name='delete-conductor'),

    path('create-bus/', views.create_bus, name='create-bus'),
    path('bus-details/', views.get_bus_details, name='get-bus'),
    path('update-bus/<int:bus_id>/', views.update_bus, name='update-bus'),
    path('delete-bus/<int:bus_id>/', views.delete_bus, name='delete-bus'),
    path('bus/driver/<int:driver_id>/', views.get_bus_by_driver_id, name='get_bus_by_driver_id'),
    path('bus-routes/', views.get_bus_routes),
    path('bus-routes/<int:pk>/', views.get_bus_route),
    path('bus-routes/create/', views.create_bus_route),
    path('bus-routes/update/<int:pk>/', views.update_bus_route),
    path('bus-routes/delete/<int:pk>/', views.delete_bus_route),
    path('bus-checkpoints/', views.list_bus_checkpoints),
    path('bus-checkpoints/create/', views.create_bus_checkpoint),
    path('bus-checkpoints/<int:pk>/', views.get_bus_checkpoint),
    path('bus-checkpoints/update/<int:pk>/', views.update_bus_checkpoint),
    path('bus-checkpoints/delete/<int:pk>/', views.delete_bus_checkpoint),
  
    path('create-car/', views.create_car, name='create-car'),
    path('car-details/', views.get_car_details, name='get-car'),
    path('update-car/<int:car_id>/', views.update_car, name='update-car'),
    path('delete-car/<int:car_id>/', views.delete_car, name='delete-car'),
    path('car/driver/<int:driver_id>/', views.get_car_by_driver_id, name='get_car_by_driver_id'),
    path('car-routes/create/', views.create_car_route),
    path('car-routes/', views.list_car_routes),
    path('car-routes/<int:pk>/', views.get_car_route),
    path('car-routes/update/<int:pk>/', views.update_car_route),
    path('car-routes/delete/<int:pk>/', views.delete_car_route),

   
    path('create-bike/', views.create_bike, name='create-bike'),
    path('bike-details/', views.get_bike_details, name='get-bike'),
    path('update-bike/<int:bike_id>/', views.update_bike, name='update-bike'),
    path('delete-bike/<int:bike_id>/', views.delete_bike, name='delete-bike'),
    path('bike/driver/<int:driver_id>/', views.get_bike_by_driver_id, name='get_bike_by_driver_id'),
    path('bike-routes/create/', views.create_bike_route),
    path('bike-routes/', views.list_bike_routes),
    path('bike-routes/<int:pk>/', views.get_bike_route),
    path('bike-routes/update/<int:pk>/', views.update_bike_route),
    path('bike-routes/delete/<int:pk>/', views.delete_bike_route),
    
    
    path('bookings/create/', views.create_booking, name='create_booking'),
    path('otp-entries/', views.get_all_otp_entries, name='get_all_otp_entries'),
    path('bookings/', views.get_booking_requests, name='get-bookings'),
    path('bookings/driver-id/', views.get_bookings_by_driver, name='get-bookings')
]