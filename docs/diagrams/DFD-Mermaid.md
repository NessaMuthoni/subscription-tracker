# Data Flow Diagrams (Mermaid Format)

These diagrams can be rendered in GitHub, VS Code (with Mermaid extension), or online at https://mermaid.live/

## Context Diagram (Level 0)

```mermaid
---
title: Context Diagram - Subscription Tracker System
---
graph TB
    User[User/Admin] --> System[Subscription Tracker System]
    Email[Email System] --> System
    Google[Google OAuth/Calendar] --> System
    MPesa[M-Pesa Payment API] --> System
    
    System --> Reminders[Payment Reminders]
    System --> Analytics[Analytics Reports]
    System --> Calendar[Calendar Events]
    System --> Alerts[Budget Alerts]
    
    style System fill:#4CAF50,stroke:#2E7D32,stroke-width:3px,color:#fff
    style User fill:#2196F3,stroke:#1565C0,color:#fff
    style Reminders fill:#FF9800,stroke:#E65100,color:#fff
    style Analytics fill:#FF9800,stroke:#E65100,color:#fff
    style Calendar fill:#FF9800,stroke:#E65100,color:#fff
    style Alerts fill:#FF9800,stroke:#E65100,color:#fff
```

## Level 1 DFD - Main Processes

```mermaid
---
title: Level 1 DFD - Main Processes
---
graph TB
    User[User] --> P1[Process 1:<br/>Authenticate User]
    P1 --> D1[(D1: Users<br/>Database)]
    
    P1 --> P2[Process 2:<br/>Manage<br/>Subscriptions]
    P2 --> D2[(D2: Subscriptions<br/>Database)]
    
    P2 --> P3[Process 3:<br/>Generate<br/>Analytics]
    P3 --> D3[(D3: Analytics<br/>Database)]
    
    D2 --> P4[Process 4:<br/>Send Payment<br/>Reminders]
    P4 --> D4[(D4: Google<br/>Calendar)]
    P4 --> Email[Email/SMS]
    
    D2 --> P5[Process 5:<br/>Budget<br/>Tracking]
    P5 --> D5[(D5: Budget<br/>Preferences)]
    P5 --> Notif[Notifications]
    
    style P1 fill:#2196F3,stroke:#1565C0,color:#fff
    style P2 fill:#2196F3,stroke:#1565C0,color:#fff
    style P3 fill:#2196F3,stroke:#1565C0,color:#fff
    style P4 fill:#2196F3,stroke:#1565C0,color:#fff
    style P5 fill:#2196F3,stroke:#1565C0,color:#fff
    style D1 fill:#9C27B0,stroke:#6A1B9A,color:#fff
    style D2 fill:#9C27B0,stroke:#6A1B9A,color:#fff
    style D3 fill:#9C27B0,stroke:#6A1B9A,color:#fff
    style D4 fill:#9C27B0,stroke:#6A1B9A,color:#fff
    style D5 fill:#9C27B0,stroke:#6A1B9A,color:#fff
```

## Level 2 DFD - Manage Subscriptions Process

```mermaid
---
title: Level 2 DFD - Manage Subscriptions
---
graph TB
    User[User] --> P21[Process 2.1:<br/>Add Subscription]
    User --> P22[Process 2.2:<br/>Update Subscription]
    User --> P23[Process 2.3:<br/>Delete Subscription]
    
    P21 --> D2[(D2: Subscriptions<br/>Database)]
    P22 --> D2
    P23 --> D2
    
    D2 --> P24[Process 2.4:<br/>Sync to<br/>Google Calendar]
    P24 --> Google[Google Calendar API]
    
    D2 --> P25[Process 2.5:<br/>Calculate<br/>Recurring Payments]
    P25 --> D3[(D3: Payment<br/>Schedule)]
    
    style P21 fill:#4CAF50,stroke:#2E7D32,color:#fff
    style P22 fill:#4CAF50,stroke:#2E7D32,color:#fff
    style P23 fill:#4CAF50,stroke:#2E7D32,color:#fff
    style P24 fill:#4CAF50,stroke:#2E7D32,color:#fff
    style P25 fill:#4CAF50,stroke:#2E7D32,color:#fff
    style D2 fill:#9C27B0,stroke:#6A1B9A,color:#fff
    style D3 fill:#9C27B0,stroke:#6A1B9A,color:#fff
```

## Level 2 DFD - Payment Reminders

```mermaid
---
title: Level 2 DFD - Payment Reminders
---
graph TB
    Timer[System Timer<br/>Daily Cron Job] --> P41[Process 4.1:<br/>Check Upcoming<br/>Payment Dates]
    
    D2[(D2: Subscriptions<br/>Database)] --> P41
    
    P41 --> P42[Process 4.2:<br/>Get User<br/>Preferences]
    
    D1[(D1: Users<br/>Database)] --> P42
    
    P42 --> P43[Process 4.3:<br/>Format & Send<br/>Notifications]
    
    P43 --> Email[Email Service]
    P43 --> Calendar[Google Calendar<br/>Reminder]
    
    Email --> User[User Receives<br/>Reminder]
    Calendar --> User
    
    style P41 fill:#FF5722,stroke:#D84315,color:#fff
    style P42 fill:#FF5722,stroke:#D84315,color:#fff
    style P43 fill:#FF5722,stroke:#D84315,color:#fff
    style D1 fill:#9C27B0,stroke:#6A1B9A,color:#fff
    style D2 fill:#9C27B0,stroke:#6A1B9A,color:#fff
```

## Level 2 DFD - Budget Tracking

```mermaid
---
title: Level 2 DFD - Budget Tracking
---
graph TB
    User[User Sets<br/>Monthly Budget] --> P51[Process 5.1:<br/>Store Budget<br/>Preferences]
    P51 --> D5[(D5: Budget<br/>Preferences)]
    
    D2[(D2: Subscriptions<br/>Database)] --> P52[Process 5.2:<br/>Calculate Total<br/>Monthly Spending]
    
    P52 --> P53[Process 5.3:<br/>Compare to Budget<br/>& Calculate %]
    D5 --> P53
    
    P53 --> Decision{Over Budget?}
    
    Decision -->|Yes| P54[Process 5.4:<br/>Generate Budget<br/>Alert/Warning]
    Decision -->|No| Report[Budget Report]
    
    P54 --> Notif[Notification<br/>System]
    Notif --> User2[User]
    
    style P51 fill:#00BCD4,stroke:#00838F,color:#fff
    style P52 fill:#00BCD4,stroke:#00838F,color:#fff
    style P53 fill:#00BCD4,stroke:#00838F,color:#fff
    style P54 fill:#00BCD4,stroke:#00838F,color:#fff
    style D2 fill:#9C27B0,stroke:#6A1B9A,color:#fff
    style D5 fill:#9C27B0,stroke:#6A1B9A,color:#fff
    style Decision fill:#FF9800,stroke:#E65100,color:#fff
```

---

## How to View These Diagrams:

1. **GitHub**: Push to GitHub and they'll render automatically
2. **VS Code**: Install "Markdown Preview Mermaid Support" extension
3. **Online**: Copy code to https://mermaid.live/
4. **Export**: Use mermaid.live to export as PNG/SVG/PDF
