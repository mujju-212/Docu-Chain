"""
Migration script to create document templates table and seed default templates
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models.document_template import DocumentTemplate, GeneratedDocument
from sqlalchemy import text

app = create_app()

# Default system templates - available to all institutions
DEFAULT_TEMPLATES = [
    # Student Templates
    {
        'name': 'Leave Application',
        'description': 'Apply for sick leave, casual leave, or vacation',
        'category': 'student',
        'icon': '📋',
        'color': '#3b82f6',
        'estimated_time': '5 min',
        'fields': [
            {'name': 'leaveType', 'label': 'Leave Type', 'type': 'select', 'options': ['Sick Leave', 'Casual Leave', 'Vacation', 'Emergency Leave', 'Medical Leave'], 'required': True},
            {'name': 'startDate', 'label': 'Start Date', 'type': 'date', 'required': True},
            {'name': 'endDate', 'label': 'End Date', 'type': 'date', 'required': True},
            {'name': 'reason', 'label': 'Reason for Leave', 'type': 'textarea', 'required': True},
            {'name': 'contactNumber', 'label': 'Contact During Leave', 'type': 'tel', 'required': True},
            {'name': 'addressDuringLeave', 'label': 'Address During Leave', 'type': 'textarea', 'required': False}
        ],
        'approval_chain': ['Class Teacher', 'HOD'],
        'is_system': True
    },
    {
        'name': 'Bonafide Certificate',
        'description': 'Request official bonafide certificate for various purposes',
        'category': 'student',
        'icon': '📜',
        'color': '#10b981',
        'estimated_time': '3 min',
        'fields': [
            {'name': 'purpose', 'label': 'Purpose of Certificate', 'type': 'text', 'required': True},
            {'name': 'academicYear', 'label': 'Academic Year', 'type': 'text', 'required': True},
            {'name': 'requiredCopies', 'label': 'Number of Copies Required', 'type': 'number', 'required': True},
            {'name': 'urgency', 'label': 'Urgency', 'type': 'select', 'options': ['Normal', 'Urgent'], 'required': True},
            {'name': 'additionalInfo', 'label': 'Additional Information (if any)', 'type': 'textarea', 'required': False}
        ],
        'approval_chain': ['HOD', 'Registrar'],
        'is_system': True
    },
    {
        'name': 'Transcript Request',
        'description': 'Request official academic transcripts',
        'category': 'student',
        'icon': '📑',
        'color': '#f59e0b',
        'estimated_time': '4 min',
        'fields': [
            {'name': 'transcriptType', 'label': 'Transcript Type', 'type': 'select', 'options': ['Official', 'Unofficial', 'Sealed'], 'required': True},
            {'name': 'purpose', 'label': 'Purpose', 'type': 'text', 'required': True},
            {'name': 'deliveryMethod', 'label': 'Delivery Method', 'type': 'select', 'options': ['Pickup', 'Mail', 'Email'], 'required': True},
            {'name': 'copies', 'label': 'Number of Copies', 'type': 'number', 'required': True},
            {'name': 'mailingAddress', 'label': 'Mailing Address (if applicable)', 'type': 'textarea', 'required': False}
        ],
        'approval_chain': ['Registrar', 'Dean'],
        'is_system': True
    },
    {
        'name': 'Transfer Certificate',
        'description': 'Request transfer certificate for institution change',
        'category': 'student',
        'icon': '🎓',
        'color': '#ef4444',
        'estimated_time': '6 min',
        'fields': [
            {'name': 'lastAttendanceDate', 'label': 'Last Attendance Date', 'type': 'date', 'required': True},
            {'name': 'reasonForTransfer', 'label': 'Reason for Transfer', 'type': 'textarea', 'required': True},
            {'name': 'newInstitution', 'label': 'New Institution Name', 'type': 'text', 'required': True},
            {'name': 'newInstitutionAddress', 'label': 'New Institution Address', 'type': 'textarea', 'required': True},
            {'name': 'parentGuardianName', 'label': 'Parent/Guardian Name', 'type': 'text', 'required': True},
            {'name': 'parentGuardianContact', 'label': 'Parent/Guardian Contact', 'type': 'tel', 'required': True}
        ],
        'approval_chain': ['Class Teacher', 'HOD', 'Principal'],
        'is_system': True
    },
    {
        'name': 'No Objection Certificate',
        'description': 'Request NOC for various purposes like competitions, internships, etc.',
        'category': 'student',
        'icon': '✅',
        'color': '#14b8a6',
        'estimated_time': '4 min',
        'fields': [
            {'name': 'nocPurpose', 'label': 'Purpose of NOC', 'type': 'select', 'options': ['Internship', 'Competition', 'Event Participation', 'Industrial Visit', 'Higher Studies', 'Other'], 'required': True},
            {'name': 'organizationName', 'label': 'Organization/Event Name', 'type': 'text', 'required': True},
            {'name': 'startDate', 'label': 'Start Date', 'type': 'date', 'required': True},
            {'name': 'endDate', 'label': 'End Date', 'type': 'date', 'required': True},
            {'name': 'details', 'label': 'Additional Details', 'type': 'textarea', 'required': True},
            {'name': 'validityPeriod', 'label': 'Validity Period Required', 'type': 'text', 'required': False}
        ],
        'approval_chain': ['HOD', 'Principal'],
        'is_system': True
    },
    {
        'name': 'Character Certificate',
        'description': 'Request character/conduct certificate',
        'category': 'student',
        'icon': '⭐',
        'color': '#8b5cf6',
        'estimated_time': '3 min',
        'fields': [
            {'name': 'purpose', 'label': 'Purpose', 'type': 'text', 'required': True},
            {'name': 'academicYear', 'label': 'Academic Year', 'type': 'text', 'required': True},
            {'name': 'copies', 'label': 'Number of Copies', 'type': 'number', 'required': True}
        ],
        'approval_chain': ['Class Teacher', 'Principal'],
        'is_system': True
    },
    {
        'name': 'Fee Receipt Duplicate',
        'description': 'Request duplicate fee receipt',
        'category': 'student',
        'icon': '💰',
        'color': '#06b6d4',
        'estimated_time': '2 min',
        'fields': [
            {'name': 'semester', 'label': 'Semester/Term', 'type': 'text', 'required': True},
            {'name': 'originalReceiptNumber', 'label': 'Original Receipt Number', 'type': 'text', 'required': True},
            {'name': 'paymentDate', 'label': 'Payment Date', 'type': 'date', 'required': True},
            {'name': 'reasonForDuplicate', 'label': 'Reason for Duplicate Request', 'type': 'textarea', 'required': True}
        ],
        'approval_chain': ['Accounts Officer'],
        'is_system': True
    },
    {
        'name': 'Library Card Application',
        'description': 'Apply for new library card or renewal',
        'category': 'student',
        'icon': '📚',
        'color': '#a855f7',
        'estimated_time': '3 min',
        'fields': [
            {'name': 'cardType', 'label': 'Card Type', 'type': 'select', 'options': ['New', 'Renewal', 'Duplicate'], 'required': True},
            {'name': 'previousCardNumber', 'label': 'Previous Card Number (if applicable)', 'type': 'text', 'required': False},
            {'name': 'email', 'label': 'Email', 'type': 'email', 'required': True},
            {'name': 'phone', 'label': 'Phone Number', 'type': 'tel', 'required': True}
        ],
        'approval_chain': ['Librarian'],
        'is_system': True
    },
    {
        'name': 'Hostel Application',
        'description': 'Apply for hostel accommodation',
        'category': 'student',
        'icon': '🏠',
        'color': '#ec4899',
        'estimated_time': '10 min',
        'fields': [
            {'name': 'roomPreference', 'label': 'Room Type Preference', 'type': 'select', 'options': ['Single', 'Double', 'Triple'], 'required': True},
            {'name': 'duration', 'label': 'Duration (Academic Year/Semester)', 'type': 'text', 'required': True},
            {'name': 'guardianName', 'label': 'Guardian Name', 'type': 'text', 'required': True},
            {'name': 'guardianContact', 'label': 'Guardian Contact', 'type': 'tel', 'required': True},
            {'name': 'guardianRelation', 'label': 'Relation with Guardian', 'type': 'text', 'required': True},
            {'name': 'permanentAddress', 'label': 'Permanent Address', 'type': 'textarea', 'required': True},
            {'name': 'medicalConditions', 'label': 'Any Medical Conditions', 'type': 'textarea', 'required': False},
            {'name': 'specialRequirements', 'label': 'Special Requirements (if any)', 'type': 'textarea', 'required': False}
        ],
        'approval_chain': ['Hostel Warden', 'Dean'],
        'is_system': True
    },
    {
        'name': 'Sports Certificate',
        'description': 'Request sports participation certificate',
        'category': 'student',
        'icon': '⚽',
        'color': '#3b82f6',
        'estimated_time': '4 min',
        'fields': [
            {'name': 'sportName', 'label': 'Sport/Game', 'type': 'text', 'required': True},
            {'name': 'eventName', 'label': 'Event/Tournament Name', 'type': 'text', 'required': True},
            {'name': 'eventLevel', 'label': 'Event Level', 'type': 'select', 'options': ['College', 'Inter-College', 'University', 'State', 'National', 'International'], 'required': True},
            {'name': 'eventDate', 'label': 'Event Date', 'type': 'date', 'required': True},
            {'name': 'achievement', 'label': 'Achievement/Position', 'type': 'text', 'required': True},
            {'name': 'teamOrIndividual', 'label': 'Participation Type', 'type': 'select', 'options': ['Individual', 'Team'], 'required': True}
        ],
        'approval_chain': ['Sports Coordinator', 'Principal'],
        'is_system': True
    },
    
    # Faculty Templates
    {
        'name': 'Research Proposal',
        'description': 'Submit research proposal for approval',
        'category': 'faculty',
        'icon': '🔬',
        'color': '#8b5cf6',
        'estimated_time': '15 min',
        'fields': [
            {'name': 'researchTitle', 'label': 'Research Title', 'type': 'text', 'required': True},
            {'name': 'researchArea', 'label': 'Research Area/Domain', 'type': 'text', 'required': True},
            {'name': 'duration', 'label': 'Duration (months)', 'type': 'number', 'required': True},
            {'name': 'estimatedBudget', 'label': 'Estimated Budget (₹)', 'type': 'number', 'required': True},
            {'name': 'fundingSource', 'label': 'Expected Funding Source', 'type': 'select', 'options': ['Institution', 'Government Grant', 'Industry', 'Self-Funded', 'Other'], 'required': True},
            {'name': 'abstract', 'label': 'Research Abstract', 'type': 'textarea', 'required': True},
            {'name': 'objectives', 'label': 'Research Objectives', 'type': 'textarea', 'required': True},
            {'name': 'methodology', 'label': 'Proposed Methodology', 'type': 'textarea', 'required': True},
            {'name': 'expectedOutcome', 'label': 'Expected Outcomes', 'type': 'textarea', 'required': True},
            {'name': 'coInvestigators', 'label': 'Co-Investigators (if any)', 'type': 'textarea', 'required': False}
        ],
        'approval_chain': ['HOD', 'Dean', 'Research Committee'],
        'is_system': True
    },
    {
        'name': 'Conference Attendance Request',
        'description': 'Request permission to attend conference',
        'category': 'faculty',
        'icon': '🎤',
        'color': '#f59e0b',
        'estimated_time': '8 min',
        'fields': [
            {'name': 'conferenceName', 'label': 'Conference Name', 'type': 'text', 'required': True},
            {'name': 'organizingBody', 'label': 'Organizing Body', 'type': 'text', 'required': True},
            {'name': 'venue', 'label': 'Venue', 'type': 'text', 'required': True},
            {'name': 'startDate', 'label': 'Start Date', 'type': 'date', 'required': True},
            {'name': 'endDate', 'label': 'End Date', 'type': 'date', 'required': True},
            {'name': 'participationType', 'label': 'Participation Type', 'type': 'select', 'options': ['Paper Presentation', 'Attendee', 'Keynote Speaker', 'Session Chair', 'Workshop Conductor'], 'required': True},
            {'name': 'paperTitle', 'label': 'Paper Title (if presenting)', 'type': 'text', 'required': False},
            {'name': 'registrationFee', 'label': 'Registration Fee (₹)', 'type': 'number', 'required': True},
            {'name': 'travelExpenses', 'label': 'Estimated Travel Expenses (₹)', 'type': 'number', 'required': True},
            {'name': 'fundingRequest', 'label': 'Funding Request', 'type': 'select', 'options': ['Full Funding', 'Partial Funding', 'No Funding Required'], 'required': True}
        ],
        'approval_chain': ['HOD', 'Dean'],
        'is_system': True
    },
    {
        'name': 'Faculty Leave Application',
        'description': 'Apply for leave (casual, earned, medical, etc.)',
        'category': 'faculty',
        'icon': '🏖️',
        'color': '#10b981',
        'estimated_time': '5 min',
        'fields': [
            {'name': 'leaveType', 'label': 'Leave Type', 'type': 'select', 'options': ['Casual Leave', 'Earned Leave', 'Medical Leave', 'Maternity Leave', 'Study Leave', 'Sabbatical'], 'required': True},
            {'name': 'startDate', 'label': 'Start Date', 'type': 'date', 'required': True},
            {'name': 'endDate', 'label': 'End Date', 'type': 'date', 'required': True},
            {'name': 'reason', 'label': 'Reason for Leave', 'type': 'textarea', 'required': True},
            {'name': 'substituteArrangement', 'label': 'Substitute Arrangement for Classes', 'type': 'textarea', 'required': True},
            {'name': 'contactDuringLeave', 'label': 'Contact Number During Leave', 'type': 'tel', 'required': True},
            {'name': 'addressDuringLeave', 'label': 'Address During Leave', 'type': 'textarea', 'required': False}
        ],
        'approval_chain': ['HOD', 'Dean', 'Principal'],
        'is_system': True
    },
    {
        'name': 'Workshop/FDP Organization',
        'description': 'Propose to organize workshop or faculty development program',
        'category': 'faculty',
        'icon': '📊',
        'color': '#06b6d4',
        'estimated_time': '12 min',
        'fields': [
            {'name': 'eventType', 'label': 'Event Type', 'type': 'select', 'options': ['Workshop', 'FDP', 'Seminar', 'Webinar', 'Symposium'], 'required': True},
            {'name': 'eventTitle', 'label': 'Event Title', 'type': 'text', 'required': True},
            {'name': 'proposedDate', 'label': 'Proposed Date(s)', 'type': 'text', 'required': True},
            {'name': 'duration', 'label': 'Duration (days)', 'type': 'number', 'required': True},
            {'name': 'targetAudience', 'label': 'Target Audience', 'type': 'text', 'required': True},
            {'name': 'expectedParticipants', 'label': 'Expected Number of Participants', 'type': 'number', 'required': True},
            {'name': 'resourcePersons', 'label': 'Proposed Resource Persons', 'type': 'textarea', 'required': True},
            {'name': 'estimatedBudget', 'label': 'Estimated Budget (₹)', 'type': 'number', 'required': True},
            {'name': 'budgetBreakdown', 'label': 'Budget Breakdown', 'type': 'textarea', 'required': True},
            {'name': 'objectives', 'label': 'Event Objectives', 'type': 'textarea', 'required': True}
        ],
        'approval_chain': ['HOD', 'Dean', 'Principal'],
        'is_system': True
    },
    
    # Admin Templates
    {
        'name': 'Circular/Notice',
        'description': 'Create official circular or notice',
        'category': 'admin',
        'icon': '📢',
        'color': '#ef4444',
        'estimated_time': '5 min',
        'fields': [
            {'name': 'circularType', 'label': 'Circular Type', 'type': 'select', 'options': ['General Notice', 'Academic', 'Administrative', 'Examination', 'Holiday', 'Event'], 'required': True},
            {'name': 'subject', 'label': 'Subject', 'type': 'text', 'required': True},
            {'name': 'targetAudience', 'label': 'Target Audience', 'type': 'select', 'options': ['All', 'Students Only', 'Faculty Only', 'Staff Only', 'Specific Department'], 'required': True},
            {'name': 'effectiveDate', 'label': 'Effective Date', 'type': 'date', 'required': True},
            {'name': 'content', 'label': 'Circular Content', 'type': 'textarea', 'required': True},
            {'name': 'attachmentRequired', 'label': 'Attachment Required', 'type': 'checkbox', 'required': False}
        ],
        'approval_chain': ['Principal'],
        'is_system': True
    },
    {
        'name': 'Budget Request',
        'description': 'Request budget allocation for department/event',
        'category': 'admin',
        'icon': '💵',
        'color': '#10b981',
        'estimated_time': '10 min',
        'fields': [
            {'name': 'budgetCategory', 'label': 'Budget Category', 'type': 'select', 'options': ['Infrastructure', 'Equipment', 'Event', 'Maintenance', 'Training', 'Other'], 'required': True},
            {'name': 'purpose', 'label': 'Purpose', 'type': 'text', 'required': True},
            {'name': 'requestedAmount', 'label': 'Requested Amount (₹)', 'type': 'number', 'required': True},
            {'name': 'justification', 'label': 'Justification', 'type': 'textarea', 'required': True},
            {'name': 'breakdown', 'label': 'Cost Breakdown', 'type': 'textarea', 'required': True},
            {'name': 'timeline', 'label': 'Expected Timeline', 'type': 'text', 'required': True},
            {'name': 'vendorQuotes', 'label': 'Vendor Quotations (if applicable)', 'type': 'textarea', 'required': False}
        ],
        'approval_chain': ['HOD', 'Finance Officer', 'Principal'],
        'is_system': True
    },
    {
        'name': 'Infrastructure Request',
        'description': 'Request for infrastructure or facility maintenance',
        'category': 'admin',
        'icon': '🏗️',
        'color': '#f59e0b',
        'estimated_time': '6 min',
        'fields': [
            {'name': 'requestType', 'label': 'Request Type', 'type': 'select', 'options': ['New Installation', 'Repair', 'Maintenance', 'Upgrade', 'Replacement'], 'required': True},
            {'name': 'location', 'label': 'Location/Room', 'type': 'text', 'required': True},
            {'name': 'description', 'label': 'Description of Work Required', 'type': 'textarea', 'required': True},
            {'name': 'urgency', 'label': 'Urgency Level', 'type': 'select', 'options': ['Low', 'Medium', 'High', 'Critical'], 'required': True},
            {'name': 'estimatedCost', 'label': 'Estimated Cost (if known)', 'type': 'number', 'required': False},
            {'name': 'preferredTimeline', 'label': 'Preferred Timeline', 'type': 'text', 'required': True}
        ],
        'approval_chain': ['Estate Officer', 'Principal'],
        'is_system': True
    }
]


def create_tables():
    """Create the document_templates and generated_documents tables"""
    with app.app_context():
        # Create tables
        db.create_all()
        print("✅ Tables created successfully")


def seed_default_templates():
    """Seed default system templates"""
    with app.app_context():
        # Check if templates already exist
        existing = DocumentTemplate.query.filter_by(is_system=True).count()
        if existing > 0:
            print(f"⚠️  {existing} system templates already exist. Skipping seeding.")
            return
        
        for template_data in DEFAULT_TEMPLATES:
            template = DocumentTemplate(
                name=template_data['name'],
                description=template_data['description'],
                category=template_data['category'],
                icon=template_data['icon'],
                color=template_data['color'],
                estimated_time=template_data['estimated_time'],
                fields=template_data['fields'],
                approval_chain=template_data['approval_chain'],
                institution_id=None,  # System templates are global
                is_system=True,
                is_active=True
            )
            db.session.add(template)
        
        db.session.commit()
        print(f"✅ Seeded {len(DEFAULT_TEMPLATES)} default templates successfully")


def list_templates():
    """List all templates"""
    with app.app_context():
        templates = DocumentTemplate.query.all()
        print(f"\n📄 Total Templates: {len(templates)}\n")
        for t in templates:
            print(f"  • {t.name} ({t.category}) - {'System' if t.is_system else 'Custom'}")


if __name__ == '__main__':
    print("🚀 Document Template Migration")
    print("=" * 40)
    
    create_tables()
    seed_default_templates()
    list_templates()
    
    print("\n✅ Migration completed!")
