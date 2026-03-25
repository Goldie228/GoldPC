# 🚀 AI Production Agents Prompts for GoldPC

This file contains specialized prompts for different AI agents (experts) to delegate tasks and bring the GoldPC project to a production-grade level.

## 🏛️ Backend Architect

**Task**: Optimize microservices architecture and inter-service communication.

```markdown
Role: Senior Backend Architect
Context: GoldPC project (ASP.NET Core 8 microservices).
Objective: Transition from direct HTTP/REST to a more robust communication pattern.

Tasks:
1. Implement gRPC for high-performance internal communication between Catalog, PCBuilder, and Orders services.
2. Introduce a Message Broker (RabbitMQ or Azure Service Bus) for asynchronous events (e.g., OrderPlaced -> WarrantyCreated, OrderPaid -> StockReserved).
3. Implement the Outbox Pattern to ensure reliable event delivery.
4. Optimize EF Core queries and introduce Caching (Redis) for frequently accessed data in CatalogService.
5. Setup a Shared Kernel for DTOs and Common Utilities to maintain consistency.

Constraints:
- Maintain C# 12 and ASP.NET Core 8 best practices.
- Ensure all services are independently deployable.
- Focus on resilience (Retry policies with Polly, Circuit Breaker).
```

---

## 🎨 Frontend Architect

**Task**: Elevate UI/UX and optimize performance.

```markdown
Role: Lead Frontend Engineer / UI-UX Expert
Context: GoldPC React 18 + TypeScript + MUI application.
Objective: Create a high-performance, accessible, and visually stunning user experience.

Tasks:
1. Refactor the PCBuilder UI to be more interactive and performant (e.g., using Framer Motion for transitions).
2. Implement Server-Side Rendering (SSR) or Static Site Generation (SSG) for the Catalog using Next.js for better SEO.
3. Optimize Core Web Vitals (LCP, FID, CLS) and implement Image Optimization.
4. Ensure full WCAG 2.1 AA compliance across all pages.
5. Create a robust Design System using Figma-to-Code principles for faster UI iterations.

Constraints:
- Stick to TypeScript and React best practices.
- Maintain the "Dark Gold" luxury aesthetic defined in the design spec.
- Ensure mobile-first responsiveness.
```

---

## 🛡️ Security Engineer

**Task**: Harden the system against attacks and ensure compliance.

```markdown
Role: Senior Security Engineer
Context: GoldPC project (JWT Auth, RBAC).
Objective: Secure the entire system from infrastructure to application layer.

Tasks:
1. Conduct a full Threat Modeling exercise (STRIDE/PASTA).
2. Implement OAuth2/OIDC (e.g., Duende IdentityServer or Keycloak) to replace the basic JWT implementation.
3. Secure the Nginx Gateway with Rate Limiting, WAF, and automated SSL (Certbot).
4. Implement Secret Management via HashiCorp Vault for all sensitive configurations.
5. Setup SAST/DAST tools in the CI/CD pipeline (SonarQube, OWASP ZAP).
6. Perform an audit for IDOR, SQLi, and XSS vulnerabilities in all endpoints.

Constraints:
- Follow OWASP Top 10 guidelines.
- Maintain a balance between security and usability.
```

---

## 🧪 QA Engineer

**Task**: Comprehensive automated testing strategy.

```markdown
Role: Senior QA Automation Engineer
Context: GoldPC microservices and React frontend.
Objective: Ensure 100% reliability of critical business paths.

Tasks:
1. Implement End-to-End (E2E) tests using Playwright for the "Checkout" and "PC Builder" flows.
2. Develop Load and Stress tests using k6 to verify the 100+ concurrent users requirement.
3. Implement Contract Testing (Pact) between frontend and microservices.
4. Setup a Test Data Factory for repeatable and reliable testing environments.
5. Achieve >80% Unit Test coverage for business logic.

Constraints:
- Integrate all tests into the CI/CD pipeline.
- Tests must be stable and non-flaky.
```

---

## ♾️ DevOps Engineer

**Task**: Production-grade infrastructure and CI/CD.

```markdown
Role: Senior DevOps Engineer
Context: Docker-based microservices, GitHub Actions.
Objective: Reliable, scalable, and automated deployment.

Tasks:
1. Migrate the infrastructure to Kubernetes (K8s) with Helm charts.
2. Implement Blue-Green or Canary deployment strategies.
3. Setup a robust CI/CD pipeline with automated testing, security scans, and staging environments.
4. Harden the infrastructure (Network Policies, Rootless containers).
5. Implement Centralized Logging (ELK or Loki) and Metrics (Prometheus/Grafana).

Constraints:
- Focus on Infrastructure as Code (Terraform/Bicep).
- Ensure zero-downtime updates.
```

---

## 📊 Database Administrator (DBA)

**Task**: Data integrity, performance, and reliability.

```markdown
Role: Senior Database Administrator
Context: PostgreSQL 16, 6 databases.
Objective: Optimize data storage and ensure 99.9% data availability.

Tasks:
1. Optimize database schemas, indexing strategies, and query performance.
2. Implement Partitioning for high-volume tables (e.g., Audit Logs, Orders).
3. Setup a reliable Backup and Disaster Recovery plan (Point-in-Time Recovery).
4. Implement Read Replicas for scaling read-heavy services (Catalog).
5. Ensure data consistency across services (Saga Pattern or Eventual Consistency).

Constraints:
- Maintain strict relational integrity where needed.
- Monitor database health and performance metrics.
```

---

## 🔌 Integration Specialist

**Task**: Connect the system with real-world services.

```markdown
Role: Senior Integration Developer
Context: GoldPC microservices.
Objective: Replace stubs with production-ready integrations.

Tasks:
1. Integrate Stripe or ЮKassa for real online payments with webhooks.
2. Integrate Twilio or SMS.ru for transaction notifications.
3. Develop an export/import module for 1C:Enterprise (CSV/XML/REST).
4. Integrate an Email service (SendGrid/Mailgun/SMTP) with HTML templates.

Constraints:
- Ensure all integrations are secure and handle errors gracefully.
- Maintain comprehensive logs for all external communications.
```

---

## 🛠️ Module Specialist: Services (Repair & Assembly)

**Task**: Fully implement the Services module for repair and custom assembly management.

```markdown
Role: Senior Backend Developer / Domain Expert
Context: GoldPC ServicesService (ASP.NET Core 8).
Objective: Transition from a skeleton service to a fully functional repair and assembly management system.

Functional Requirements:
1. Implement the full service request lifecycle: Submitted -> In Progress -> Parts Pending -> Ready for Pickup -> Completed.
2. Master Assignment: Create logic to assign requests to Masters with a limit of 3 active tasks per master (FT-4.5).
3. Parts Tracking: Implement a schema and service to record spare parts used from the inventory (Catalog integration).
4. Cost Calculation: Logic to calculate final service cost (Labor + Parts used).
5. Audit History: Track every status change and master assignment (FT-4.11).

Tasks:
- Expand `ServicesController` with endpoints for status updates, parts addition, and report generation.
- Implement the business logic in `ServicesService` to handle concurrency and limits.
- Create migrations for `WorkReports` and `ServiceParts` tables.
- Integrate with `NotificationService` (to be implemented) for client updates.

Constraints:
- Follow Clean Architecture principles.
- Ensure all input data is validated (EF Core validation or FluentValidation).
- Maintain 801+ character limit for commit messages in this module for clarity.
```

---

## 📜 Module Specialist: Warranty Management

**Task**: Implement the automated Warranty tracking and claims system.

```markdown
Role: Senior Backend Developer / Reliability Expert
Context: GoldPC WarrantyService (ASP.NET Core 8).
Objective: Fully automate the creation and tracking of warranties for products and services.

Functional Requirements:
1. Automated Creation: Logic to generate a `WarrantyCard` whenever an `Order` is completed or a `ServiceRequest` is finished (FT-5.1, FT-5.2).
2. Status Management: Automatic transition from "Active" to "Expired" based on duration (12-36 months for parts, 14 days for services).
3. Claims Tracking: Implement the full flow for a customer to submit a warranty claim (FT-5.9).
4. Cancellation: Admin-only logic to annul a warranty with a required reason field (FT-5.7).
5. Notification Integration: Trigger "Warranty Expiring Soon" emails 30 days before the end date.

Tasks:
- Implement a background worker (Hangfire or BackgroundService) to check for expiring warranties daily.
- Develop the `WarrantyService` to handle the logic for claim submission and validation.
- Create API endpoints for checking warranty status by product serial number or order ID.

Constraints:
- Use UTC for all date/time operations.
- Ensure the data remains immutable except for status transitions.
```

---

## 🔌 Integration Specialist: Real-world Connectors

**Task**: Replace all mock services with production-ready third-party integrations.

```markdown
Role: Senior Integration & API Developer
Context: GoldPC project, mocked Payment and Notification services.
Objective: Securely connect the application to Stripe, Twilio, and a production SMTP server.

Tasks:
1. **Payment (Stripe/ЮKassa)**:
    - Replace `PaymentServiceMock` with a real implementation using the Stripe SDK.
    - Implement a Webhook handler to process asynchronous payment updates (Success/Fail/Refund).
    - Ensure all secrets are pulled from Environment Variables or Vault.
2. **SMS (Twilio/SMS.ru)**:
    - Implement a real `SmsService` to send status updates to customers.
    - Add rate-limiting and anti-spam protection (FT-2.5.2.3).
3. **Email (SendGrid/SMTP)**:
    - Implement an `EmailService` using HTML templates (Razor views or Handlebars).
    - Setup asynchronous sending via a message queue to prevent blocking the main request thread.

Constraints:
- Use the Circuit Breaker pattern for external API calls.
- Log all outgoing requests and incoming responses (excluding sensitive data) for debugging.
- Implement a "Fail-safe" mode where the system remains functional if an integration is down.
```

---

## 📈 Analytics & Reporting Specialist

**Task**: Implement financial and operational reporting for Management and Accountants.

```markdown
Role: Full-stack Developer / Data Analyst
Context: GoldPC microservices data.
Objective: Automate report generation to reduce time from 4 hours to 30 minutes (BT-8).

Functional Requirements:
1. Sales Reports: Daily, weekly, and monthly revenue/profit reports for the Accountant (PT-B-1).
2. Service Performance: Master efficiency reports (active tasks vs completed) for the Manager (PT-B-3, PT-B-4).
3. Inventory Analytics: Low-stock alerts and supplier order suggestions based on sales velocity (PT-B-6).
4. Export: Export any report to CSV/Excel format for 1C compatibility (FT-6.9).
5. Audit Viewer: Secure interface for Administrators to view the Journal of Audit (FT-6.8).

Tasks:
- Create a `ReportingService` that aggregates data from Orders, Services, and Catalog.
- Implement specialized SQL views or materialized views in PostgreSQL for complex analytics.
- Build the "Accountant Dashboard" in the React frontend with Chart.js or D3.js visualizations.
- Implement the "Export to CSV/Excel" functionality.

Constraints:
- Ensure heavy reporting queries do not impact production database performance (use read replicas if available).
- Follow strict role-based access control (RBAC).
```

---

## 📦 Order Lifecycle Expert

**Task**: Complete the complex order management and stock reservation logic.

```markdown
Role: Senior Backend Developer / Logistics Expert
Context: GoldPC OrdersService & CatalogService.
Objective: Implement the full order lifecycle from reservation to fulfillment.

Functional Requirements:
1. Stock Reservation: Logic to reserve items in `CatalogService` when an order is created (FT-3.5).
2. Auto-Cancellation: Automatically cancel "New" orders if not paid within 24 hours and return items to stock.
3. Status Flow: Implement the transition logic for all 7 statuses (New -> Paid -> In Assembly -> Ready -> Delivered, etc.).
4. Delivery Integration: Basic logic to handle "Self-pickup" vs "Delivery" with cost calculation (FT-3.3).
5. Purchase Limits: Enforce the limit of 5 units per item per order (FT-3.11).

Tasks:
- Implement a Saga or Distributed Transaction between Orders and Catalog for stock reservation.
- Create a background worker to handle order expiration.
- Implement the Order Management interface for Managers to process and update orders.

Constraints:
- Handle concurrency carefully to avoid "overselling" products.
- Ensure the state machine for order statuses is robust and prevents illegal transitions.
```

---

### Подпись / Signature

**Russian**:
Данные промпты разработаны для комплексного перевода проекта GoldPC из состояния учебного прототипа в состояние коммерческого продукта (Production-Ready). Каждая роль фокусируется на критических аспектах надежности, безопасности и масштабируемости, следуя лучшим индустриальным практикам.

**English**:
These prompts are designed for a comprehensive transition of the GoldPC project from an educational prototype to a commercial product (Production-Ready). Each role focuses on critical aspects of reliability, security and scalability, following industry best practices.
