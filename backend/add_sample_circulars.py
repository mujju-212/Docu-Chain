"""
Add sample circular announcements for Mumbai University
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.user import User
from app.models.chat import Conversation, ConversationMember, Message
from datetime import datetime, timedelta
import uuid

app = create_app()

def add_sample_circulars():
    with app.app_context():
        # Find Mumbai University institution
        from app.models.institution import Institution
        
        mumbai_uni = Institution.query.filter(
            Institution.name.ilike('%mumbai%')
        ).first()
        
        if not mumbai_uni:
            print("Mumbai University not found. Creating it...")
            mumbai_uni = Institution(
                id=uuid.uuid4(),
                name="Mumbai University",
                code="MU",
                type="university",
                address="Mumbai, Maharashtra, India"
            )
            db.session.add(mumbai_uni)
            db.session.commit()
            print(f"Created Mumbai University with ID: {mumbai_uni.id}")
        else:
            print(f"Found Mumbai University: {mumbai_uni.name} (ID: {mumbai_uni.id})")
        
        # Find admin user for Mumbai University
        admin_user = User.query.filter_by(
            institution_id=mumbai_uni.id,
            role='admin'
        ).first()
        
        if not admin_user:
            # Find any admin
            admin_user = User.query.filter_by(role='admin').first()
            
        if not admin_user:
            print("No admin user found! Creating a default admin...")
            admin_user = User(
                id=uuid.uuid4(),
                email='admin@mumbai.edu',
                first_name='Dr. Rajesh',
                last_name='Kumar',
                role='admin',
                institution_id=mumbai_uni.id,
                is_active=True
            )
            admin_user.set_password('admin123')
            db.session.add(admin_user)
            db.session.commit()
            print(f"Created admin: {admin_user.email}")
        else:
            print(f"Using admin: {admin_user.email} ({admin_user.first_name} {admin_user.last_name})")
        
        # Check if circular channel exists
        circular_channel = Conversation.query.filter_by(
            type='circular',
            institution_id=mumbai_uni.id
        ).first()
        
        if not circular_channel:
            print("Creating circular channel...")
            circular_channel = Conversation(
                id=uuid.uuid4(),
                type='circular',
                name='Mumbai University Announcements',
                description='Official announcements from Mumbai University administration',
                created_by=admin_user.id,
                institution_id=mumbai_uni.id,
                avatar='📢',
                created_at=datetime.utcnow() - timedelta(days=30)
            )
            db.session.add(circular_channel)
            db.session.commit()
            
            # Add admin as member
            member = ConversationMember(
                id=uuid.uuid4(),
                conversation_id=circular_channel.id,
                user_id=admin_user.id,
                role='admin'
            )
            db.session.add(member)
            db.session.commit()
            print(f"Created circular channel: {circular_channel.name}")
        else:
            print(f"Using existing circular channel: {circular_channel.name}")
        
        # Sample announcements to add
        sample_announcements = [
            {
                'content': '''📚 IMPORTANT NOTICE: Winter Semester Examinations 2025

All students are hereby informed that the Winter Semester Examinations will commence from December 15, 2025.

📅 Key Dates:
• Admit Card Distribution: December 8-10, 2025
• Practical Exams: December 12-14, 2025
• Theory Exams: December 15-28, 2025
• Result Declaration: January 15, 2026

📍 Exam Centers will be displayed on the university notice board and website.

All the best to all students! 🎓''',
                'days_ago': 0,
                'hours_ago': 2
            },
            {
                'content': '''🎉 Annual Cultural Festival "UTSAV 2025" Registration Open!

Mumbai University presents the biggest cultural festival of the year - UTSAV 2025!

🗓️ Festival Dates: December 20-22, 2025
📍 Venue: University Main Campus

Events Include:
🎤 Singing Competition
💃 Dance Championship  
🎭 Drama & Theatrical Performances
🎨 Art & Painting Exhibition
📸 Photography Contest
🎮 Gaming Tournament

Registration Deadline: December 10, 2025
Register at: events.mumbai.edu/utsav2025

Let's celebrate together! 🎊''',
                'days_ago': 1,
                'hours_ago': 5
            },
            {
                'content': '''📖 Library Hours Extended for Exam Preparation

Dear Students,

The Central Library will now operate with extended hours to support your exam preparation:

📅 December 1 - December 28, 2025
⏰ New Timings: 7:00 AM - 11:00 PM (Daily)

Additional Facilities:
• 24/7 Reading Room Access (Ground Floor)
• Extended Wi-Fi Hours
• Additional Study Cubicles Available
• Free Printing for Study Materials (50 pages/day)

Library Card is mandatory for entry. 
Lost cards can be replaced at the Admin Office.

Happy Studying! 📚''',
                'days_ago': 2,
                'hours_ago': 10
            },
            {
                'content': '''🏆 Congratulations to Our Sports Champions!

We are proud to announce that Mumbai University has secured the following positions in the Inter-University Sports Championship 2025:

🥇 Cricket - 1st Place
🥈 Football - 2nd Place  
🥉 Basketball - 3rd Place
🥇 Badminton (Women) - 1st Place
🥈 Table Tennis - 2nd Place

Special recognition to:
• Rahul Sharma - Best Player Award (Cricket)
• Priya Patel - Most Valuable Player (Badminton)

A felicitation ceremony will be held on December 5, 2025 at 4:00 PM in the University Auditorium.

All students and faculty are invited! 🎊''',
                'days_ago': 3,
                'hours_ago': 8
            },
            {
                'content': '''🔔 Important: Scholarship Application Deadline Extended

Good news for students applying for Merit-cum-Means Scholarships!

The deadline has been extended to December 12, 2025.

Eligibility:
• Students with 60%+ in previous examination
• Annual family income below ₹8,00,000
• Good academic standing with no disciplinary issues

Documents Required:
📄 Income Certificate
📄 Previous Marksheets
📄 Domicile Certificate  
📄 Caste Certificate (if applicable)
📄 Bank Account Details

Apply online at: scholarships.mumbai.edu

For queries: scholarship.office@mumbai.edu''',
                'days_ago': 4,
                'hours_ago': 3
            },
            {
                'content': '''🌐 New Digital Learning Portal Launched!

Mumbai University is excited to announce the launch of our new Digital Learning Portal - "MU Learn"

Features:
📹 Video Lectures from Top Faculty
📚 E-Books and Study Materials
📝 Practice Tests and Quizzes
💬 Discussion Forums
📊 Progress Tracking

Access: learn.mumbai.edu
Login: Use your university email ID

Available on:
• Web Browser
• Android App (Play Store)
• iOS App (App Store)

Start learning today! 🚀''',
                'days_ago': 5,
                'hours_ago': 6
            },
            {
                'content': '''🏥 Free Health Check-up Camp

The University Health Center in collaboration with Apollo Hospital is organizing a FREE Health Check-up Camp for all students and staff.

📅 Date: December 8, 2025
⏰ Time: 9:00 AM - 4:00 PM
📍 Venue: University Sports Complex

Tests Available:
• Blood Sugar Test
• Blood Pressure Check
• Eye Examination
• Dental Check-up
• BMI Assessment
• General Health Consultation

No prior registration required. Bring your University ID Card.

Your health matters! 💪''',
                'days_ago': 6,
                'hours_ago': 12
            }
        ]
        
        # Add announcements
        messages_added = 0
        for announcement in sample_announcements:
            # Calculate timestamp
            timestamp = datetime.utcnow() - timedelta(
                days=announcement['days_ago'],
                hours=announcement['hours_ago']
            )
            
            # Check if similar message exists (avoid duplicates)
            existing = Message.query.filter_by(
                conversation_id=circular_channel.id,
                content=announcement['content']
            ).first()
            
            if existing:
                print(f"Skipping duplicate announcement from {announcement['days_ago']} days ago")
                continue
            
            message = Message(
                id=uuid.uuid4(),
                conversation_id=circular_channel.id,
                sender_id=admin_user.id,
                content=announcement['content'],
                message_type='circular_post',
                created_at=timestamp,
                status='sent'
            )
            db.session.add(message)
            messages_added += 1
            print(f"Added announcement from {announcement['days_ago']} days ago")
        
        # Update last_message_at on circular channel
        if messages_added > 0:
            circular_channel.last_message_at = datetime.utcnow()
            db.session.commit()
        
        print(f"\n✅ Successfully added {messages_added} announcements to '{circular_channel.name}'")
        print(f"   Circular Channel ID: {circular_channel.id}")
        print(f"   Institution: {mumbai_uni.name}")
        print(f"   Admin: {admin_user.first_name} {admin_user.last_name}")

if __name__ == '__main__':
    add_sample_circulars()
