"""
Constants for the transport management system.
"""

# Role choices for user authentication and authorization
ROLE_CHOICES = [
    ("user", "User"),
    ("driver", "Driver"),
    ("conductor", "Conductor"),
    ("operator", "Operator"),
]

# Helper function to get role values (for serializers)
def get_role_choices():
    """Returns list of role values for use in ChoiceField."""
    return [choice[0] for choice in ROLE_CHOICES]

