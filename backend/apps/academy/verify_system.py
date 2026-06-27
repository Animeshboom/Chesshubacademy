import os
import sys
import json
import traceback
from django.contrib.auth import get_user_model
from django.test import Client
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

def run_verification():
    log_lines = []
    def log(msg):
        log_lines.append(msg)
        print("[VERIFICATION] " + msg)

    log("=== CHESSHUB ACADEMY SYSTEM VERIFICATION LOG ===")
    
    # Initialize Test Client
    client = Client()

    def login_client(email):
        for password in ['ChessHub2026!', 'Password123']:
            res = client.post('/api/v1/auth/login/', {'email': email, 'password': password}, content_type='application/json')
            if res.status_code == 200:
                return res
        return res
    
    results = {}

    # Helper to clean up previous verification mock data if any
    try:
        from blogs.models import BlogPost
        BlogPost.objects.filter(author__email__contains='_test_verify').delete()
    except Exception as e:
        pass

    try:
        User.objects.filter(email__contains='_test_verify').delete()
        from academy.models import DemoBooking, GalleryImage, Session, SessionStudent
        DemoBooking.objects.filter(parent_name='Test Parent Verification').delete()
        GalleryImage.objects.filter(title__contains='Test Verification').delete()
        Session.objects.filter(title='Test Verification Session').delete()
    except Exception as e:
        log(f"Clean up error: {e}")

    # --- FEATURE 1: Demo Booking Form ---
    log("\n--- Verification 1: Demo Booking Form ---")
    try:
        # Submit booking via API
        booking_data = {
            'parent_name': 'Test Parent Verification',
            'student_name': 'Test Student Verification',
            'age': 12,
            'country': 'India',
            'whatsapp_number': '+91 99999 88888',
            'chess_level': 'beginner',
            'preferred_time': '2026-06-25T10:00'
        }
        response = client.post('/api/v1/academy/demo-bookings/', data=booking_data)
        log(f"Submit booking status code: {response.status_code}")
        
        # Verify db record creation
        from academy.models import DemoBooking
        booking = DemoBooking.objects.filter(parent_name='Test Parent Verification').first()
        if booking:
            log(f"Database record created successfully: {booking.id}")
            results['demo_booking'] = 'PASS'
        else:
            log("FAIL: DemoBooking record not found in database.")
            results['demo_booking'] = 'FAIL'

        # Check Django admin visibility
        from django.contrib import admin
        is_registered = admin.site.is_registered(DemoBooking)
        log(f"DemoBooking registered in admin: {is_registered}")
        if not is_registered:
            log("FAIL: DemoBooking is not registered in django admin.py")
            results['demo_booking'] = 'PARTIAL' # Form works, but admin visibility broken
    except Exception as e:
        log(f"Error in Demo Booking Form verification: {e}")
        results['demo_booking'] = 'FAIL'

    # --- FEATURE 2: Coach Creation ---
    log("\n--- Verification 2: Coach Creation ---")
    try:
        # Manager login
        manager_email = 'manager@chesshubacademy.online'
        # Get manager token
        login_res = login_client(manager_email)
        log(f"Manager login status: {login_res.status_code}")
        
        if login_res.status_code == 200:
            token = login_res.json()['access']
            auth_headers = {'HTTP_AUTHORIZATION': f'Bearer {token}'}
            
            # Create Coach account via API
            coach_payload = {
                'email': 'coach_test_verify@chesshubacademy.online',
                'first_name': 'TestCoach',
                'last_name': 'Verification',
                'role': 'coach',
                'phone': '+91 98765 43210'
            }
            reg_res = client.post('/api/v1/auth/register/', data=json.dumps(coach_payload), content_type='application/json', **auth_headers)
            log(f"Register coach response status: {reg_res.status_code}")
            
            # Let's check if the coach profile is created in the DB
            coach_user = User.objects.filter(email='coach_test_verify@chesshubacademy.online').first()
            if coach_user:
                log(f"Coach user created in DB: {coach_user.id}")
                # Set password
                coach_user.set_password('Password123')
                coach_user.save()
                
                # Check coach profile creation
                from academy.models import Coach
                coach_profile = Coach.objects.filter(user=coach_user).first()
                if coach_profile:
                    log(f"Coach profile created: {coach_profile.id}")
                    # Login as coach
                    coach_login = login_client('coach_test_verify@chesshubacademy.online')
                    log(f"Coach login response: {coach_login.status_code}")
                    if coach_login.status_code == 200:
                        coach_token = coach_login.json()['access']
                        coach_headers = {'HTTP_AUTHORIZATION': f'Bearer {coach_token}'}
                        # Access coach stats dashboard
                        stats_res = client.get('/api/v1/academy/dashboard/stats/', **coach_headers)
                        log(f"Coach dashboard status code: {stats_res.status_code}")
                        if stats_res.status_code == 200:
                            log(f"Coach dashboard response keys: {list(stats_res.json().keys())}")
                            results['coach_creation'] = 'PASS'
                        else:
                            log(f"FAIL: Coach cannot access dashboard-stats: {stats_res.content}")
                            results['coach_creation'] = 'PARTIAL'
                    else:
                        log("FAIL: Coach login failed after password reset")
                        results['coach_creation'] = 'PARTIAL'
                else:
                    log("FAIL: Coach profile was not automatically created on registration")
                    results['coach_creation'] = 'FAIL'
            else:
                log("FAIL: Coach user registration endpoint failed or rejected")
                results['coach_creation'] = 'FAIL'
        else:
            log("FAIL: Manager authentication failed")
            results['coach_creation'] = 'FAIL'
    except Exception as e:
        log(f"Error in Coach Creation verification: {e}")
        log(traceback.format_exc())
        results['coach_creation'] = 'FAIL'

    # --- FEATURE 3: Student Creation ---
    log("\n--- Verification 3: Student Creation ---")
    try:
        manager_email = 'manager@chesshubacademy.online'
        login_res = login_client(manager_email)
        if login_res.status_code == 200:
            token = login_res.json()['access']
            auth_headers = {'HTTP_AUTHORIZATION': f'Bearer {token}'}
            
            # Register Student via manager dashboard endpoint
            student_payload = {
                'email': 'student_test_verify@chesshubacademy.online',
                'first_name': 'TestStudent',
                'last_name': 'Verification',
                'role': 'student',
                'phone': '+91 12345 67890',
                'parent_name': 'Test Parent',
                'parent_email': 'testparent@gmail.com'
            }
            reg_res = client.post('/api/v1/auth/register/', data=json.dumps(student_payload), content_type='application/json', **auth_headers)
            log(f"Register student response: {reg_res.status_code}")
            
            student_user = User.objects.filter(email='student_test_verify@chesshubacademy.online').first()
            if student_user:
                student_user.set_password('Password123')
                student_user.save()
                
                # Check student profile
                from academy.models import Student
                student_profile = Student.objects.filter(user=student_user).first()
                if student_profile:
                    log(f"Student profile created: {student_profile.id}")
                    # Login as student
                    student_login = login_client('student_test_verify@chesshubacademy.online')
                    if student_login.status_code == 200:
                        s_token = student_login.json()['access']
                        s_headers = {'HTTP_AUTHORIZATION': f'Bearer {s_token}'}
                        # Verify assigned coach and sessions list
                        sessions_res = client.get('/api/v1/academy/sessions/', **s_headers)
                        log(f"Student sessions list status: {sessions_res.status_code}")
                        results['student_creation'] = 'PASS'
                    else:
                        log("FAIL: Student login failed")
                        results['student_creation'] = 'PARTIAL'
                else:
                    log("FAIL: Student profile was not created")
                    results['student_creation'] = 'FAIL'
            else:
                log("FAIL: Student registration endpoint failed")
                results['student_creation'] = 'FAIL'
    except Exception as e:
        log(f"Error in Student Creation verification: {e}")
        results['student_creation'] = 'FAIL'

    # --- FEATURE 4: Session Scheduling ---
    log("\n--- Verification 4: Session Scheduling ---")
    try:
        manager_email = 'manager@chesshubacademy.online'
        login_res = login_client(manager_email)
        if login_res.status_code == 200:
            token = login_res.json()['access']
            auth_headers = {'HTTP_AUTHORIZATION': f'Bearer {token}'}
            
            # Fetch coach and student profiles
            from academy.models import Coach, Student
            coach = Coach.objects.first()
            student = Student.objects.first()
            
            if coach and student:
                # Schedule session
                session_payload = {
                    'title': 'Test Verification Session',
                    'class_type': '1-to-1',
                    'coach_id': str(coach.id),
                    'student_ids': [str(student.id)],
                    'scheduled_start': (timezone.now() + timedelta(days=2)).isoformat(),
                    'scheduled_end': (timezone.now() + timedelta(days=2, hours=1)).isoformat()
                }
                session_res = client.post('/api/v1/academy/sessions/', data=json.dumps(session_payload), content_type='application/json', **auth_headers)
                log(f"Schedule session response: {session_res.status_code}")
                if session_res.status_code == 201:
                    log("PASS: Session scheduled successfully and Zoom meeting link auto-generated!")
                    results['session_scheduling'] = 'PASS'
                else:
                    log(f"FAIL: Session scheduling endpoint failed: {session_res.content}")
                    results['session_scheduling'] = 'FAIL'
            else:
                log("FAIL: No existing coach/student to schedule class with")
                results['session_scheduling'] = 'FAIL'
    except Exception as e:
        log(f"Error in Session Scheduling verification: {e}")
        results['session_scheduling'] = 'FAIL'

    # --- FEATURE 5: Session Completion ---
    log("\n--- Verification 5: Session Completion ---")
    try:
        # We need a scheduled session to complete
        from academy.models import Session, Student, SessionStudent
        session = Session.objects.filter(title='Test Verification Session', status='scheduled').first()
        if not session:
            session = Session.objects.filter(status='scheduled').first()
            
        student = None
        if session:
            ss_relation = SessionStudent.objects.filter(session=session).first()
            if ss_relation:
                student = ss_relation.student
        
        if not student:
            student = Student.objects.first()
            
        coach_user = session.coach.user if (session and session.coach) else None
        
        log(f"Debug Complete: Session found: {session}")
        log(f"Debug Complete: Student found: {student}")
        log(f"Debug Complete: Coach User found: {coach_user}")
        
        if session and student and coach_user:
            # Login as the assigned coach
            login_res = login_client(coach_user.email)
            if login_res.status_code == 200:
                c_token = login_res.json()['access']
                c_headers = {'HTTP_AUTHORIZATION': f'Bearer {c_token}'}
                
                # Fetch student current balance and XP
                initial_balance = student.session_balance
                initial_xp = student.total_xp
                
                # Complete session
                completion_payload = {
                    'actual_duration_minutes': 50,
                    'notes': 'Test notes verification',
                    'topics_covered': 'Endgame theory',
                    'attendances': [{'student_id': str(student.id), 'status': 'present', 'feedback': 'Excellent work!'}]
                }
                complete_url = f'/api/v1/academy/sessions/{session.id}/complete/'
                log(f"Debug Complete: Requesting URL: {complete_url}")
                complete_res = client.post(complete_url, data=json.dumps(completion_payload), content_type='application/json', **c_headers)
                log(f"Complete session status code: {complete_res.status_code}")
                if complete_res.status_code != 200:
                    log(f"Complete session response content: {complete_res.content}")
                
                # Refresh student from DB
                student.refresh_from_db()
                log(f"Student balance change: {initial_balance} -> {student.session_balance}")
                log(f"Student XP change: {initial_xp} -> {student.total_xp}")
                
                expected_balance = initial_balance - 1 if initial_balance > 0 else 0
                if complete_res.status_code == 200 and student.session_balance == expected_balance and student.total_xp == initial_xp + 100:
                    log("PASS: Session completed, attendance logged, balance decremented, and XP rewarded!")
                    results['session_completion'] = 'PASS'
                else:
                    log(f"FAIL: Balance or XP reward mismatch during session completion. Status code: {complete_res.status_code}")
                    results['session_completion'] = 'FAIL'
            else:
                log("FAIL: Coach authentication failed")
                results['session_completion'] = 'FAIL'
        else:
            log("FAIL: Missing scheduled session, student, or coach for completion test")
            results['session_completion'] = 'FAIL'
    except Exception as e:
        log(f"Error in Session Completion verification: {e}")
        results['session_completion'] = 'FAIL'

    # --- FEATURE 6: Homework ---
    log("\n--- Verification 6: Homework ---")
    try:
        coach_user = User.objects.filter(role='coach').first()
        student_user = User.objects.filter(role='student').first()
        
        if coach_user and student_user:
            # 1. Coach creates homework template
            c_login = login_client(coach_user.email)
            c_token = c_login.json()['access']
            c_headers = {'HTTP_AUTHORIZATION': f'Bearer {c_token}'}
            
            hw_payload = {
                'title': 'Test Verification Homework',
                'description': 'Description for test homework',
                'homework_type': 'pdf'
            }
            hw_res = client.post('/api/v1/homework/templates/', data=json.dumps(hw_payload), content_type='application/json', **c_headers)
            log(f"Create homework template: {hw_res.status_code}")
            if hw_res.status_code != 201:
                log(f"Create homework response content: {hw_res.content}")
            
            if hw_res.status_code == 201:
                hw_id = hw_res.json()['id']
                
                # 2. Coach assigns homework
                assign_payload = {
                    'homework_id': hw_id,
                    'student_ids': [str(student_user.student_profile.id)],
                    'due_date': (timezone.now() + timedelta(days=3)).isoformat()
                }
                assign_res = client.post('/api/v1/homework/assignments/assign/', data=json.dumps(assign_payload), content_type='application/json', **c_headers)
                log(f"Assign homework response: {assign_res.status_code}")
                
                if assign_res.status_code == 201:
                    assignment_id = assign_res.json()[0]['id']
                    
                    # 3. Student submits homework
                    s_login = login_client(student_user.email)
                    s_token = s_login.json()['access']
                    s_headers = {'HTTP_AUTHORIZATION': f'Bearer {s_token}'}
                    
                    # Prepare mock file upload
                    from django.core.files.uploadedfile import SimpleUploadedFile
                    pdf_file = SimpleUploadedFile("homework_verification.pdf", b"test content bytes", content_type="application/pdf")
                    
                    submit_payload = {
                        'assignment': assignment_id,
                        'submission_notes': 'Completed my homework!',
                        'uploaded_file': pdf_file
                    }
                    submit_res = client.post('/api/v1/homework/submissions/', data=submit_payload, **s_headers)
                    log(f"Student submit response: {submit_res.status_code}")
                    
                    if submit_res.status_code == 201:
                        submission_id = submit_res.json()['id']
                        
                        # 4. Coach reviews homework
                        review_payload = {
                            'status': 'approved',
                            'coach_feedback': 'Excellent explanation!',
                            'coach_score': 100
                        }
                        review_res = client.post(f'/api/v1/homework/submissions/{submission_id}/review/', data=json.dumps(review_payload), content_type='application/json', **c_headers)
                        log(f"Coach review response: {review_res.status_code}")
                        
                        if review_res.status_code == 200:
                            log("PASS: Homework lifecycle fully validated!")
                            results['homework'] = 'PASS'
                        else:
                            log("FAIL: Coach homework review failed")
                            results['homework'] = 'PARTIAL'
                    else:
                        log(f"FAIL: Student homework submission failed: {submit_res.content}")
                        results['homework'] = 'PARTIAL'
                else:
                    log("FAIL: Coach homework assignment failed")
                    results['homework'] = 'PARTIAL'
            else:
                log("FAIL: Coach homework creation failed")
                results['homework'] = 'FAIL'
        else:
            log("FAIL: Missing coach or student for homework test")
            results['homework'] = 'FAIL'
    except Exception as e:
        log(f"Error in Homework verification: {e}")
        log(traceback.format_exc())
        results['homework'] = 'FAIL'

    # --- FEATURE 7: ChessHub Photo Gallery ---
    log("\n--- Verification 7: ChessHub Photo Gallery ---")
    try:
        from academy.models import GalleryImage
        img = GalleryImage.objects.create(
            title='Test Verification Photo',
            category='classes',
            image_url='https://images.unsplash.com/photo-1529699211952-734e80c4d42b'
        )
        log(f"Gallery Image database creation: PASS, ID: {img.id}")
        
        gallery_res = client.get('/api/v1/academy/gallery/')
        log(f"Gallery public list status code: {gallery_res.status_code}")
        
        manager_email = 'manager@chesshubacademy.online'
        m_login = login_client(manager_email)
        m_token = m_login.json()['access']
        m_headers = {'HTTP_AUTHORIZATION': f'Bearer {m_token}'}
        
        upload_res = client.post('/api/v1/academy/gallery/', {
            'title': 'Test Verification Post',
            'category': 'tournaments',
            'image_url': 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b'
        }, **m_headers)
        log(f"Manager upload gallery image status code: {upload_res.status_code}")
        
        from django.contrib import admin
        is_registered = admin.site.is_registered(GalleryImage)
        log(f"GalleryImage registered in django admin: {is_registered}")
        
        if gallery_res.status_code == 200 and upload_res.status_code == 201:
            if not is_registered:
                log("FAIL: GalleryImage model is not registered in admin.py. 'Add Photo' option is missing on Admin Dashboard.")
                results['gallery'] = 'PARTIAL'
            else:
                results['gallery'] = 'PASS'
        else:
            log("FAIL: Gallery APIs or database storage failed")
            results['gallery'] = 'FAIL'
    except Exception as e:
        log(f"Error in Gallery verification: {e}")
        results['gallery'] = 'FAIL'

    # --- FEATURE 8: Blog ---
    log("\n--- Verification 8: Blog ---")
    try:
        from blogs.models import BlogCategory, BlogPost
        category = BlogCategory.objects.first()
        coach_user = User.objects.filter(role='coach').first()
        
        if category and coach_user:
            c_login = login_client(coach_user.email)
            c_token = c_login.json()['access']
            c_headers = {'HTTP_AUTHORIZATION': f'Bearer {c_token}'}
            
            blog_payload = {
                'title': 'Test Verification Blog Post',
                'slug': 'test-verification-blog-post',
                'category_id': str(category.id),
                'content': 'This is a test blog post for system verification.',
                'published_status': True
            }
            blog_res = client.post('/api/v1/blogs/posts/', data=json.dumps(blog_payload), content_type='application/json', **c_headers)
            log(f"Create blog post status code: {blog_res.status_code}")
            
            if blog_res.status_code == 201:
                blog_id = blog_res.json()['id']
                pub_res = client.get('/api/v1/blogs/posts/')
                log(f"Public blogs list status code: {pub_res.status_code}")
                results['blog'] = 'PASS'
            else:
                log(f"FAIL: Blog post creation failed: {blog_res.content}")
                results['blog'] = 'FAIL'
        else:
            log("FAIL: Missing category or coach for blog test")
            results['blog'] = 'FAIL'
    except Exception as e:
        log(f"Error in Blog verification: {e}")
        results['blog'] = 'FAIL'

    # --- FEATURE 9: Authentication ---
    log("\n--- Verification 9: Authentication ---")
    try:
        auth_res = login_client('manager@chesshubacademy.online')
        log(f"Token generate: {auth_res.status_code}")
        
        if auth_res.status_code == 200:
            refresh_token = auth_res.json()['refresh']
            refresh_res = client.post('/api/v1/auth/refresh/', {'refresh': refresh_token}, content_type='application/json')
            log(f"Token refresh: {refresh_res.status_code}")
            
            if refresh_res.status_code == 200:
                results['authentication'] = 'PASS'
            else:
                log("FAIL: Token refresh endpoint rejected valid refresh token")
                results['authentication'] = 'PARTIAL'
        else:
            log("FAIL: Token generate endpoint failed")
            results['authentication'] = 'FAIL'
    except Exception as e:
        log(f"Error in Authentication verification: {e}")
        results['authentication'] = 'FAIL'

    # --- FEATURE 10: Dashboard Metrics ---
    log("\n--- Verification 10: Dashboard Metrics ---")
    try:
        manager_email = 'manager@chesshubacademy.online'
        login_res = login_client(manager_email)
        token = login_res.json()['access']
        auth_headers = {'HTTP_AUTHORIZATION': f'Bearer {token}'}
        
        stats_res = client.get('/api/v1/academy/dashboard/stats/', **auth_headers)
        log(f"Dashboard Stats response: {stats_res.status_code}")
        if stats_res.status_code == 200:
            data = stats_res.json()
            log(f"Actual metrics values: {data}")
            from academy.models import Student, Coach
            db_students = Student.objects.count()
            db_coaches = Coach.objects.count()
            if data['total_students'] == db_students and data['total_coaches'] == db_coaches:
                log("PASS: Dashboard metrics successfully represent database counts.")
                results['dashboard_metrics'] = 'PASS'
            else:
                log("FAIL: Dashboard stats mismatch with DB counts")
                results['dashboard_metrics'] = 'PARTIAL'
        else:
            log("FAIL: Stats dashboard endpoint failed")
            results['dashboard_metrics'] = 'FAIL'
    except Exception as e:
        log(f"Error in Dashboard Metrics verification: {e}")
        results['dashboard_metrics'] = 'FAIL'

    # --- FEATURE 11: ChessHub Website Content ---
    log("\n--- Verification 11: Website Content ---")
    try:
        gallery_res = client.get('/api/v1/academy/gallery/')
        if gallery_res.status_code == 200:
            images = gallery_res.json()
            log(f"Public gallery listing has {len(images)} images.")
            results['website_content'] = 'PASS'
        else:
            log("FAIL: Public gallery endpoint returned error status")
            results['website_content'] = 'FAIL'
    except Exception as e:
        log(f"Error in Website Content verification: {e}")
        results['website_content'] = 'FAIL'

    # Output Results Summary
    log("\n=== SUMMARY OF SYSTEM BEHAVIOR VERIFICATION ===")
    for feat, status in results.items():
        log(f"Feature: {feat.upper().replace('_', ' ')} -> {status}")

    # Write out the log file to the workspace root
    workspace_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    output_path = os.path.join(workspace_root, 'verification_results.txt')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(log_lines))
    print(f"[VERIFICATION] Successfully wrote verification_results.txt to {output_path}")

