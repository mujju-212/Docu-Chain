"""
Update document templates with proper form fields
"""
import psycopg2
import json
from config import Config

def update_template_fields():
    """Add proper fields to all document templates"""
    
    conn = psycopg2.connect(Config.SQLALCHEMY_DATABASE_URI)
    cur = conn.cursor()
    
    # Define fields for each template (matching actual database names)
    template_fields = {
        # Student Templates
        'Certificate Request': [
            {'name': 'studentName', 'label': 'Student Name', 'type': 'text', 'required': True},
            {'name': 'rollNumber', 'label': 'Roll Number', 'type': 'text', 'required': True},
            {'name': 'course', 'label': 'Course/Program', 'type': 'text', 'required': True},
            {'name': 'semester', 'label': 'Semester/Year', 'type': 'text', 'required': True},
            {'name': 'certificateType', 'label': 'Certificate Type', 'type': 'select', 'required': True, 
             'options': ['Bonafide Certificate', 'Character Certificate', 'Course Completion', 'Migration Certificate', 'Other']},
            {'name': 'purpose', 'label': 'Purpose of Certificate', 'type': 'textarea', 'required': True},
            {'name': 'additionalRemarks', 'label': 'Additional Remarks', 'type': 'textarea', 'required': False}
        ],
        'Bonafide Certificate': [
            {'name': 'studentName', 'label': 'Student Name', 'type': 'text', 'required': True},
            {'name': 'rollNumber', 'label': 'Roll Number', 'type': 'text', 'required': True},
            {'name': 'fatherName', 'label': "Father's Name", 'type': 'text', 'required': True},
            {'name': 'course', 'label': 'Course/Program', 'type': 'text', 'required': True},
            {'name': 'admissionYear', 'label': 'Year of Admission', 'type': 'text', 'required': True},
            {'name': 'currentSemester', 'label': 'Current Semester', 'type': 'text', 'required': True},
            {'name': 'purpose', 'label': 'Purpose of Certificate', 'type': 'select', 'required': True,
             'options': ['Bank Loan', 'Passport Application', 'Visa Application', 'Scholarship', 'Government ID', 'Other']},
            {'name': 'additionalDetails', 'label': 'Additional Details', 'type': 'textarea', 'required': False}
        ],
        'Transfer Certificate': [
            {'name': 'studentName', 'label': 'Student Name', 'type': 'text', 'required': True},
            {'name': 'rollNumber', 'label': 'Roll Number', 'type': 'text', 'required': True},
            {'name': 'fatherName', 'label': "Father's Name", 'type': 'text', 'required': True},
            {'name': 'dateOfBirth', 'label': 'Date of Birth', 'type': 'date', 'required': True},
            {'name': 'course', 'label': 'Course/Program', 'type': 'text', 'required': True},
            {'name': 'admissionDate', 'label': 'Date of Admission', 'type': 'date', 'required': True},
            {'name': 'leavingDate', 'label': 'Date of Leaving', 'type': 'date', 'required': True},
            {'name': 'reason', 'label': 'Reason for Transfer', 'type': 'textarea', 'required': True},
            {'name': 'duesCleared', 'label': 'All Dues Cleared', 'type': 'select', 'required': True, 'options': ['Yes', 'No', 'Pending']}
        ],
        'No Objection Certificate': [
            {'name': 'studentName', 'label': 'Student Name', 'type': 'text', 'required': True},
            {'name': 'rollNumber', 'label': 'Roll Number', 'type': 'text', 'required': True},
            {'name': 'course', 'label': 'Course/Program', 'type': 'text', 'required': True},
            {'name': 'semester', 'label': 'Current Semester', 'type': 'text', 'required': True},
            {'name': 'nocPurpose', 'label': 'Purpose of NOC', 'type': 'select', 'required': True,
             'options': ['Part-time Job', 'Internship', 'Higher Studies', 'Competition/Event', 'Research Work', 'Other']},
            {'name': 'organizationName', 'label': 'Organization/Institution Name', 'type': 'text', 'required': True},
            {'name': 'duration', 'label': 'Duration', 'type': 'text', 'required': True},
            {'name': 'details', 'label': 'Additional Details', 'type': 'textarea', 'required': False}
        ],
        'Character Certificate': [
            {'name': 'studentName', 'label': 'Student Name', 'type': 'text', 'required': True},
            {'name': 'rollNumber', 'label': 'Roll Number', 'type': 'text', 'required': True},
            {'name': 'fatherName', 'label': "Father's Name", 'type': 'text', 'required': True},
            {'name': 'course', 'label': 'Course/Program', 'type': 'text', 'required': True},
            {'name': 'admissionYear', 'label': 'Year of Admission', 'type': 'text', 'required': True},
            {'name': 'completionYear', 'label': 'Year of Completion', 'type': 'text', 'required': True},
            {'name': 'purpose', 'label': 'Purpose', 'type': 'textarea', 'required': True}
        ],
        'Fee Receipt Duplicate': [
            {'name': 'studentName', 'label': 'Student Name', 'type': 'text', 'required': True},
            {'name': 'rollNumber', 'label': 'Roll Number', 'type': 'text', 'required': True},
            {'name': 'course', 'label': 'Course/Program', 'type': 'text', 'required': True},
            {'name': 'semester', 'label': 'Semester', 'type': 'text', 'required': True},
            {'name': 'receiptNumber', 'label': 'Original Receipt Number', 'type': 'text', 'required': True},
            {'name': 'receiptDate', 'label': 'Original Receipt Date', 'type': 'date', 'required': True},
            {'name': 'amount', 'label': 'Amount Paid', 'type': 'text', 'required': True},
            {'name': 'reason', 'label': 'Reason for Duplicate', 'type': 'select', 'required': True,
             'options': ['Lost', 'Damaged', 'Submission Requirement', 'Other']}
        ],
        'Library Card Application': [
            {'name': 'studentName', 'label': 'Student Name', 'type': 'text', 'required': True},
            {'name': 'rollNumber', 'label': 'Roll Number', 'type': 'text', 'required': True},
            {'name': 'course', 'label': 'Course/Program', 'type': 'text', 'required': True},
            {'name': 'semester', 'label': 'Semester', 'type': 'text', 'required': True},
            {'name': 'cardType', 'label': 'Card Type', 'type': 'select', 'required': True,
             'options': ['New Card', 'Renewal', 'Duplicate (Lost)', 'Duplicate (Damaged)']},
            {'name': 'validityPeriod', 'label': 'Validity Period', 'type': 'select', 'required': True,
             'options': ['1 Year', '2 Years', 'Till Course Completion']}
        ],
        'Sports Certificate': [
            {'name': 'studentName', 'label': 'Student Name', 'type': 'text', 'required': True},
            {'name': 'rollNumber', 'label': 'Roll Number', 'type': 'text', 'required': True},
            {'name': 'course', 'label': 'Course/Program', 'type': 'text', 'required': True},
            {'name': 'sportName', 'label': 'Sport/Game', 'type': 'text', 'required': True},
            {'name': 'eventName', 'label': 'Event/Competition Name', 'type': 'text', 'required': True},
            {'name': 'eventLevel', 'label': 'Level', 'type': 'select', 'required': True,
             'options': ['Inter-class', 'Inter-department', 'Inter-college', 'University', 'State', 'National', 'International']},
            {'name': 'eventDate', 'label': 'Event Date', 'type': 'date', 'required': True},
            {'name': 'position', 'label': 'Position/Award', 'type': 'text', 'required': True}
        ],
        'Leave Application': [
            {'name': 'studentName', 'label': 'Student Name', 'type': 'text', 'required': True},
            {'name': 'rollNumber', 'label': 'Roll Number', 'type': 'text', 'required': True},
            {'name': 'course', 'label': 'Course/Class', 'type': 'text', 'required': True},
            {'name': 'leaveType', 'label': 'Leave Type', 'type': 'select', 'required': True,
             'options': ['Sick Leave', 'Personal Leave', 'Family Emergency', 'Medical Leave', 'Other']},
            {'name': 'fromDate', 'label': 'From Date', 'type': 'date', 'required': True},
            {'name': 'toDate', 'label': 'To Date', 'type': 'date', 'required': True},
            {'name': 'reason', 'label': 'Reason for Leave', 'type': 'textarea', 'required': True},
            {'name': 'contactNumber', 'label': 'Contact Number', 'type': 'text', 'required': True}
        ],
        'Hostel Application': [
            {'name': 'studentName', 'label': 'Student Name', 'type': 'text', 'required': True},
            {'name': 'rollNumber', 'label': 'Roll Number', 'type': 'text', 'required': True},
            {'name': 'course', 'label': 'Course/Program', 'type': 'text', 'required': True},
            {'name': 'semester', 'label': 'Semester/Year', 'type': 'text', 'required': True},
            {'name': 'parentName', 'label': 'Parent/Guardian Name', 'type': 'text', 'required': True},
            {'name': 'parentContact', 'label': 'Parent Contact Number', 'type': 'text', 'required': True},
            {'name': 'permanentAddress', 'label': 'Permanent Address', 'type': 'textarea', 'required': True},
            {'name': 'roomType', 'label': 'Room Preference', 'type': 'select', 'required': True,
             'options': ['Single Occupancy', 'Double Sharing', 'Triple Sharing', 'No Preference']},
            {'name': 'specialRequirements', 'label': 'Special Requirements', 'type': 'textarea', 'required': False}
        ],
        'Transcript Request': [
            {'name': 'studentName', 'label': 'Student Name', 'type': 'text', 'required': True},
            {'name': 'rollNumber', 'label': 'Roll Number', 'type': 'text', 'required': True},
            {'name': 'course', 'label': 'Course/Program', 'type': 'text', 'required': True},
            {'name': 'admissionYear', 'label': 'Year of Admission', 'type': 'text', 'required': True},
            {'name': 'graduationYear', 'label': 'Year of Graduation', 'type': 'text', 'required': True},
            {'name': 'transcriptType', 'label': 'Transcript Type', 'type': 'select', 'required': True,
             'options': ['Complete Transcript', 'Semester-wise', 'Consolidated Marksheet']},
            {'name': 'numberOfCopies', 'label': 'Number of Copies', 'type': 'select', 'required': True,
             'options': ['1', '2', '3', '4', '5']},
            {'name': 'purpose', 'label': 'Purpose', 'type': 'textarea', 'required': True}
        ],
        # Faculty Templates
        'Research Proposal': [
            {'name': 'facultyName', 'label': 'Faculty Name', 'type': 'text', 'required': True},
            {'name': 'employeeId', 'label': 'Employee ID', 'type': 'text', 'required': True},
            {'name': 'department', 'label': 'Department', 'type': 'text', 'required': True},
            {'name': 'designation', 'label': 'Designation', 'type': 'text', 'required': True},
            {'name': 'projectTitle', 'label': 'Research Project Title', 'type': 'text', 'required': True},
            {'name': 'fundingAmount', 'label': 'Funding Amount Requested', 'type': 'text', 'required': True},
            {'name': 'projectDuration', 'label': 'Project Duration', 'type': 'text', 'required': True},
            {'name': 'projectSummary', 'label': 'Project Summary', 'type': 'textarea', 'required': True},
            {'name': 'expectedOutcomes', 'label': 'Expected Outcomes', 'type': 'textarea', 'required': True}
        ],
        'Conference Attendance Request': [
            {'name': 'facultyName', 'label': 'Faculty Name', 'type': 'text', 'required': True},
            {'name': 'employeeId', 'label': 'Employee ID', 'type': 'text', 'required': True},
            {'name': 'department', 'label': 'Department', 'type': 'text', 'required': True},
            {'name': 'conferenceName', 'label': 'Conference Name', 'type': 'text', 'required': True},
            {'name': 'conferenceVenue', 'label': 'Conference Venue', 'type': 'text', 'required': True},
            {'name': 'conferenceDate', 'label': 'Conference Date', 'type': 'date', 'required': True},
            {'name': 'paperTitle', 'label': 'Paper Title (if presenting)', 'type': 'text', 'required': False},
            {'name': 'registrationFee', 'label': 'Registration Fee', 'type': 'text', 'required': True},
            {'name': 'totalFunding', 'label': 'Total Funding Requested', 'type': 'text', 'required': True},
            {'name': 'justification', 'label': 'Justification', 'type': 'textarea', 'required': True}
        ],
        'Faculty Leave Application': [
            {'name': 'facultyName', 'label': 'Faculty Name', 'type': 'text', 'required': True},
            {'name': 'employeeId', 'label': 'Employee ID', 'type': 'text', 'required': True},
            {'name': 'department', 'label': 'Department', 'type': 'text', 'required': True},
            {'name': 'leaveType', 'label': 'Leave Type', 'type': 'select', 'required': True,
             'options': ['Casual Leave', 'Medical Leave', 'Earned Leave', 'Study Leave', 'Sabbatical', 'Other']},
            {'name': 'fromDate', 'label': 'From Date', 'type': 'date', 'required': True},
            {'name': 'toDate', 'label': 'To Date', 'type': 'date', 'required': True},
            {'name': 'reason', 'label': 'Reason for Leave', 'type': 'textarea', 'required': True},
            {'name': 'classArrangement', 'label': 'Class Adjustment Arrangement', 'type': 'textarea', 'required': True}
        ],
        'Workshop/FDP Organization': [
            {'name': 'facultyName', 'label': 'Organizing Faculty Name', 'type': 'text', 'required': True},
            {'name': 'employeeId', 'label': 'Employee ID', 'type': 'text', 'required': True},
            {'name': 'department', 'label': 'Department', 'type': 'text', 'required': True},
            {'name': 'eventTitle', 'label': 'Workshop/FDP Title', 'type': 'text', 'required': True},
            {'name': 'eventType', 'label': 'Event Type', 'type': 'select', 'required': True,
             'options': ['Workshop', 'FDP', 'Seminar', 'Webinar', 'Hands-on Training']},
            {'name': 'eventDate', 'label': 'Event Date', 'type': 'date', 'required': True},
            {'name': 'duration', 'label': 'Duration (Days)', 'type': 'text', 'required': True},
            {'name': 'expectedParticipants', 'label': 'Expected Participants', 'type': 'text', 'required': True},
            {'name': 'budgetRequired', 'label': 'Budget Required', 'type': 'text', 'required': True},
            {'name': 'description', 'label': 'Event Description', 'type': 'textarea', 'required': True}
        ],
        # Admin Templates
        'Circular/Notice': [
            {'name': 'issuerName', 'label': 'Issued By', 'type': 'text', 'required': True},
            {'name': 'department', 'label': 'Department', 'type': 'text', 'required': True},
            {'name': 'circularType', 'label': 'Circular Type', 'type': 'select', 'required': True,
             'options': ['General Notice', 'Academic', 'Administrative', 'Holiday', 'Event', 'Urgent']},
            {'name': 'subject', 'label': 'Subject', 'type': 'text', 'required': True},
            {'name': 'content', 'label': 'Circular Content', 'type': 'textarea', 'required': True},
            {'name': 'effectiveDate', 'label': 'Effective Date', 'type': 'date', 'required': True},
            {'name': 'targetAudience', 'label': 'Target Audience', 'type': 'select', 'required': True,
             'options': ['All Staff', 'All Students', 'All Faculty', 'Specific Department', 'Everyone']}
        ],
        'Budget Request': [
            {'name': 'requesterName', 'label': 'Requester Name', 'type': 'text', 'required': True},
            {'name': 'department', 'label': 'Department', 'type': 'text', 'required': True},
            {'name': 'budgetCategory', 'label': 'Budget Category', 'type': 'select', 'required': True,
             'options': ['Infrastructure', 'Equipment', 'Events', 'Travel', 'Research', 'Maintenance', 'Other']},
            {'name': 'budgetAmount', 'label': 'Budget Amount', 'type': 'text', 'required': True},
            {'name': 'fiscalYear', 'label': 'Fiscal Year', 'type': 'text', 'required': True},
            {'name': 'purpose', 'label': 'Purpose/Description', 'type': 'textarea', 'required': True},
            {'name': 'breakdown', 'label': 'Budget Breakdown', 'type': 'textarea', 'required': True}
        ],
        'Infrastructure Request': [
            {'name': 'requesterName', 'label': 'Requester Name', 'type': 'text', 'required': True},
            {'name': 'department', 'label': 'Department', 'type': 'text', 'required': True},
            {'name': 'requestType', 'label': 'Request Type', 'type': 'select', 'required': True,
             'options': ['New Construction', 'Renovation', 'Repair', 'Equipment Installation', 'Furniture', 'Other']},
            {'name': 'location', 'label': 'Location/Building', 'type': 'text', 'required': True},
            {'name': 'description', 'label': 'Detailed Description', 'type': 'textarea', 'required': True},
            {'name': 'estimatedCost', 'label': 'Estimated Cost', 'type': 'text', 'required': True},
            {'name': 'urgency', 'label': 'Urgency Level', 'type': 'select', 'required': True,
             'options': ['Low', 'Medium', 'High', 'Urgent']},
            {'name': 'justification', 'label': 'Justification', 'type': 'textarea', 'required': True}
        ]
    }
    
    try:
        for template_name, fields in template_fields.items():
            cur.execute("""
                UPDATE document_templates 
                SET fields = %s 
                WHERE name = %s
            """, (json.dumps(fields), template_name))
            
            if cur.rowcount > 0:
                print(f"Updated: {template_name}")
            else:
                print(f"Not found: {template_name}")
        
        conn.commit()
        print("\nTemplate fields update complete!")
        
    except Exception as e:
        conn.rollback()
        print(f"Error: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    update_template_fields()
