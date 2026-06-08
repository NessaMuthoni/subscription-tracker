# UML Diagrams (Mermaid Format)

## Use Case Diagram

```mermaid
---
title: Use Case Diagram - Subscription Tracker
---
graph LR
    User((User))
    Admin((Admin))
    Google[Google Calendar]
    MPesa[M-Pesa API]
    Email[Email System]
    AI[AI Service]
    
    User --> UC1[Register/Login]
    User --> UC2[Manage Subscriptions]
    User --> UC3[Set Monthly Budget]
    User --> UC4[View Analytics]
    User --> UC5[Configure Notifications]
    User --> UC6[Connect Google Calendar]
    User --> UC7[Setup Payment Methods]
    User --> UC8[Receive Payment Reminders]
    User --> UC9[View Payment History]
    User --> UC10[Get AI Recommendations]
    
    Admin --> UC11[Monitor System Health]
    Admin --> UC12[View User Analytics]
    Admin --> UC13[Generate Reports]
    
    UC6 --> Google
    UC7 --> MPesa
    UC8 --> Email
    UC10 --> AI
    
    UC2 -.include.-> UC6
    UC4 -.extend.-> UC10
    
    style User fill:#2196F3,stroke:#1565C0,color:#fff
    style Admin fill:#FF5722,stroke:#D84315,color:#fff
    style UC1 fill:#4CAF50,stroke:#2E7D32,color:#fff
    style UC2 fill:#4CAF50,stroke:#2E7D32,color:#fff
    style UC3 fill:#4CAF50,stroke:#2E7D32,color:#fff
    style UC4 fill:#4CAF50,stroke:#2E7D32,color:#fff
    style UC10 fill:#FF9800,stroke:#E65100,color:#fff
```

## Class Diagram

```mermaid
---
title: Class Diagram - Subscription Tracker
---
classDiagram
    class User {
        -UUID id
        -string email
        -string name
        -string passwordHash
        -timestamp createdAt
        -JSON preferences
        -string googleAccessToken
        -string googleRefreshToken
        +register()
        +login()
        +updateProfile()
        +connectGoogleCalendar()
        +setBudget(amount)
    }
    
    class Subscription {
        -UUID id
        -UUID userId
        -string name
        -string description
        -decimal price
        -enum billingCycle
        -date billingDate
        -UUID categoryId
        -UUID paymentMethodId
        -enum status
        -timestamp createdAt
        -timestamp updatedAt
        -string calendarEventId
        +create()
        +update()
        +delete()
        +calculateNextPayment()
        +syncToCalendar()
        +pause()
        +resume()
    }
    
    class Category {
        -UUID id
        -string name
        -string icon
        -string color
        +getSubscriptions()
        +getTotalSpending()
    }
    
    class PaymentMethod {
        -UUID id
        -UUID userId
        -enum type
        -string accountNumber
        -boolean isDefault
        -timestamp createdAt
        +add()
        +remove()
        +setDefault()
        +verify()
    }
    
    class Notification {
        -UUID id
        -UUID userId
        -UUID subscriptionId
        -enum type
        -string message
        -timestamp sentAt
        -boolean isRead
        -enum channel
        +send()
        +markAsRead()
        +schedule()
    }
    
    class Budget {
        -UUID userId
        -decimal monthlyLimit
        -number alertThreshold
        -decimal currentSpend
        -date month
        +setLimit(amount)
        +getCurrentSpending()
        +getPercentageUsed()
        +checkThreshold()
    }
    
    class AnalyticsResult {
        -UUID id
        -UUID userId
        -string period
        -decimal totalSpend
        -JSON categoryBreakdown
        -JSON trends
        -JSON predictions
        -timestamp generatedAt
        +generate()
        +getByPeriod()
        +compareMonths()
    }
    
    User "1" -- "0..*" Subscription : has
    User "1" -- "0..*" PaymentMethod : owns
    User "1" -- "0..*" Notification : receives
    User "1" -- "1" Budget : has
    User "1" -- "0..*" AnalyticsResult : views
    Subscription "0..*" -- "1" Category : belongs to
```

## Sequence Diagram - Add Subscription with Calendar Sync

```mermaid
---
title: Add Subscription with Calendar Sync
---
sequenceDiagram
    actor User
    participant Frontend
    participant Backend
    participant Database
    participant GoogleCalendar
    participant AIService
    
    User->>Frontend: Login
    Frontend->>Backend: Auth Request
    Backend->>Database: Verify Credentials
    Database-->>Backend: Return Token
    Backend-->>Frontend: JWT Token
    
    User->>Frontend: Add Subscription
    Frontend->>Backend: POST /api/subscriptions
    Backend->>Database: Insert Subscription
    Database-->>Backend: Subscription ID
    
    Backend->>GoogleCalendar: Check Token Valid?
    GoogleCalendar-->>Backend: Token Valid
    
    Backend->>GoogleCalendar: Create Event<br/>(name, date, recurrence)
    GoogleCalendar-->>Backend: Event ID
    
    Backend->>Database: Update with Event ID
    Database-->>Backend: OK
    
    Backend->>AIService: Analyze Spending (optional)
    AIService-->>Backend: Recommendations
    
    Backend-->>Frontend: 200 Success + Data
    Frontend-->>User: Display Success Message
```

## Sequence Diagram - Payment Reminder Flow

```mermaid
---
title: Payment Reminder Flow
---
sequenceDiagram
    participant Scheduler
    participant Backend
    participant Database
    participant NotificationService
    participant Email
    participant GoogleCalendar
    
    Scheduler->>Backend: Trigger Daily Cron
    Backend->>Database: Query Due Subscriptions
    Database-->>Backend: List of Due Subs
    
    loop For Each Subscription
        Backend->>Database: Get User Preferences
        Database-->>Backend: User Notification Settings
        
        Backend->>NotificationService: Format Message
        
        par Send Notifications
            NotificationService->>Email: Send Email
            NotificationService->>Email: Send SMS
            NotificationService->>GoogleCalendar: Add Calendar Reminder
        end
        
        Backend->>Database: Insert Notification Record
    end
```

## Activity Diagram - Budget Tracking

```mermaid
---
title: Budget Tracking Activity Diagram
---
graph TB
    Start([Start]) --> SetBudget[User Sets Monthly Budget]
    SetBudget --> SaveDB[Save to Database]
    SaveDB --> CalcSpend[Calculate Total<br/>Monthly Spend]
    CalcSpend --> Compare[Compare Spend<br/>to Budget]
    
    Compare --> Decision{Over Budget?}
    
    Decision -->|Yes| GenAlert[Generate Alert<br/>Over 100%]
    Decision -->|No| ShowOK[Display OK Status]
    
    GenAlert --> SendWarning[Send Warning<br/>Notification]
    SendWarning --> GetAI[Get AI Recommendations<br/>to Reduce Costs]
    
    GetAI --> UpdateDash[Update Budget Dashboard]
    ShowOK --> UpdateDash
    
    UpdateDash --> End([End])
    
    style Start fill:#4CAF50,stroke:#2E7D32,color:#fff
    style End fill:#F44336,stroke:#C62828,color:#fff
    style Decision fill:#FF9800,stroke:#E65100,color:#fff
    style GenAlert fill:#FF5722,stroke:#D84315,color:#fff
    style GetAI fill:#9C27B0,stroke:#6A1B9A,color:#fff
```

## State Diagram - Subscription Lifecycle

```mermaid
---
title: Subscription Lifecycle States
---
stateDiagram-v2
    [*] --> Draft: User Creates
    Draft --> Active: User Saves
    
    Active --> Active: User Edits
    Active --> Pending: Payment Due
    
    Pending --> Active: Payment Made
    Pending --> Overdue: Payment Failed
    
    Overdue --> Active: User Resolves
    
    Active --> Paused: User Pauses
    Paused --> Active: User Resumes
    
    Active --> Canceled: User Cancels
    Paused --> Canceled: User Cancels
    
    Canceled --> Archived: After 30 Days
    Archived --> [*]
```

## Component Diagram

```mermaid
---
title: System Architecture - Component Diagram
---
graph TB
    subgraph Presentation["Presentation Layer"]
        NextJS[Next.js Frontend]
        ReactUI[React UI Components]
        Tailwind[Theme/Styling Tailwind]
    end
    
    subgraph Business["Business Logic Layer"]
        Backend[Go Backend - Gin Framework]
        
        subgraph Handlers
            AuthH[Auth Handler]
            SubH[Subscription Handler]
            PayH[Payment Handler]
            AnalH[Analytics Handler]
            BudH[Budget Handler]
            CalH[Calendar Handler]
        end
        
        subgraph Middleware
            JWT[JWT Authentication]
            CORS[CORS Handler]
            Logging[Request Logging]
        end
    end
    
    subgraph Integration["Integration Layer"]
        GoogleAPI[Google Calendar API Client]
        MPesaAPI[M-Pesa Payment API Client]
        AIService[AI Service - Python Analytics]
    end
    
    subgraph Data["Data Layer"]
        PostgreSQL[(PostgreSQL Database<br/>Users, Subscriptions,<br/>Categories, Payments,<br/>Budget, Notifications,<br/>Analytics)]
    end
    
    Presentation --> Business
    Business --> Integration
    Business --> Data
    
    style Presentation fill:#2196F3,stroke:#1565C0,color:#fff
    style Business fill:#4CAF50,stroke:#2E7D32,color:#fff
    style Integration fill:#FF9800,stroke:#E65100,color:#fff
    style Data fill:#9C27B0,stroke:#6A1B9A,color:#fff
```

---

## How to View & Export:

1. **View in VS Code**: Install "Markdown Preview Mermaid Support" extension
2. **View Online**: Visit https://mermaid.live/ and paste the code
3. **Export**: Use mermaid.live to export as PNG, SVG, or PDF
4. **GitHub**: Push to GitHub - diagrams render automatically
