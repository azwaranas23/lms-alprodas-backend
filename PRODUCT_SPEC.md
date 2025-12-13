# Product Specification: LMS Alprodas Backend API

## 1. Overview

LMS Alprodas Backend adalah REST API server yang dibangun dengan NestJS untuk mendukung platform Learning Management System. API ini menyediakan endpoint untuk manajemen user, course, enrollment, dan fitur pembelajaran lainnya.

---

## 2. Core Modules

### 2.1 Authentication Module (`/auth`)

**Purpose**: Mengelola autentikasi dan registrasi user

**Endpoints**:
- `POST /auth/login` - User login
- `POST /auth/register` - User registration dengan avatar upload
- `GET /auth/verify-email` - Email verification
- `POST /auth/resend-verification` - Resend verification email

**Features**:
- JWT-based authentication
- Password hashing dengan bcrypt
- Email verification workflow
- Rate limiting untuk security
- Avatar upload support

---

### 2.2 Users Module (`/users`)

**Purpose**: Manajemen user dan user profiles

**Endpoints**:
- `GET /users` - List users dengan pagination
- `GET /users/:id` - Get user detail
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

**Features**:
- User profile management
- Role-based access control
- User avatar management
- Gender field support

---

### 2.3 Roles & Permissions Module

**Purpose**: RBAC (Role-Based Access Control) system

**Endpoints**:
- `GET /roles` - List roles
- `POST /roles` - Create role
- `GET /permissions` - List permissions
- `POST /role-permissions` - Assign permissions

**Features**:
- Predefined roles: Admin, Mentor, Student
- Resource-based permissions
- Permission guard integration
- Automatic permission checking

**Default Permissions**:
```
Admin: users.*, courses.*, topics.*, subjects.*, dashboard.*, transactions.*, withdrawals.*
Mentor: courses.read/create/update, sections.*, lessons.*, dashboard.read, withdrawals.request
Student: courses.read/enroll, lessons.read, certificates.read
```

---

### 2.4 Topics Module (`/topics`)

**Purpose**: Manajemen kategori topik utama

**Endpoints**:
- `GET /topics` - List all topics (public)
- `GET /topics/:id` - Get topic detail (public)
- `POST /topics` - Create topic (admin)
- `PATCH /topics/:id` - Update topic (admin)
- `DELETE /topics/:id` - Delete topic (admin)

**Features**:
- Image upload untuk topic
- Topic description support
- Hierarchical relationship dengan subjects

---

### 2.5 Subjects Module (`/subjects`)

**Purpose**: Manajemen sub-kategori di bawah topics

**Endpoints**:
- `GET /subjects` - List subjects (public)
- `GET /subjects/:id` - Get subject detail (public)
- `GET /subjects/topic/:topicId` - Get subjects by topic
- `POST /subjects` - Create subject (admin)
- `PATCH /subjects/:id` - Update subject (admin)
- `DELETE /subjects/:id` - Delete subject (admin)

**Features**:
- Image upload untuk subject
- Automatic totalCourses counter
- Topic relationship tracking

---

### 2.6 Courses Module (`/courses`)

**Purpose**: Manajemen kursus pembelajaran

**Main Endpoints**:
- `GET /courses` - List courses dengan filters
- `GET /courses/:id` - Get course detail
- `POST /courses` - Create course
- `PATCH /courses/:id` - Update course
- `DELETE /courses/:id` - Delete course
- `PATCH /courses/:id/image/:type` - Update course image

**Student Endpoints**:
- `GET /courses/student/my-courses` - Get enrolled courses
- `POST /courses/:id/complete` - Complete course & get certificate
- `GET /courses/:id/enrollment` - Get enrollment detail

**Mentor Endpoints**:
- `GET /courses/mentor/students` - Get students in mentor's courses

**Features**:
- Multi-image upload (max 4 images)
- Course key points management
- Course personas (target audience)
- Course resources (file attachments)
- Course status: DRAFT, PUBLISHED, ARCHIVED
- Unique course token untuk enrollment
- Tools field untuk list tools yang digunakan
- Total lessons & students counter

**Related Sub-modules**:
- Course Images
- Course Key Points
- Course Personas
- Course Resources

---

### 2.7 Sections Module (`/sections`)

**Purpose**: Manajemen sections dalam course (bab/modul)

**Endpoints**:
- `GET /sections` - List sections
- `GET /sections/:id` - Get section detail
- `POST /sections` - Create section
- `PATCH /sections/:id` - Update section
- `DELETE /sections/:id` - Delete section

**Features**:
- Order index untuk sequencing
- Total lessons counter
- Cascade delete dengan lessons
- Course relationship

---

### 2.8 Lessons Module (`/lessons`)

**Purpose**: Manajemen lesson/materi pembelajaran

**Endpoints**:
- `GET /lessons` - List lessons
- `GET /lessons/:id` - Get lesson detail
- `POST /lessons` - Create lesson
- `PATCH /lessons/:id` - Update lesson
- `DELETE /lessons/:id` - Delete lesson

**Features**:
- Content types: VIDEO, ARTICLE
- Video: contentUrl field
- Article: contentText field
- Duration tracking (minutes)
- Order index untuk sequencing
- Active/inactive status
- Section relationship

---

### 2.9 Enrollments Module (`/enrollments`)

**Purpose**: Manajemen enrollment mahasiswa ke kursus

**Endpoints**:
- `POST /enrollments/token` - Enroll with course token

**Features**:
- Token-based enrollment
- Auto-create enrollment record
- Progress percentage tracking (0-100%)
- Enrollment status: ACTIVE, COMPLETED, CANCELLED
- Certificate ID generation upon completion
- Unique constraint: 1 enrollment per student per course

---

### 2.10 Lesson Progress Module

**Purpose**: Tracking progress per lesson

**Features**:
- Automatic progress creation on first lesson access
- Completion status (isCompleted)
- Completion timestamp
- Linked to enrollment for percentage calculation
- Unique constraint: 1 progress per student per lesson

---

### 2.11 Course Reviews Module

**Purpose**: Review dan rating untuk kursus

**Features**:
- Rating scale: 1-5
- Optional review text
- One review per student per course
- Timestamp tracking

---

### 2.12 Certificates Module (`/certificates`)

**Purpose**: Generate dan download sertifikat

**Endpoints**:
- `GET /certificates/:id` - Get certificate detail
- `GET /certificates/:id/download` - Download PDF

**Features**:
- PDF generation dengan html-pdf-node
- Handlebars template
- Unique certificate ID
- Auto-generation saat course completion

---

### 2.13 Dashboard Module (`/dashboard`)

**Purpose**: Statistik dan analytics

**Endpoints**:
- `GET /dashboard/overview` - System overview (admin)
- `GET /dashboard/mentor` - Mentor statistics

**Features**:
- Total users, courses, enrollments
- Revenue statistics
- Mentor-specific stats
- Real-time data agregasi

---

## 3. Technical Features

### 3.1 File Upload System

**Supported Upload Types**:
- Avatars: `./uploads/avatars/` (JPEG, PNG, GIF)
- Course Images: `./uploads/courses/` (JPEG, PNG)
- Course Resources: `./uploads/course-resources/` (PDF, ZIP, etc.)
- Topic Images: `./uploads/topics/` (JPEG, PNG)

**Features**:
- Multer integration
- Unique filename generation
- MIME type validation
- File size limits (10MB default)
- Automatic cleanup on error

---

### 3.2 Queue System (Bull + Redis)

**Purpose**: Background job processing

**Queues**:
- **email-queue**: Email sending

**Job Types**:
- Email verification
- Welcome email
- Course enrollment notification
- Certificate notification

**Configuration**:
- Redis: localhost:6379 (dev) / redis:6379 (docker)
- Job retry dengan exponential backoff

---

### 3.3 Caching Strategy (Redis)

**Cached Data**:
- User sessions
- Course lists
- Topic/Subject lists
- Dashboard statistics

**TTL Configuration**:
- User session: 1 hour
- Course list: 5 minutes
- Topic/Subject: 10 minutes
- Dashboard stats: 1 minute

**Cache Invalidation**:
- On entity create/update/delete
- Manual cache clear endpoints

---

### 3.4 Rate Limiting

**Global Limits**:
- Short (1s): 50 requests
- Medium (10s): 100 requests
- Long (1min): 500 requests

**Endpoint-Specific**:
- Login: 5 per 5s, 10 per 15min
- Register: 5 per 5s, 10 per 15min
- Resend verification: 1 per 30s, 3 per hour

---

### 3.5 Email Service

**Provider**: Nodemailer + Gmail SMTP

**Templates**: Handlebars (.hbs)
- Email verification
- Welcome email
- Enrollment confirmation
- Certificate notification

**Features**:
- Queue integration
- HTML templates
- Attachment support
- Error retry mechanism

---

### 3.6 PDF Service

**Provider**: html-pdf-node

**Use Cases**:
- Certificate generation
- Course syllabus export (future)

**Features**:
- Handlebars template engine
- Custom styling support
- Auto-download response

---

## 4. Database Schema Summary

### Core Entities

| Entity | Description | Key Fields |
|--------|-------------|------------|
| Role | User roles | name, key |
| Permission | System permissions | name, resource, key |
| RolePermission | Role-permission mapping | roleId, permissionId |
| User | System users | email, password, roleId |
| UserProfile | Extended user info | bio, avatar, gender |
| Topic | Main categories | name, description, image |
| Subject | Sub-categories | name, topicId, totalCourses |
| Course | Learning courses | title, subjectId, mentorId, courseToken |
| CourseImage | Course images | courseId, imagePath, orderIndex |
| CourseKeyPoint | Course highlights | courseId, keyPoint |
| CoursePersona | Target audience | courseId, persona |
| CourseResource | Downloadable files | courseId, resourcePath |
| CourseSection | Course chapters | courseId, title, orderIndex |
| Lesson | Learning materials | sectionId, contentType, contentUrl |
| Enrollment | Student enrollments | studentId, courseId, progressPercentage |
| LessonProgress | Lesson completion | studentId, lessonId, isCompleted |
| CourseReview | Course ratings | studentId, courseId, rating |

---

## 5. API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Success message",
  "data": { ... }
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "data": [...],
    "meta": {
      "currentPage": 1,
      "lastPage": 10,
      "perPage": 10,
      "total": 100
    }
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "ERROR_CODE"
}
```

---

## 6. Security Features

### Authentication
- JWT token-based authentication
- Password hashing (bcrypt, rounds: 12)
- Email verification required
- Token expiration (7 days default)

### Authorization
- Role-based permissions
- Resource-level access control
- Guard-protected endpoints

### Request Protection
- Rate limiting per endpoint
- Request validation (Zod schemas)
- SQL injection prevention (Prisma ORM)
- File upload type validation
- CORS configuration

---

## 7. Development & Deployment

### Environment Variables
```env
DATABASE_URL=postgresql://...
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=...
JWT_EXPIRATION=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

### Scripts
- `pnpm start:dev` - Development mode
- `pnpm build` - Build production
- `pnpm start:prod` - Run production
- `pnpm seed` - Database seeding
- `pnpm factory:bulk` - Bulk data generation

### Docker Support
- Dockerfile multi-stage build
- docker-compose.yml with services:
  - PostgreSQL (port 35432)
  - Redis (port 36379)
  - App (port 3005)
  - PgAdmin (port 5050)
  - Migrator (migration runner)

---

## 8. API Versioning

**Current Version**: v1 (implicit)

**Future Considerations**:
- Versioned endpoints: `/api/v1/...`
- Deprecation warnings
- Migration guides

---

## 9. Monitoring & Logging

### Logging
- Request/response logging
- Error logging with stack trace
- Audit logging untuk sensitive operations

### Health Checks
- Database connectivity
- Redis connectivity
- File system access

---

## 10. Future Enhancements

- [ ] GraphQL API alternative
- [ ] WebSocket untuk real-time features
- [ ] Advanced analytics & reporting
- [ ] Multi-tenancy support
- [ ] API rate limiting per user
- [ ] Automated testing (E2E)
- [ ] API documentation (Swagger/OpenAPI)

---

**Document Version**: 1.0  
**Last Updated**: 2024-12-13  
**Maintainer**: LMS Alprodas Team
