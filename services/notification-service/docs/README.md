# Notification Service Documentation

Welcome to the Notification Service documentation. This service handles multi-channel notifications with email templates and event-driven triggers.

## Quick Links

### System Documentation
- [Overview](./system/overview.md) - Service overview
- [Architecture](./system/architecture.md) - Architecture
- [Data Flow](./system/data-flow.md) - Notification flows
- [Security Model](./system/security-model.md) - Security
- [Observability](./system/observability.md) - Monitoring
- [Performance](./system/performance.md) - Performance
- [Deployment](./system/deployment.md) - Deployment
- [Environment Strategy](./system/environment-strategy.md) - Environments
- [Failure Recovery](./system/failure-recovery.md) - Recovery
- [Backup & Restore](./system/backup-restore.md) - Backups
- [Disaster Recovery](./system/disaster-recovery.md) - DR
- [Capacity Planning](./system/capacity-planning.md) - Scaling
- [SLA/SLO](./system/sla-slo.md) - SLAs
- [Glossary](./system/glossary.md) - Terms

### Architecture Decision Records (ADR)
- [ADR-0001: Technology Stack](./adr/0001-tech-stack.md)
- [ADR-0002: Nodemailer for Email](./adr/0002-database-orm.md)
- [ADR-0003: Handlebars Templates](./adr/0003-authentication.md)
- [ADR-0004: API Design](./adr/0004-api-design.md)
- [ADR-0005: Deployment Strategy](./adr/0005-deployment-strategy.md)

### Development Guides
- [Onboarding](./development/onboarding.md) - Onboarding
- [Local Setup](./development/local-setup.md) - Setup
- [Coding Standards](./development/coding-standards.md) - Standards
- [Branching & Release](./development/branching-release.md) - Workflow
- [Debugging](./development/debugging.md) - Debugging
- [Feature Flags](./development/feature-flags.md) - Flags
- [Conventions](./development/conventions.md) - Conventions

### Operations
- [Runbooks](./operations/runbooks.md) - Runbooks
- [Incident Management](./operations/incident-management.md) - Incidents
- [Monitoring & Alerts](./operations/monitoring-alerts.md) - Monitoring
- [Secrets Management](./operations/secrets-management.md) - Secrets
- [Audit Logging](./operations/audit-logging.md) - Auditing

## Service Overview

**Port**: 3007  
**Database**: PostgreSQL (port 5437)  
**Message Broker**: Kafka  
**Email Provider**: SMTP (Nodemailer)  
**Purpose**: Multi-channel notification delivery

### Key Features
- Email notifications with HTML templates
- Event-driven notification triggers
- Template management with Handlebars
- Notification history and tracking
- Retry logic for failed notifications
- Template caching for performance
- Multi-channel support (email, SMS planned)

### API Endpoints
```
POST   /api/notifications/send          - Send notification
GET    /api/notifications                - List user notifications
GET    /api/notifications/:id            - Get notification details
GET    /api/notifications/templates      - List templates
POST   /api/notifications/templates      - Create template (Admin)
```

### Technology Stack
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js 4.18+
- **Language**: TypeScript 5.3+
- **Database**: PostgreSQL 16 with Prisma ORM
- **Message Broker**: Apache Kafka
- **Email**: Nodemailer with SMTP
- **Templates**: Handlebars

### Event Types Consumed
- `order.placed` - Order confirmation email
- `order.shipped` - Shipping notification
- `order.cancelled` - Cancellation notice
- `payment.confirmed` - Payment receipt
- `inventory.low-stock` - Low stock alert (to admins)

### Email Templates

Located in `src/templates/`:
1. **order-confirmation.hbs** - Order placed notification
2. **order-shipped.hbs** - Shipping notification
3. **order-cancelled.hbs** - Cancellation notice
4. **payment-confirmation.hbs** - Payment receipt
5. **low-stock-alert.hbs** - Low inventory alert

### Database Schema

**notifications**:
- id
- userId
- type (EMAIL/SMS/PUSH)
- subject
- content
- status (PENDING/SENT/FAILED)
- sentAt
- failureReason
- createdAt

**notification_templates**:
- id
- name (unique)
- subject
- bodyTemplate (Handlebars)
- type (EMAIL/SMS)
- isActive

## Email System

### Nodemailer Configuration

```typescript
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // Use TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});
```

### Supported SMTP Providers
- Gmail (with app password)
- SendGrid
- AWS SES
- Mailgun
- Custom SMTP server

### Template Rendering

```typescript
// Load template
const template = Handlebars.compile(templateSource);

// Render with data
const html = template({
  customerName: 'John Doe',
  orderNumber: 'ORD-12345',
  items: [...],
  total: 99.99
});

// Send email
await transporter.sendMail({
  from: 'noreply@example.com',
  to: userEmail,
  subject: 'Order Confirmation',
  html: html
});
```

### Template Caching

Templates are cached in memory for performance:

```typescript
const templateCache = new Map<string, HandlebarsTemplateDelegate>();

function getCompiledTemplate(name: string) {
  if (templateCache.has(name)) {
    return templateCache.get(name);
  }
  
  const source = fs.readFileSync(`templates/${name}.hbs`, 'utf8');
  const compiled = Handlebars.compile(source);
  templateCache.set(name, compiled);
  
  return compiled;
}
```

## Notification Flow

### Order Confirmation Example

```
1. Order placed → order.placed event
2. Notification service consumes event
3. Loads order-confirmation.hbs template
4. Renders with order data
5. Sends email via SMTP
6. Logs notification in database
7. Updates status to SENT
```

### Retry Logic

Failed notifications are retried with exponential backoff:

```typescript
const retryDelays = [1000, 5000, 30000, 300000]; // 1s, 5s, 30s, 5min

async function sendWithRetry(notification, attempt = 0) {
  try {
    await sendEmail(notification);
    await updateStatus(notification.id, 'SENT');
  } catch (error) {
    if (attempt < retryDelays.length) {
      setTimeout(() => {
        sendWithRetry(notification, attempt + 1);
      }, retryDelays[attempt]);
    } else {
      await updateStatus(notification.id, 'FAILED', error.message);
    }
  }
}
```

## Getting Started

### Prerequisites
- Node.js 20+
- Docker Desktop
- PostgreSQL
- Kafka
- SMTP server credentials

### SMTP Setup

#### Option 1: Gmail (Testing)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

**Note**: Create app password at https://myaccount.google.com/apppasswords

#### Option 2: Ethereal (Development)
```bash
# Get test credentials at https://ethereal.email
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=generated-user
SMTP_PASSWORD=generated-password
```

### Quick Start
```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Add SMTP credentials to .env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-user
SMTP_PASSWORD=your-password

# Run database migrations
npx prisma migrate dev

# Start Kafka
docker-compose up -d kafka

# Start development server
npm run dev

# Service available at http://localhost:3007
```

### Testing Email Templates

```bash
# Send test email
curl -X POST http://localhost:3007/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "template": "order-confirmation",
    "data": {
      "customerName": "Test User",
      "orderNumber": "TEST-123",
      "items": [{"name": "Product A", "quantity": 1, "price": 29.99}],
      "total": 29.99
    }
  }'
```

## Template Development

### Creating New Templates

1. Create `.hbs` file in `src/templates/`
2. Use Handlebars syntax for variables
3. Style with inline CSS (for email compatibility)
4. Test with real data

### Template Best Practices

```handlebars
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Inline CSS for email clients */
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; }
    .button { background: #007bff; color: white; padding: 10px 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Hello {{customerName}}!</h1>
    <p>Your order {{orderNumber}} has been confirmed.</p>
    
    {{#each items}}
      <div>
        <strong>{{this.name}}</strong> - Qty: {{this.quantity}} - ${{this.price}}
      </div>
    {{/each}}
    
    <p><strong>Total: ${{total}}</strong></p>
    
    <a href="{{orderUrl}}" class="button">View Order</a>
  </div>
</body>
</html>
```

## Monitoring

### Key Metrics
- Notification send rate
- Success/failure rate
- Email delivery time
- Template rendering time
- SMTP connection errors
- Retry attempt distribution

### Alerts
- **Critical**: SMTP connection failure
- **Warning**: High failure rate (>5%)
- **Warning**: Slow email delivery (>30s)
- **Info**: High retry rate

## Email Deliverability

### SPF, DKIM, DMARC

Configure sender domain for better deliverability:

```dns
# SPF Record
v=spf1 include:_spf.example.com ~all

# DKIM Record
default._domainkey.example.com TXT "v=DKIM1; k=rsa; p=MIGfMA0GCS..."

# DMARC Record
_dmarc.example.com TXT "v=DMARC1; p=quarantine; rua=mailto:reports@example.com"
```

### Best Practices
- Use verified sender domains
- Include unsubscribe link
- Avoid spam trigger words
- Test with spam checkers
- Monitor bounce rates
- Maintain clean recipient lists

## Integration Points

- **Order Service**: Order lifecycle events
- **Payment Service**: Payment events
- **Inventory Service**: Low stock alerts
- **User Service**: User preferences (future)

## Future Enhancements

- [ ] SMS notifications (Twilio)
- [ ] Push notifications (Firebase)
- [ ] In-app notifications
- [ ] User notification preferences
- [ ] Notification scheduling
- [ ] A/B testing for templates
- [ ] Analytics and tracking

## Contributing

See [Coding Standards](./development/coding-standards.md).

## Support

- **Team**: Notifications Team
- **Slack**: #notification-service
- **On-Call**: PagerDuty
- **Email**: notifications-team@example.com

---

**Version**: 1.0.0  
**Status**: Production Ready
