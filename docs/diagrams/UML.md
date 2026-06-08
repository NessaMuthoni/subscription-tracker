# UML Diagrams - Subscription Tracker

## 1. Use Case Diagram

```
                    Subscription Tracker System
    ┌─────────────────────────────────────────────────────────┐
    │                                                           │
    │  ┌────────────────────────────────────────────────┐     │
    │  │                                                 │     │
┌───┴──│  UC1: Register/Login                          │     │
│      │                                                 │     │
│  ┌───│  UC2: Manage Subscriptions                     │     │
│  │   │    - Add Subscription                          │     │
│  │   │    - Edit Subscription                         │     │
│  │   │    - Delete Subscription                       │     │
│  │   │    - View All Subscriptions                    │     │
│  │   │                                                 │     │
│  │   │  UC3: Set Monthly Budget                       │     │
│  │   │                                                 │     │
│  │   │  UC4: View Analytics                           │     │
│  │   │    - Spending by Category                      │     │
│  │   │    - Monthly Trends                            │     │
│  │   │    - Budget vs Actual                          │     │
│  │   │                                                 │     │
│  │   │  UC5: Configure Notifications                  │     │
│  │   │    - Set Reminder Preferences                  │     │
│ ┌┴┐  │    - Enable/Disable Alerts                     │     │
│ │U│  │                                                 │     │
│ │s│  │  UC6: Connect Google Calendar                  │─────┼────► Google
│ │e│  │                                                 │     │     Calendar
│ │r│  │  UC7: Setup Payment Methods                    │─────┼────► M-Pesa
│ └┬┘  │    - Add M-Pesa                                │     │      API
│  │   │    - Add Card                                  │     │
│  │   │                                                 │     │
│  │   │  UC8: Receive Payment Reminders                │◄────┼───── Email
│  │   │                                                 │     │     System
│  │   │  UC9: View Payment History                     │     │
│  │   │                                                 │     │
│  │   │  UC10: Get AI Recommendations                  │─────┼────► AI
│  │   │                                                 │     │    Service
│  └───│                                                 │     │
│      └────────────────────────────────────────────────┘     │
│                                                              │
│      ┌────────────────────────────────────────────────┐     │
│      │  UC11: Monitor System Health                   │     │
└──────│  UC12: View User Analytics                     │     │
       │  UC13: Generate Reports                        │     │
┌───┬──│                                                 │     │
│ A │  └────────────────────────────────────────────────┘     │
│ d │                                                          │
│ m │                                                          │
│ i │                                                          │
│ n │                                                          │
└───┘  └─────────────────────────────────────────────────────┘

    «include»          «extend»
    UC2 ────► UC6      UC4 ····► UC10
    (Adding subscription          (AI suggests
     triggers calendar sync)       optimizations)
```

---

## 2. Class Diagram

```
┌─────────────────────────────┐
│          User               │
├─────────────────────────────┤
│ - id: UUID                  │
│ - email: string             │
│ - name: string              │
│ - passwordHash: string      │
│ - createdAt: timestamp      │
│ - preferences: JSON         │
│ - googleAccessToken: string │
│ - googleRefreshToken: string│
├─────────────────────────────┤
│ + register()                │
│ + login()                   │
│ + updateProfile()           │
│ + connectGoogleCalendar()   │
│ + setBudget(amount: number) │
└──────────┬──────────────────┘
           │ 1
           │
           │ has many
           │
           │ *
┌──────────▼──────────────────┐
│      Subscription           │
├─────────────────────────────┤
│ - id: UUID                  │
│ - userId: UUID              │
│ - name: string              │
│ - description: string       │
│ - price: decimal            │
│ - billingCycle: enum        │
│   (monthly, yearly, weekly) │
│ - billingDate: date         │
│ - categoryId: UUID          │
│ - paymentMethodId: UUID     │
│ - status: enum              │
│   (active, paused, canceled)│
│ - createdAt: timestamp      │
│ - updatedAt: timestamp      │
│ - calendarEventId: string   │
├─────────────────────────────┤
│ + create()                  │
│ + update()                  │
│ + delete()                  │
│ + calculateNextPayment()    │
│ + syncToCalendar()          │
│ + pause()                   │
│ + resume()                  │
└──────────┬──────────────────┘
           │ *
           │ belongs to
           │ 1
┌──────────▼──────────────────┐
│        Category             │
├─────────────────────────────┤
│ - id: UUID                  │
│ - name: string              │
│ - icon: string              │
│ - color: string             │
├─────────────────────────────┤
│ + getSubscriptions()        │
│ + getTotalSpending()        │
└─────────────────────────────┘


┌─────────────────────────────┐
│      PaymentMethod          │
├─────────────────────────────┤
│ - id: UUID                  │
│ - userId: UUID              │
│ - type: enum                │
│   (mpesa, card, bank)       │
│ - accountNumber: string     │
│ - isDefault: boolean        │
│ - createdAt: timestamp      │
├─────────────────────────────┤
│ + add()                     │
│ + remove()                  │
│ + setDefault()              │
│ + verify()                  │
└─────────────────────────────┘


┌─────────────────────────────┐
│      Notification           │
├─────────────────────────────┤
│ - id: UUID                  │
│ - userId: UUID              │
│ - subscriptionId: UUID      │
│ - type: enum                │
│   (reminder, alert, info)   │
│ - message: string           │
│ - sentAt: timestamp         │
│ - isRead: boolean           │
│ - channel: enum             │
│   (email, sms, push)        │
├─────────────────────────────┤
│ + send()                    │
│ + markAsRead()              │
│ + schedule()                │
└─────────────────────────────┘


┌─────────────────────────────┐
│         Budget              │
├─────────────────────────────┤
│ - userId: UUID              │
│ - monthlyLimit: decimal     │
│ - alertThreshold: number    │
│ - currentSpend: decimal     │
│ - month: date               │
├─────────────────────────────┤
│ + setLimit(amount)          │
│ + getCurrentSpending()      │
│ + getPercentageUsed()       │
│ + checkThreshold()          │
└─────────────────────────────┘


┌─────────────────────────────┐
│      AnalyticsResult        │
├─────────────────────────────┤
│ - id: UUID                  │
│ - userId: UUID              │
│ - period: string            │
│ - totalSpend: decimal       │
│ - categoryBreakdown: JSON   │
│ - trends: JSON              │
│ - predictions: JSON         │
│ - generatedAt: timestamp    │
├─────────────────────────────┤
│ + generate()                │
│ + getByPeriod()             │
│ + compareMonths()           │
└─────────────────────────────┘


┌─────────────────────────────┐
│    GoogleCalendarService    │
├─────────────────────────────┤
│ - accessToken: string       │
│ - refreshToken: string      │
├─────────────────────────────┤
│ + authenticate()            │
│ + createEvent()             │
│ + updateEvent()             │
│ + deleteEvent()             │
│ + refreshAccessToken()      │
└─────────────────────────────┘
```

**Relationships:**
- User **1 ──── *** Subscription (One user has many subscriptions)
- Subscription *** ──── 1** Category (Many subscriptions belong to one category)
- User **1 ──── *** PaymentMethod (One user has many payment methods)
- User **1 ──── *** Notification (One user receives many notifications)
- User **1 ──── 1** Budget (One user has one budget per month)
- User **1 ──── *** AnalyticsResult (One user has many analytics results)

---

## 3. Sequence Diagram - Add Subscription with Calendar Sync

```
User    Frontend    Backend    Database    GoogleCalendar    AI Service
 │          │          │           │              │              │
 │──Login──►│          │           │              │              │
 │          │─Auth───► │           │              │              │
 │          │          │──Verify──►│              │              │
 │          │          │◄──Token───│              │              │
 │          │◄─JWT────│            │              │              │
 │          │          │           │              │              │
 │──Add────►│          │           │              │              │
 │Subscription         │           │              │              │
 │          │          │           │              │              │
 │          │─POST────►│           │              │              │
 │          │/api/     │           │              │              │
 │          │subscr.   │           │              │              │
 │          │          │           │              │              │
 │          │          │──Insert──►│              │              │
 │          │          │          Subscr.         │              │
 │          │          │◄──ID─────│              │              │
 │          │          │           │              │              │
 │          │          │──────Check Google────────►│              │
 │          │          │          Token           │              │
 │          │          │◄─────Token Valid?────────│              │
 │          │          │           │              │              │
 │          │          │──────Create Event────────►│              │
 │          │          │     (name, date,         │              │
 │          │          │      recurrence)         │              │
 │          │          │◄─────Event ID────────────│              │
 │          │          │           │              │              │
 │          │          │──Update──►│              │              │
 │          │          │  with     │              │              │
 │          │          │ eventId   │              │              │
 │          │          │◄──OK──────│              │              │
 │          │          │           │              │              │
 │          │          │───Analyze Spending───────────────────► │
 │          │          │        (optional)                      │
 │          │          │◄──Recommendations──────────────────────│
 │          │          │           │              │              │
 │          │◄─200────│            │              │              │
 │          │  Success │           │              │              │
 │          │  +data   │           │              │              │
 │◄─Display─│          │           │              │              │
 │  Success │          │           │              │              │
 │          │          │           │              │              │
```

---

## 4. Sequence Diagram - Payment Reminder Flow

```
Scheduler  Backend  Database  Notification  Email/SMS  GoogleCal
   │         │         │         Service        │          │
   │         │         │            │           │          │
   │─Trigger─►         │            │           │          │
   │(Daily   │         │            │           │          │
   │ Cron)   │         │            │           │          │
   │         │         │            │           │          │
   │         │─Query──►│            │           │          │
   │         │Due Subs │            │           │          │
   │         │◄List────│            │           │          │
   │         │         │            │           │          │
   │         │──For Each Subscription           │          │
   │         │         │            │           │          │
   │         │─Get────►│            │           │          │
   │         │User     │            │           │          │
   │         │Prefs    │            │           │          │
   │         │◄Data────│            │           │          │
   │         │         │            │           │          │
   │         │─Format──►            │           │          │
   │         │ Message │            │           │          │
   │         │         │            │           │          │
   │         │         │──Send Email────────────►          │
   │         │         │            │           │          │
   │         │         │──Send SMS──────────────►          │
   │         │         │            │           │          │
   │         │         │──Add Calendar───────────────────►│
   │         │         │  Reminder  │           │          │
   │         │         │            │           │          │
   │         │─Insert──►            │           │          │
   │         │Notif.   │            │           │          │
   │         │Record   │            │           │          │
   │         │         │            │           │          │
```

---

## 5. Activity Diagram - Budget Tracking

```
                    START
                      │
                      ▼
          ┌────────────────────┐
          │ User Sets Monthly  │
          │     Budget         │
          └─────────┬──────────┘
                    │
                    ▼
          ┌────────────────────┐
          │ Save to Database   │
          └─────────┬──────────┘
                    │
            ┌───────▼────────┐
            │ Calculate Total│
            │ Monthly Spend  │
            │ (All Active    │
            │ Subscriptions) │
            └───────┬────────┘
                    │
                    ▼
            ┌───────────────┐
            │ Compare Spend │
            │   to Budget   │
            └───────┬───────┘
                    │
          ┌─────────┴─────────┐
          │                   │
    Over Budget?         Under Budget?
          │                   │
         YES                 NO
          │                   │
          ▼                   ▼
┌─────────────────┐   ┌──────────────┐
│ Generate Alert  │   │ Display OK   │
│ (>100% used)    │   │   Status     │
└────────┬────────┘   └──────┬───────┘
         │                   │
         ▼                   │
┌─────────────────┐          │
│ Send Warning    │          │
│ Notification    │          │
└────────┬────────┘          │
         │                   │
         ▼                   │
┌─────────────────┐          │
│ Get AI          │          │
│ Recommendations │          │
│ to Reduce Costs │          │
└────────┬────────┘          │
         │                   │
         └────────┬──────────┘
                  │
                  ▼
         ┌────────────────┐
         │ Update Budget  │
         │   Dashboard    │
         └────────┬───────┘
                  │
                  ▼
                 END
```

---

## 6. State Diagram - Subscription Lifecycle

```
                    ┌─────────┐
             ┌─────►│ DRAFT   │
             │      └────┬────┘
             │           │
             │      User Saves
             │           │
             │           ▼
             │      ┌─────────┐
        User Edits  │ ACTIVE  │◄────┐
             │      └────┬────┘     │
             │           │          │
             └───────────┘          │
                         │          │
                    Payment Due     │
                         │          │
                         ▼          │
                  ┌─────────────┐  │
             ┌────│  PENDING    │  │
             │    │  PAYMENT    │  │
             │    └──────┬──────┘  │
             │           │         │
        Payment    Payment Made    │
        Failed          │          │
             │          ├──────────┘
             │          │
             ▼          │
        ┌─────────┐     │
        │ OVERDUE │     │
        └────┬────┘     │
             │          │
       User Resolves    │
             │          │
             └──────────┘
                         │
                   User Pauses
                         │
                         ▼
                  ┌─────────┐
              ┌───│ PAUSED  │
              │   └────┬────┘
              │        │
        User Resumes   │
              │        │
              └────────┘
                         │
                   User Cancels
                         │
                         ▼
                  ┌──────────┐
                  │ CANCELED │
                  └──────────┘
                         │
                  After 30 days
                         │
                         ▼
                  ┌──────────┐
                  │ ARCHIVED │
                  └──────────┘
```

---

## 7. Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Next.js    │  │  React UI    │  │  Theme/Styling  │  │
│  │   Frontend   │  │  Components  │  │   (Tailwind)    │  │
│  └──────┬───────┘  └──────┬───────┘  └─────────────────┘  │
└─────────┼──────────────────┼───────────────────────────────┘
          │                  │
          └────────┬─────────┘
                   │ HTTP/REST API
┌──────────────────┼───────────────────────────────────────────┐
│                  ▼       Business Logic Layer                │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Go Backend (Gin Framework)                  │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │  │
│  │  │   Auth      │  │ Subscription │  │  Payment   │  │  │
│  │  │  Handler    │  │   Handler    │  │  Handler   │  │  │
│  │  └─────────────┘  └──────────────┘  └────────────┘  │  │
│  │                                                       │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │  │
│  │  │  Analytics  │  │   Budget     │  │ Calendar   │  │  │
│  │  │  Handler    │  │   Handler    │  │  Handler   │  │  │
│  │  └─────────────┘  └──────────────┘  └────────────┘  │  │
│  │                                                       │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │         Middleware Layer                      │   │  │
│  │  │  - JWT Authentication                         │   │  │
│  │  │  - CORS Handler                               │   │  │
│  │  │  - Request Logging                            │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────┐
│                             ▼      Integration Layer         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  Google      │  │   M-Pesa     │  │   AI Service    │  │
│  │  Calendar    │  │   Payment    │  │   (Python)      │  │
│  │  API Client  │  │   API Client │  │   Analytics     │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────┐
│                             ▼         Data Layer             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │           PostgreSQL Database                        │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  Users │ Subscriptions │ Categories │ Payments      │   │
│  │  Budget │ Notifications │ Analytics  │ PaymentMethods│   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

