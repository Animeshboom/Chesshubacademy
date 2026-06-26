import uuid
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from academy.models import AcademyManager, Coach, Student, Enrollment, Session, SessionStudent, DemoBooking, GalleryImage
from blogs.models import BlogCategory, BlogPost
from homework.models import Homework, HomeworkAssignment, HomeworkSubmission, Puzzle
from tournaments.models import Tournament

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with initial mock data for ChessHub Academy'

    def handle(self, *args, **options):
        self.stdout.write('Clearing existing data...')
        
        # Clear tables
        Tournament.objects.all().delete()
        Puzzle.objects.all().delete()
        HomeworkSubmission.objects.all().delete()
        HomeworkAssignment.objects.all().delete()
        Homework.objects.all().delete()
        BlogPost.objects.all().delete()
        BlogCategory.objects.all().delete()
        DemoBooking.objects.all().delete()
        GalleryImage.objects.all().delete()
        SessionStudent.objects.all().delete()
        Session.objects.all().delete()
        Enrollment.objects.all().delete()
        Student.objects.all().delete()
        Coach.objects.all().delete()
        AcademyManager.objects.all().delete()
        User.objects.all().delete()

        self.stdout.write('Seeding users...')

        # 1. Create Academy Manager
        manager_user = User.objects.create_user(
            email='manager@chesshubacademy.online',
            first_name='Academy',
            last_name='Manager',
            role='manager',
            phone='+91 99999 99999'
        )
        manager_user.set_password('Password123')
        manager_user.save()
        AcademyManager.objects.create(user=manager_user)

        # 2. Create Coaches
        coach_data = [
            {
                'email': 'coach@chesshubacademy.online',
                'first_name': 'Priyadarshan',
                'last_name': 'FM',
                'bio': 'FIDE Master with 15+ years of chess experience. Coached dozens of kids to rating achievements.',
                'lichess': 'FM_Priyadarshan',
                'rate': 1200.00
            },
            {
                'email': 'divya@chesshubacademy.online',
                'first_name': 'Divya',
                'last_name': 'WIM',
                'bio': 'Woman International Master, specialized in opening preparations and tactical awareness.',
                'lichess': 'WIM_Divya',
                'rate': 1500.00
            }
        ]

        coaches = []
        for c in coach_data:
            c_user = User.objects.create_user(
                email=c['email'],
                first_name=c['first_name'],
                last_name=c['last_name'],
                role='coach'
            )
            c_user.set_password('Password123')
            c_user.save()
            coach_profile = Coach.objects.create(
                user=c_user,
                bio=c['bio'],
                lichess_username=c['lichess'],
                hourly_rate=c['rate'],
                zoom_personal_link='https://zoom.us/j/mockcoachlink'
            )
            coaches.append(coach_profile)

        # 3. Create Students
        student_data = [
            {
                'email': 'student@chesshubacademy.online',
                'first_name': 'Aarav',
                'last_name': 'Sharma',
                'parent_name': 'Rajesh Sharma',
                'parent_email': 'rajesh@gmail.com',
                'lichess': 'Aarav_ChessKid',
                'rating': 1200,
                'balance': 8,
                'xp': 3450,
                'level': 4,
                'coach': coaches[0]
            },
            {
                'email': 'emily@chesshubacademy.online',
                'first_name': 'Emily',
                'last_name': 'Jenkins',
                'parent_name': 'Sarah Jenkins',
                'parent_email': 'sarah@jenkins.com',
                'lichess': 'Emily_J',
                'rating': 1050,
                'balance': 14,
                'xp': 1800,
                'level': 2,
                'coach': coaches[0]
            },
            {
                'email': 'lucas@chesshubacademy.online',
                'first_name': 'Lucas',
                'last_name': 'Miller',
                'parent_name': 'David Miller',
                'parent_email': 'david@miller.com',
                'lichess': 'Lucas_Play',
                'rating': 950,
                'balance': 24,
                'xp': 900,
                'level': 1,
                'coach': coaches[1]
            }
        ]

        students = []
        for s in student_data:
            s_user = User.objects.create_user(
                email=s['email'],
                first_name=s['first_name'],
                last_name=s['last_name'],
                role='student'
            )
            s_user.set_password('Password123')
            s_user.save()
            student_profile = Student.objects.create(
                user=s_user,
                assigned_coach=s['coach'],
                parent_name=s['parent_name'],
                parent_email=s['parent_email'],
                lichess_username=s['lichess'],
                lichess_rating=s['rating'],
                session_balance=s['balance'],
                total_xp=s['xp'],
                level=s['level']
            )
            students.append(student_profile)

            # Create an enrollment history for financial stats
            Enrollment.objects.create(
                student=student_profile,
                plan_name='24 Sessions Pack',
                sessions_purchased=24,
                amount_paid=14400.00
            )

        self.stdout.write('Seeding classes sessions...')

        # 4. Create Sessions
        # Scheduled upcoming session
        session_1 = Session.objects.create(
            title='Tactical Calculations - Pins & Forks',
            class_type='1-to-1',
            coach=coaches[0],
            scheduled_start=timezone.now() + timedelta(days=1),
            scheduled_end=timezone.now() + timedelta(days=1, hours=1),
            status='scheduled'
        )
        SessionStudent.objects.create(session=session_1, student=students[0], attendance_status='pending')

        # Completed session
        session_2 = Session.objects.create(
            title='Opening Principles: Italian Game Basics',
            class_type='1-to-1',
            coach=coaches[0],
            scheduled_start=timezone.now() - timedelta(days=2),
            scheduled_end=timezone.now() - timedelta(days=2, hours=1),
            actual_duration_minutes=50,
            status='completed',
            topics_covered='Italian Game e4 e5, development of knights and bishops, importance of castling.',
            notes='Student showed excellent focus. Solved 3 opening puzzles successfully.'
        )
        SessionStudent.objects.create(session=session_2, student=students[0], attendance_status='present', feedback='Great class execution.')

        self.stdout.write('Seeding homework assignments...')

        # 5. Create Homework
        hw_1 = Homework.objects.create(
            title='Find the Mate in 1',
            description='Identify the forced mating square. Submit a PDF file describing your calculation steps.',
            homework_type='pdf',
            created_by_coach=coaches[0]
        )
        hw_assignment = HomeworkAssignment.objects.create(
            homework=hw_1,
            student=students[0],
            due_date=timezone.now() + timedelta(days=3),
            status='assigned'
        )

        self.stdout.write('Seeding tactical puzzles...')

        # 6. Create Puzzle (matches student dashboard daily challenge)
        Puzzle.objects.create(
            fen='r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR b KQkq - 0 1',
            moves='f7f5',
            rating=800,
            themes=['mateIn1', 'opening'],
            title='Daily Opening Checkmate Trap Challenge',
            description='Black to move. Find the best move to counter the mate thread.'
        )

        self.stdout.write('Seeding blog categories and posts...')

        # 7. Create Blogs
        cat_guides = BlogCategory.objects.create(name='Opening Guides', slug='opening-guides')
        cat_tips = BlogCategory.objects.create(name='Training Tips', slug='training-tips')

        BlogPost.objects.create(
            title='Top 5 Chess Openings for Junior Tournament Players',
            slug='top-5-chess-openings-junior-players',
            category=cat_guides,
            content='Openings define the initial board battles. For kids, building a reliable space control is paramount...',
            featured_image_url='https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=600&auto=format&fit=crop',
            seo_title='Top 5 Chess Openings for Junior Players',
            seo_description='Discover the top chess openings for junior players to improve tactical alertness.',
            seo_keywords=['openings', 'junior chess', 'tactics'],
            author=coaches[0].user,
            published_status=True,
            published_at=timezone.now()
        )

        BlogPost.objects.create(
            title='How to Manage Time Pressure in Classical Chess',
            slug='manage-time-pressure-classical-chess',
            category=cat_tips,
            content='Clock management is as critical as piece management...',
            featured_image_url='https://images.unsplash.com/photo-1560179707-f14e90ef3623?q=80&w=600&auto=format&fit=crop',
            seo_title='Manage Time Pressure in Classical Chess',
            seo_description='FIDE-certified tips on how chess players can manage clock pressure.',
            seo_keywords=['time pressure', 'chess clock', 'classical'],
            author=coaches[0].user,
            published_status=True,
            published_at=timezone.now()
        )

        self.stdout.write('Seeding tournaments...')

        # 8. Create Tournaments
        Tournament.objects.create(
            title='ChessHub Autumn Rapid Arena 2026',
            description='Elite rapid Swiss tournament for junior academy members. 5 Rounds, 15+10 time control.',
            start_time=timezone.now() + timedelta(days=7),
            lichess_tournament_url='https://lichess.org/tournament/mockrapid',
            status='upcoming'
        )
        Tournament.objects.create(
            title='ChessHub Summer Classical Arena 2026',
            description='Classical tournament for FIDE rating preparation.',
            start_time=timezone.now() - timedelta(days=30),
            lichess_tournament_url='https://lichess.org/tournament/mockclassical',
            status='completed'
        )

        self.stdout.write('Seeding gallery media...')

        # 9. Create Gallery Media
        GalleryImage.objects.create(
            title='Live 1-to-1 Grandmaster Tactics Session',
            category='classes',
            image_url='https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=600&auto=format&fit=crop'
        )
        GalleryImage.objects.create(
            title='National Under-14 Championship Winner',
            category='achievements',
            image_url='https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?q=80&w=600&auto=format&fit=crop'
        )

        self.stdout.write('Seeding demo leads bookings...')

        # 10. Create Demo Bookings
        DemoBooking.objects.create(
            parent_name='Sunita Verma',
            student_name='Vivaan Verma',
            age=9,
            country='India',
            whatsapp_number='+91 91234 56789',
            chess_level='beginner',
            preferred_time='Saturday Morning 10-12 AM',
            status='new'
        )

        self.stdout.write(self.style.SUCCESS('Successfully seeded all initial database objects!'))
