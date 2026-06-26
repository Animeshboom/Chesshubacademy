from rest_framework.throttling import AnonRateThrottle, UserRateThrottle

class AnonDemoBookingThrottle(AnonRateThrottle):
    """
    Throttle anonymous booking of demo sessions to prevent booking spam.
    """
    scope = 'anon_demo_booking'

class StudentTestThrottle(UserRateThrottle):
    """
    Provide higher limits for authenticated students taking homework/puzzles.
    """
    scope = 'student_tests'
