# Data Flow Diagrams (DFD) - Subscription Tracker

## Context Diagram (Level 0)

```
                        ┌──────────────────────┐
                        │                      │
        Email ──────────►                      ├─────────► Payment Reminders
                        │   SUBSCRIPTION       │
        User ───────────►   TRACKER            ├─────────► Analytics Reports
        Data            │   SYSTEM             │
                        │                      ├─────────► Calendar Events
   Google OAuth ────────►                      │
                        │                      ├─────────► Budget Alerts
    M-Pesa API ─────────►                      │
                        └──────────────────────┘
                                  │
                                  ▼
                         [User/Admin Interface]
```

**External Entities:**
- User
- Google OAuth/Calendar API
- M-Pesa Payment API
- Email System

---

## Level 1 DFD - Main Processes

```
┌─────────────┐
│    USER     │
└──────┬──────┘
       │
       │ Login/Register
       ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌──────────────┐         ┌──────────────┐         ┌─────────┐│
│  │   Process 1  │         │   Process 2  │         │Process 3││
│  │              │         │              │         │         ││
│  │ Authenticate │────────►│   Manage     │────────►│ Generate││
│  │    User      │  Token  │Subscriptions │  Data   │Analytics││
│  │              │         │              │         │         ││
│  └──────┬───────┘         └──────┬───────┘         └────┬────┘│
│         │                        │                      │     │
│         │                        │                      │     │
│         ▼                        ▼                      ▼     │
│  ┌──────────────┐        ┌──────────────┐        ┌─────────┐ │
│  │  D1: Users   │        │D2:Subscrip-  │        │D3:Analy-│ │
│  │   Database   │        │ tions DB     │        │ tics DB │ │
│  └──────────────┘        └──────┬───────┘        └─────────┘ │
│                                 │                             │
│                                 │                             │
│  ┌──────────────┐              │          ┌────────────────┐ │
│  │   Process 4  │◄─────────────┘          │   Process 5    │ │
│  │              │                          │                │ │
│  │Send Payment  │                          │ Budget         │ │
│  │ Reminders    │                          │ Tracking       │ │
│  │              │                          │                │ │
│  └──────┬───────┘                          └────────┬───────┘ │
│         │                                           │         │
│         ▼                                           ▼         │
│  ┌──────────────┐                          ┌────────────────┐│
│  │  D4: Google  │                          │ D5: Budget     ││
│  │   Calendar   │                          │   Preferences  ││
│  └──────────────┘                          └────────────────┘│
│                                                               │
└───────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
   [Email/SMS]         [Calendar Events]      [Notifications]
```

---

## Level 2 DFD - Process 2: Manage Subscriptions (Detailed)

```
                         ┌─────────────┐
                         │    USER     │
                         └──────┬──────┘
                                │
            ┌───────────────────┼───────────────────┐
            │                   │                   │
            ▼                   ▼                   ▼
    ┌───────────────┐   ┌───────────────┐  ┌──────────────┐
    │   Process 2.1 │   │   Process 2.2 │  │ Process 2.3  │
    │               │   │               │  │              │
    │     Add       │   │    Update     │  │   Delete     │
    │ Subscription  │   │ Subscription  │  │Subscription  │
    │               │   │               │  │              │
    └───────┬───────┘   └───────┬───────┘  └──────┬───────┘
            │                   │                  │
            │      ┌────────────┴──────────┐       │
            │      │                       │       │
            ▼      ▼                       ▼       ▼
    ┌─────────────────────────────────────────────────┐
    │         D2: Subscriptions Database              │
    │  - subscription_id                              │
    │  - user_id                                      │
    │  - name, price, billing_cycle                   │
    │  - billing_date, category                       │
    │  - payment_method, status                       │
    └───────────────┬─────────────────────────────────┘
                    │
                    │ Trigger
                    ▼
            ┌───────────────┐
            │  Process 2.4  │
            │               │
            │   Sync to     │──────► Google Calendar API
            │Google Calendar│
            │               │
            └───────┬───────┘
                    │
                    ▼
            [Calendar Event Created]


            ┌───────────────┐
            │  Process 2.5  │
            │               │
            │  Calculate    │
            │   Recurring   │◄──── Billing Cycle Data
            │   Payments    │
            │               │
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
            │  D3: Payment  │
            │   Schedule    │
            └───────────────┘
```

---

## Level 2 DFD - Process 4: Send Payment Reminders

```
    ┌──────────────────┐
    │  System Timer    │ (Daily Cron Job)
    │  (Scheduler)     │
    └────────┬─────────┘
             │
             ▼
    ┌────────────────────┐
    │   Process 4.1      │
    │                    │
    │  Check Upcoming    │◄───── D2: Subscriptions DB
    │  Payment Dates     │
    │                    │
    └────────┬───────────┘
             │
             │ Due Subscriptions
             ▼
    ┌────────────────────┐
    │   Process 4.2      │
    │                    │
    │  Get User          │◄───── D1: Users DB
    │  Preferences       │       (notification settings)
    │                    │
    └────────┬───────────┘
             │
             │ Reminder Settings
             ▼
    ┌────────────────────┐
    │   Process 4.3      │
    │                    │
    │  Format & Send     │
    │  Notifications     │
    │                    │
    └─────┬────────┬─────┘
          │        │
          │        └──────────┐
          ▼                   ▼
    ┌─────────┐      ┌──────────────┐
    │ Email   │      │Google Calendar│
    │ Service │      │  Reminder     │
    └─────────┘      └──────────────┘
          │                  │
          └────────┬─────────┘
                   ▼
            ┌──────────────┐
            │     USER     │
            │  (Receives   │
            │  Reminder)   │
            └──────────────┘
```

---

## Level 2 DFD - Process 5: Budget Tracking

```
    ┌─────────────┐
    │    USER     │
    └──────┬──────┘
           │
           │ Sets Monthly Budget
           ▼
    ┌────────────────────┐
    │   Process 5.1      │
    │                    │
    │  Store Budget      │────► D5: Budget Preferences
    │  Preferences       │
    │                    │
    └────────────────────┘


    ┌────────────────────┐
    │   Process 5.2      │
    │                    │
    │  Calculate Total   │◄──── D2: Subscriptions DB
    │  Monthly Spending  │      (active subscriptions)
    │                    │
    └────────┬───────────┘
             │
             │ Total Spend
             ▼
    ┌────────────────────┐
    │   Process 5.3      │
    │                    │◄──── D5: Budget Preferences
    │  Compare to Budget │
    │  & Calculate %     │
    │                    │
    └────────┬───────────┘
             │
             ├─────► Budget Report
             │
             │ If Over Budget
             ▼
    ┌────────────────────┐
    │   Process 5.4      │
    │                    │
    │  Generate Budget   │
    │  Alert/Warning     │
    │                    │
    └────────┬───────────┘
             │
             ▼
    ┌────────────────┐
    │  Notification  │
    │    System      │
    └────────┬───────┘
             │
             ▼
        ┌────────┐
        │  USER  │
        └────────┘
```

---

## Data Stores

| ID | Data Store | Description | Key Fields |
|----|------------|-------------|------------|
| D1 | Users | User account information | user_id, email, password_hash, preferences |
| D2 | Subscriptions | All subscription records | subscription_id, user_id, name, price, billing_date |
| D3 | Analytics | Computed analytics data | analytics_id, user_id, monthly_spend, category_breakdown |
| D4 | Google Calendar | External calendar events | event_id, subscription_id, event_date |
| D5 | Budget Preferences | User budget settings | user_id, monthly_budget, alert_threshold |
| D6 | Payment Methods | Payment credentials | method_id, user_id, type, credentials |
| D7 | Categories | Subscription categories | category_id, name, icon |

---

## Data Flow Summary

| Flow | Source | Destination | Data |
|------|--------|-------------|------|
| User Registration | User | Process 1 | email, password, name |
| Authentication | Process 1 | D1 | JWT token, user_id |
| Add Subscription | User | Process 2.1 | name, price, billing_date, category |
| Subscription Data | Process 2 | D2 | Complete subscription record |
| Calendar Sync | Process 2.4 | Google Calendar API | event details, recurrence |
| Payment Check | System Timer | Process 4.1 | current_date |
| Due Subscriptions | D2 | Process 4.2 | subscriptions due soon |
| Send Reminder | Process 4.3 | Email/Calendar | reminder message, details |
| Budget Input | User | Process 5.1 | monthly_budget amount |
| Spending Data | D2 | Process 5.2 | all active subscriptions |
| Budget Alert | Process 5.4 | User | overspend warning |
| Analytics Request | User | Process 3 | date_range, filters |
| Analytics Data | Process 3 | D3 | computed statistics |

