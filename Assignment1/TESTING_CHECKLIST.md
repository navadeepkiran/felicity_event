# Testing Checklist for Felicity Event Management System

Use this checklist to verify all features are working correctly before submission.

## ✅ Setup Verification

- [ ] Node.js installed (v18+)
- [ ] Backend `npm install` completed successfully
- [ ] Frontend `npm install` completed successfully
- [ ] MongoDB Atlas cluster created and connected
- [ ] `.env` file created in backend with all variables
- [ ] Admin seed script executed successfully
- [ ] Backend server running on port 5000
- [ ] Frontend dev server running on port 3000
- [ ] No console errors on startup

## 🔐 Authentication & Security [8 Marks]

### Registration
- [ ] Participant can register with IIIT email (@iiit.ac.in)
- [ ] Participant can register with Non-IIIT email
- [ ] IIIT email validation works (rejects non-IIIT email for IIIT type)
- [ ] Password is at least 6 characters
- [ ] Duplicate email registration is prevented
- [ ] Registration redirects to participant dashboard

### Login
- [ ] Participant can login with correct credentials
- [ ] Organizer can login with admin-provided credentials
- [ ] Admin can login with seeded credentials
- [ ] Wrong credentials show error message
- [ ] Login redirects to appropriate dashboard based on role

### Security
- [ ] Passwords are not visible in database (check MongoDB)
- [ ] JWT token is stored in localStorage
- [ ] Protected routes redirect to login if not authenticated
- [ ] Role-based access works (participant can't access organizer routes)
- [ ] Logout clears token and redirects to login

### Session Management
- [ ] Session persists after browser refresh
- [ ] Session persists after browser close and reopen
- [ ] Logout clears session completely

## 👤 Participant Features [22 Marks]

### Dashboard
- [ ] Dashboard shows upcoming events
- [ ] Dashboard shows completed events
- [ ] Dashboard shows cancelled events
- [ ] Can switch between tabs
- [ ] Event cards show correct information
- [ ] Ticket ID is displayed
- [ ] Can click to view event details

### Browse Events
- [ ] Can view all published events
- [ ] Search by event name works
- [ ] Search by description works
- [ ] Filter by event type (normal/merchandise)
- [ ] Filter by eligibility (all/iiit-only/non-iiit-only)
- [ ] Date range filter works
- [ ] "Followed Clubs Only" filter works
- [ ] "Trending" shows top 5 recent registrations
- [ ] Event cards show correct status

### Event Details
- [ ] Event details page shows complete information
- [ ] Registration button appears for eligible events
- [ ] Registration button hidden after registration
- [ ] Custom form fields appear (if event has custom form)
- [ ] Can fill and submit registration form
- [ ] Registration deadline is enforced
- [ ] Registration limit is enforced
- [ ] Eligibility restrictions work

### Event Registration
- [ ] Can register for normal event
- [ ] Can register for merchandise event
- [ ] Required form fields are validated
- [ ] Registration generates unique ticket ID
- [ ] QR code is generated
- [ ] Confirmation email is sent
- [ ] Email contains ticket ID and QR code
- [ ] Ticket appears in dashboard after registration
- [ ] Cannot register twice for same event

### Clubs/Organizers
- [ ] Can view list of all clubs
- [ ] Can follow a club
- [ ] Can unfollow a club
- [ ] Can view club details page
- [ ] Club details show upcoming events
- [ ] Club details show past events
- [ ] Follow status persists

### Profile
- [ ] Can view profile information
- [ ] Can edit first name
- [ ] Can edit last name
- [ ] Can edit contact number
- [ ] Can edit college name
- [ ] Can update interests
- [ ] Can update followed clubs
- [ ] Email is non-editable
- [ ] Participant type is non-editable
- [ ] Changes are saved correctly

## 🏢 Organizer Features [18 Marks]

### Dashboard
- [ ] Shows total events count
- [ ] Shows total registrations
- [ ] Shows total revenue
- [ ] Shows total attendance
- [ ] Lists all organizer's events
- [ ] Events show correct status badge
- [ ] Can navigate to event details

### Event Creation
- [ ] Can create draft event with all required fields
- [ ] Event name is required
- [ ] Description is required
- [ ] Can select event type (normal/merchandise)
- [ ] Can set eligibility
- [ ] Can set registration deadline
- [ ] Can set start and end dates
- [ ] Can set registration limit
- [ ] Can set registration fee
- [ ] Can add event tags
- [ ] Event is created in draft status

### Event Management
- [ ] Can view event details
- [ ] Can see list of registered participants
- [ ] Can publish draft event
- [ ] Can edit published event (limited fields)
- [ ] Cannot edit ongoing/completed event details
- [ ] Can change event status
- [ ] Form is locked after first registration (for normal events)

### Custom Form Builder
- [ ] Can add text fields
- [ ] Can add email fields
- [ ] Can add number fields
- [ ] Can add textarea
- [ ] Can add dropdown with options
- [ ] Can add checkbox
- [ ] Can mark fields as required
- [ ] Can reorder fields
- [ ] Form saves correctly

### Participant Management
- [ ] Participant list shows all registrations
- [ ] Shows participant name and email
- [ ] Shows ticket ID
- [ ] Shows registration date
- [ ] Shows payment status
- [ ] Shows attendance status
- [ ] Can search participants
- [ ] Can export to CSV
- [ ] CSV contains all participant data

### Analytics
- [ ] Shows registration count
- [ ] Shows revenue calculation
- [ ] Shows attendance count
- [ ] Shows attendance rate percentage
- [ ] Analytics update in real-time

### Profile
- [ ] Can view organizer profile
- [ ] Can edit organizer name
- [ ] Can edit category
- [ ] Can edit description
- [ ] Can edit contact email
- [ ] Can add/update Discord webhook
- [ ] Login email is non-editable
- [ ] Changes save correctly

## 👑 Admin Features [6 Marks]

### Dashboard
- [ ] Shows total clubs count
- [ ] Shows active clubs count
- [ ] Shows inactive clubs count
- [ ] Shows total participants count

### Club Management
- [ ] Can view list of all clubs
- [ ] Can create new club/organizer
- [ ] Auto-generates email in format: `name@felicity.org`
- [ ] Auto-generates random password
- [ ] Displays generated credentials
- [ ] Can activate/deactivate club
- [ ] Can reset club password
- [ ] New password is auto-generated and displayed
- [ ] Inactive clubs cannot login

## 🎫 Ticket & QR System [5 Marks]

- [ ] Ticket ID is unique for each registration
- [ ] QR code is generated successfully
- [ ] QR code contains correct data (ticket ID, event ID, participant ID)
- [ ] QR code is embedded in email
- [ ] QR code is visible and scannable
- [ ] Ticket includes event details
- [ ] Ticket includes participant details

## 📧 Email Integration [5 Marks]

- [ ] Email server configured correctly
- [ ] Registration confirmation email is sent
- [ ] Email contains ticket information
- [ ] Email contains QR code image
- [ ] Email has proper formatting
- [ ] Email includes event details
- [ ] Email subject is descriptive
- [ ] Email is delivered successfully

## 🔄 Role-Based Access Control [5 Marks]

- [ ] Unauthenticated users redirected to login
- [ ] Participants cannot access organizer routes
- [ ] Participants cannot access admin routes
- [ ] Organizers cannot access admin routes
- [ ] Organizers cannot access participant routes
- [ ] Admin cannot access participant routes
- [ ] Admin cannot access organizer routes
- [ ] Each role has appropriate navbar
- [ ] Dashboard route redirects based on role

## 📊 Additional Features to Test

### Data Validation
- [ ] Email format validation
- [ ] Phone number validation
- [ ] Date validation (end date after start date)
- [ ] Deadline before event start date
- [ ] Registration limit is positive number
- [ ] Required fields cannot be empty

### Edge Cases
- [ ] Registration when limit is reached
- [ ] Registration after deadline
- [ ] Event with zero fee
- [ ] Event with no custom form
- [ ] Empty search results
- [ ] No events available
- [ ] No registrations yet

### UI/UX
- [ ] Responsive on mobile devices
- [ ] Navigation works correctly
- [ ] Buttons are clickable
- [ ] Forms submit correctly
- [ ] Loading states appear
- [ ] Error messages are clear
- [ ] Success messages appear
- [ ] Toast notifications work

### Performance
- [ ] Pages load quickly
- [ ] No console errors
- [ ] No network errors
- [ ] Images load correctly
- [ ] Forms are responsive

## 🚀 Pre-Deployment Checklist

- [ ] All environment variables are set
- [ ] MongoDB connection string is correct
- [ ] Email credentials are configured
- [ ] JWT secret is changed from default
- [ ] Admin password is secure
- [ ] No hardcoded secrets in code
- [ ] .gitignore includes .env, node_modules
- [ ] README.md is complete
- [ ] deployment.txt is created
- [ ] All dependencies are in package.json

## 📦 Submission Checklist

- [ ] All files are in correct structure
- [ ] README.md documents all features
- [ ] README.md lists all libraries with justifications
- [ ] Advanced features are documented (if implemented)
- [ ] deployment.txt has URLs
- [ ] Code is commented appropriately
- [ ] No console.log statements in production code
- [ ] No TODO comments left
- [ ] ZIP file name is correct (roll number)
- [ ] ZIP file is not corrupted

## 🎯 Advanced Features Testing (Part 2 - 30 Marks)

### If Implementing Tier A Features

#### Hackathon Team Registration [8 Marks]
- [ ] Team leader can create team
- [ ] Can set team size
- [ ] Unique invite code generated
- [ ] Can share invite link
- [ ] Team members can accept invitation
- [ ] Registration marked incomplete until team full
- [ ] Team dashboard shows all members
- [ ] Tickets generated for all members when complete

#### Merchandise Payment Approval [8 Marks]
- [ ] User can upload payment proof
- [ ] Order enters pending state
- [ ] Organizer can view pending orders
- [ ] Can see payment proof image
- [ ] Can approve payment
- [ ] Can reject payment
- [ ] Stock decrements on approval
- [ ] QR generated only after approval
- [ ] Confirmation email sent after approval

####  QR Scanner & Attendance [8 Marks]
- [ ] QR scanner opens camera
- [ ] Can scan QR code
- [ ] Validates ticket ID
- [ ] Marks attendance with timestamp
- [ ] Prevents duplicate scans
- [ ] Shows live attendance dashboard
- [ ] Can export attendance report
- [ ] Manual override option available
- [ ] Audit log for manual overrides

### If Implementing Tier B Features

#### Real-Time Discussion Forum [6 Marks]
- [ ] Discussion forum visible on event page
- [ ] Only registered participants can post
- [ ] Messages appear in real-time
- [ ] Organizer can moderate
- [ ] Can pin important messages
- [ ] Can delete inappropriate messages
- [ ] Notifications for new messages
- [ ] Message threading works
- [ ] Reactions to messages work

#### Organizer Password Reset [6 Marks]
- [ ] Organizer can request password reset
- [ ] Admin sees all reset requests
- [ ] Shows requester details
- [ ] Admin can approve request
- [ ] Admin can reject request
- [ ] New password auto-generated on approval
- [ ] Admin receives new password
- [ ] Request status tracked
- [ ] Reset history maintained

#### Team Chat [6 Marks]
- [ ] Team chat room created for hackathon teams
- [ ] Real-time message delivery
- [ ] Message history visible
- [ ] Online status indicators
- [ ] Typing indicators
- [ ] Can share files/links
- [ ] Notifications for new messages

### If Implementing Tier C Features

#### Anonymous Feedback [2 Marks]
- [ ] Feedback form visible after event completion
- [ ] Star rating (1-5) selection
- [ ] Text comment field
- [ ] Submission is anonymous
- [ ] Organizer can view feedback
- [ ] Shows aggregated ratings
- [ ] Can filter by rating
- [ ] Shows average rating

#### Calendar Integration [2 Marks]
- [ ] .ics file download works
- [ ] File contains correct event details
- [ ] Google Calendar link works
- [ ] Outlook integration link works
- [ ] Opens respective calendar apps
- [ ] Event details populate correctly

#### Bot Protection [2 Marks]
- [ ] CAPTCHA appears on login page
- [ ] CAPTCHA appears on registration page
- [ ] Cannot submit without solving CAPTCHA
- [ ] CAPTCHA validation works
- [ ] Prevents bot attacks

## 📝 Documentation Checklist

- [ ] README has proper structure
- [ ] All features are documented
- [ ] All libraries are justified
- [ ] Installation steps are clear
- [ ] Environment setup is explained
- [ ] API endpoints are documented
- [ ] Deployment steps are clear
- [ ] Screenshots included (optional but good)

## Final Review

- [ ] All Part 1 features implemented (70 marks)
- [ ] Selected Part 2 features implemented (30 marks)
- [ ] No plagiarism
- [ ] No AI-generated code
- [ ] Can explain all code written
- [ ] Code is clean and readable
- [ ] Proper error handling
- [ ] User-friendly interfaces
- [ ] Professional appearance

---

**Total Core Features: 70 Marks**
**Total Advanced Features: 30 Marks**
**Grand Total: 100 Marks**

Good luck! 🎉
