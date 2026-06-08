# Flowcharts - Subscription Tracker

## 1. User Registration Flow

```
                    START
                      │
                      ▼
            ┌─────────────────┐
            │ User Opens App  │
            └────────┬────────┘
                     │
                     ▼
            ┌─────────────────┐
            │ Click "Sign Up" │
            └────────┬────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │ Enter Email, Password, │
        │       Name             │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │ Validate Input     │
        └────────┬───────────┘
                 │
         ┌───────┴───────┐
         │               │
      Valid?           Invalid?
         │               │
        YES              NO
         │               │
         ▼               ▼
  ┌─────────────┐  ┌──────────────┐
  │ Hash        │  │ Show Error   │
  │ Password    │  │ Message      │
  └──────┬──────┘  └──────┬───────┘
         │                │
         ▼                └──────┐
  ┌─────────────┐               │
  │ Check Email │               │
  │ Uniqueness  │               │
  └──────┬──────┘               │
         │                      │
  ┌──────┴──────┐               │
  │             │               │
Email Exists? Email Unique?     │
  │             │               │
 YES            NO              │
  │             │               │
  ▼             ▼               │
┌──────┐  ┌──────────┐          │
│Error:│  │ Create   │          │
│Email │  │ User in  │          │
│Taken │  │ Database │          │
└──┬───┘  └────┬─────┘          │
   │           │                │
   │           ▼                │
   │     ┌──────────┐           │
   │     │ Generate │           │
   │     │   JWT    │           │
   │     │  Token   │           │
   │     └────┬─────┘           │
   │          │                 │
   │          ▼                 │
   │    ┌──────────┐            │
   │    │  Send    │            │
   │    │Welcome   │            │
   │    │  Email   │            │
   │    └────┬─────┘            │
   │         │                  │
   │         ▼                  │
   │    ┌──────────┐            │
   │    │Redirect  │            │
   │    │   to     │            │
   │    │Dashboard │            │
   │    └────┬─────┘            │
   │         │                  │
   └─────────┴──────────────────┘
                 │
                 ▼
               END
```

---

## 2. User Login Flow

```
                   START
                     │
                     ▼
          ┌──────────────────┐
          │ User Opens App   │
          └────────┬─────────┘
                   │
                   ▼
          ┌──────────────────┐
          │ Click "Login"    │
          └────────┬─────────┘
                   │
                   ▼
       ┌───────────────────────┐
       │ Enter Email/Password  │
       └───────────┬───────────┘
                   │
                   ▼
       ┌───────────────────────┐
       │ Submit Credentials    │
       └───────────┬───────────┘
                   │
                   ▼
       ┌───────────────────────┐
       │ Backend: Query User   │
       │      by Email         │
       └───────────┬───────────┘
                   │
           ┌───────┴────────┐
           │                │
       User Found?      Not Found?
           │                │
          YES              NO
           │                │
           ▼                ▼
  ┌─────────────────┐  ┌────────────┐
  │ Verify Password │  │   Error:   │
  │    Hash         │  │ Invalid    │
  └────────┬────────┘  │Credentials │
           │           └─────┬──────┘
   ┌───────┴───────┐         │
   │               │         │
Match?        No Match?      │
   │               │         │
  YES              NO        │
   │               │         │
   ▼               ▼         │
┌────────┐    ┌────────┐    │
│Generate│    │ Error: │    │
│  JWT   │    │Invalid │    │
│ Token  │    │Password│    │
└───┬────┘    └───┬────┘    │
    │             │         │
    ▼             │         │
┌────────┐        │         │
│ Update │        │         │
│  Last  │        │         │
│ Login  │        │         │
└───┬────┘        │         │
    │             │         │
    ▼             │         │
┌────────┐        │         │
│Return  │        │         │
│ Token  │        │         │
│  to    │        │         │
│Frontend│        │         │
└───┬────┘        │         │
    │             │         │
    ▼             │         │
┌────────┐        │         │
│ Store  │        │         │
│Token in│        │         │
│Local   │        │         │
│Storage │        │         │
└───┬────┘        │         │
    │             │         │
    ▼             │         │
┌────────┐        │         │
│Navigate│        │         │
│   to   │        │         │
│Dashboard        │         │
└───┬────┘        │         │
    │             │         │
    └─────────────┴─────────┘
                  │
                  ▼
                 END
```

---

## 3. Add Subscription Flow

```
                    START
                      │
                      ▼
           ┌──────────────────┐
           │ User Clicks      │
           │ "Add Subscription│
           └─────────┬────────┘
                     │
                     ▼
           ┌──────────────────┐
           │ Open Subscription│
           │      Form        │
           └─────────┬────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │ User Fills Form:       │
        │ - Name                 │
        │ - Price                │
        │ - Billing Cycle        │
        │ - Billing Date         │
        │ - Category             │
        │ - Payment Method       │
        │ - Description          │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │ Click "Save"       │
        └────────┬───────────┘
                 │
                 ▼
        ┌────────────────────┐
        │ Validate Form      │
        └────────┬───────────┘
                 │
         ┌───────┴────────┐
         │                │
    All Fields      Missing/Invalid
      Valid?            Fields?
         │                │
        YES              NO
         │                │
         ▼                ▼
  ┌─────────────┐  ┌──────────────┐
  │ Send POST   │  │ Show Error   │
  │ to Backend  │  │   Messages   │
  └──────┬──────┘  └──────┬───────┘
         │                │
         ▼                └──────┐
  ┌─────────────┐               │
  │ Backend:    │               │
  │ Insert into │               │
  │ Database    │               │
  └──────┬──────┘               │
         │                      │
         ▼                      │
  ┌─────────────┐               │
  │ Get User's  │               │
  │ Google      │               │
  │ Calendar    │               │
  │ Token       │               │
  └──────┬──────┘               │
         │                      │
   ┌─────┴──────┐               │
   │            │               │
Token         No Token          │
Valid?        /Expired          │
   │            │               │
  YES           NO              │
   │            │               │
   ▼            ▼               │
┌───────┐  ┌──────────┐         │
│Create │  │ Skip     │         │
│Event  │  │ Calendar │         │
│in     │  │ Sync     │         │
│Google │  └────┬─────┘         │
│Calendar     │                │
└───┬───┘      │                │
    │          │                │
    ▼          │                │
┌───────┐      │                │
│Set    │      │                │
│Recur- │      │                │
│rence  │      │                │
│Rules  │      │                │
└───┬───┘      │                │
    │          │                │
    ▼          │                │
┌───────┐      │                │
│Add    │      │                │
│Remind-│      │                │
│ers    │      │                │
└───┬───┘      │                │
    │          │                │
    ▼          │                │
┌───────┐      │                │
│Store  │      │                │
│Event  │      │                │
│  ID   │      │                │
└───┬───┘      │                │
    │          │                │
    └──────┬───┘                │
           │                    │
           ▼                    │
    ┌─────────────┐             │
    │ Return      │             │
    │ Success     │             │
    │ Response    │             │
    └──────┬──────┘             │
           │                    │
           ▼                    │
    ┌─────────────┐             │
    │ Update UI:  │             │
    │ Show Success│             │
    │ Message     │             │
    └──────┬──────┘             │
           │                    │
           ▼                    │
    ┌─────────────┐             │
    │ Refresh     │             │
    │Subscription │             │
    │    List     │             │
    └──────┬──────┘             │
           │                    │
           └────────────────────┘
                    │
                    ▼
                   END
```

---

## 4. Payment Reminder Process

```
                    START
                      │
                      ▼
           ┌──────────────────┐
           │ Cron Job Triggers│
           │  (Daily at 8 AM) │
           └─────────┬────────┘
                     │
                     ▼
           ┌──────────────────┐
           │ Get Current Date │
           └─────────┬────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │ Query All Active       │
        │ Subscriptions Due      │
        │ Within Reminder Window │
        └────────┬───────────────┘
                 │
         ┌───────┴────────┐
         │                │
    Subscriptions      No Subscriptions
       Found?              Due?
         │                │
        YES              NO
         │                │
         ▼                ▼
  ┌─────────────┐  ┌──────────────┐
  │ Loop Through│  │   Log: No    │
  │     Each    │  │  Reminders   │
  │ Subscription│  │    Today     │
  └──────┬──────┘  └──────┬───────┘
         │                │
         ▼                │
  ┌─────────────┐         │
  │ Get User    │         │
  │ Details     │         │
  └──────┬──────┘         │
         │                │
         ▼                │
  ┌─────────────┐         │
  │ Check User  │         │
  │ Notification│         │
  │ Preferences │         │
  └──────┬──────┘         │
         │                │
  ┌──────┴──────┐         │
  │             │         │
Reminders    Reminders    │
Enabled?     Disabled?    │
  │             │         │
 YES            NO        │
  │             │         │
  ▼             ▼         │
┌────────┐  ┌────────┐   │
│Format  │  │ Skip   │   │
│Message:│  │  User  │   │
│        │  └───┬────┘   │
│"[Name] │      │        │
│payment │      │        │
│due on  │      │        │
│[Date]  │      │        │
│KSh[Amt]│      │        │
└───┬────┘      │        │
    │           │        │
    ▼           │        │
┌────────┐      │        │
│Check   │      │        │
│Notif.  │      │        │
│Channel │      │        │
└───┬────┘      │        │
    │           │        │
    ├─ Email? ──┼────────┼──► Send Email
    │           │        │
    ├─ SMS? ────┼────────┼──► Send SMS
    │           │        │
    └─Calendar?─┼────────┼──► Add Calendar Reminder
                │        │
                ▼        │
         ┌────────────┐  │
         │ Save to    │  │
         │Notification│  │
         │   Table    │  │
         └─────┬──────┘  │
               │         │
               ▼         │
         ┌────────────┐  │
         │ Mark as    │  │
         │   Sent     │  │
         └─────┬──────┘  │
               │         │
         ┌─────┴─────┐   │
         │           │   │
    More Subs?   Last Sub? 
         │           │   │
       Loop         END  │
         │           │   │
         └───────────┴───┘
                     │
                     ▼
                    END
```

---

## 5. Google Calendar Sync Flow

```
                    START
                      │
                      ▼
           ┌──────────────────┐
           │ User Clicks      │
           │"Connect Calendar"│
           └─────────┬────────┘
                     │
                     ▼
           ┌──────────────────┐
           │ Open OAuth Popup │
           └─────────┬────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │ Redirect to Google     │
        │ OAuth Consent Screen   │
        └────────┬───────────────┘
                 │
         ┌───────┴────────┐
         │                │
    User Grants      User Denies
    Permission?      Permission?
         │                │
        YES              NO
         │                │
         ▼                ▼
  ┌─────────────┐  ┌──────────────┐
  │ Google      │  │ Close Popup  │
  │ Returns     │  │ Show Error   │
  │ Auth Code   │  └──────┬───────┘
  └──────┬──────┘         │
         │                │
         ▼                │
  ┌─────────────┐         │
  │ Redirect to │         │
  │ Backend     │         │
  │ /callback   │         │
  └──────┬──────┘         │
         │                │
         ▼                │
  ┌─────────────┐         │
  │ Exchange    │         │
  │ Auth Code   │         │
  │ for Tokens  │         │
  └──────┬──────┘         │
         │                │
         ▼                │
  ┌─────────────┐         │
  │ Receive:    │         │
  │ -Access     │         │
  │  Token      │         │
  │ -Refresh    │         │
  │  Token      │         │
  │ -Expiry     │         │
  └──────┬──────┘         │
         │                │
         ▼                │
  ┌─────────────┐         │
  │ Save Tokens │         │
  │ to Database │         │
  │ (User Table)│         │
  └──────┬──────┘         │
         │                │
         ▼                │
  ┌─────────────┐         │
  │ PostMessage │         │
  │ to Parent   │         │
  │ Window      │         │
  └──────┬──────┘         │
         │                │
         ▼                │
  ┌─────────────┐         │
  │ Close Popup │         │
  └──────┬──────┘         │
         │                │
         ▼                │
  ┌─────────────┐         │
  │ Frontend:   │         │
  │ Show Success│         │
  │ Message     │         │
  └──────┬──────┘         │
         │                │
         ▼                │
  ┌─────────────┐         │
  │ Query All   │         │
  │ User's      │         │
  │Subscriptions│         │
  └──────┬──────┘         │
         │                │
  ┌──────┴──────┐         │
  │             │         │
Has Subs?    No Subs?     │
  │             │         │
 YES           NO         │
  │             │         │
  ▼             ▼         │
┌────────┐  ┌────────┐   │
│Sync All│  │  Done  │   │
│ Subs to│  └───┬────┘   │
│Calendar│      │        │
│        │      │        │
│(For    │      │        │
│ Each   │      │        │
│ Sub)   │      │        │
└───┬────┘      │        │
    │           │        │
    ▼           │        │
┌────────┐      │        │
│Create  │      │        │
│Event   │      │        │
│with    │      │        │
│Recur-  │      │        │
│rence   │      │        │
└───┬────┘      │        │
    │           │        │
    └───────────┴────────┘
                │
                ▼
               END
```

---

## 6. Budget Tracking Flow

```
                    START
                      │
                      ▼
           ┌──────────────────┐
           │ User Sets/Updates│
           │ Monthly Budget   │
           └─────────┬────────┘
                     │
                     ▼
           ┌──────────────────┐
           │ Save Budget to   │
           │ User Preferences │
           └─────────┬────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │ Query All Active       │
        │ Subscriptions for User │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │ Calculate Total    │
        │ Monthly Recurring  │
        │ Cost (Sum Prices)  │
        └────────┬───────────┘
                 │
                 ▼
        ┌────────────────────┐
        │ Group by Category  │
        └────────┬───────────┘
                 │
                 ▼
        ┌────────────────────┐
        │ Calculate % of     │
        │ Budget Used:       │
        │ (Total/Budget)*100 │
        └────────┬───────────┘
                 │
         ┌───────┴────────┐
         │                │
    Over Budget      Under Budget
    (>100%)?         (<100%)?
         │                │
        YES              NO
         │                │
         ▼                ▼
  ┌─────────────┐  ┌──────────────┐
  │ Set Status: │  │ Set Status:  │
  │   "OVER"    │  │    "OK"      │
  └──────┬──────┘  └──────┬───────┘
         │                │
         ▼                │
  ┌─────────────┐         │
  │ Calculate   │         │
  │ Overspend   │         │
  │ Amount      │         │
  └──────┬──────┘         │
         │                │
         ▼                │
  ┌─────────────┐         │
  │ Create      │         │
  │ Warning     │         │
  │ Notification│         │
  └──────┬──────┘         │
         │                │
         ▼                │
  ┌─────────────┐         │
  │ Send to     │         │
  │ Notification│         │
  │ Service     │         │
  └──────┬──────┘         │
         │                │
         ▼                │
  ┌─────────────┐         │
  │ Call AI     │         │
  │ Service for │         │
  │Savings Recs │         │
  └──────┬──────┘         │
         │                │
         └────────┬───────┘
                  │
                  ▼
           ┌──────────────┐
           │ Display      │
           │ Budget       │
           │ Dashboard:   │
           │              │
           │ - Total Spend│
           │ - Budget     │
           │ - % Used     │
           │ - Categories │
           │ - Status     │
           └──────┬───────┘
                  │
                  ▼
           ┌──────────────┐
           │ Auto-refresh │
           │ on Sub Add/  │
           │ Edit/Delete  │
           └──────┬───────┘
                  │
                  ▼
                 END
```

---

## 7. AI Recommendations Flow

```
                    START
                      │
                      ▼
           ┌──────────────────┐
           │ User Clicks      │
           │"Get Recommenda-  │
           │     tions"       │
           └─────────┬────────┘
                     │
                     ▼
           ┌──────────────────┐
           │ Frontend Sends   │
           │ Request to       │
           │ Backend          │
           └─────────┬────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │ Backend Gathers:       │
        │ - All Subscriptions    │
        │ - Spending History     │
        │ - Category Breakdown   │
        │ - Budget Info          │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │ Format Data for    │
        │ AI Service         │
        └────────┬───────────┘
                 │
                 ▼
        ┌────────────────────┐
        │ Send POST to       │
        │ AI Service:        │
        │ /api/analyze       │
        └────────┬───────────┘
                 │
                 ▼
        ┌────────────────────┐
        │ AI Service:        │
        │ Analyze Patterns   │
        └────────┬───────────┘
                 │
                 ▼
        ┌────────────────────┐
        │ Identify:          │
        │ - Unused/Duplicate │
        │ - Overlapping      │
        │ - Expensive Plans  │
        │ - Yearly vs Monthly│
        └────────┬───────────┘
                 │
                 ▼
        ┌────────────────────┐
        │ Generate           │
        │ Recommendations:   │
        │                    │
        │ 1. Cancel unused   │
        │ 2. Switch plans    │
        │ 3. Share with      │
        │    family          │
        │ 4. Bundle savings  │
        └────────┬───────────┘
                 │
                 ▼
        ┌────────────────────┐
        │ Calculate Potential│
        │ Savings Amount     │
        └────────┬───────────┘
                 │
                 ▼
        ┌────────────────────┐
        │ Return JSON:       │
        │ {                  │
        │   recommendations, │
        │   totalSavings,    │
        │   priority,        │
        │   actions          │
        │ }                  │
        └────────┬───────────┘
                 │
                 ▼
        ┌────────────────────┐
        │ Backend Receives   │
        │ & Forwards to      │
        │ Frontend           │
        └────────┬───────────┘
                 │
                 ▼
        ┌────────────────────┐
        │ Display:           │
        │                    │
        │ 📊 Analytics Card  │
        │ 💡 Recommendations │
        │ 💰 Savings Amount  │
        │ 🎯 Action Buttons  │
        └────────┬───────────┘
                 │
         ┌───────┴────────┐
         │                │
    User Takes      User Dismisses
     Action?           ?
         │                │
        YES              NO
         │                │
         ▼                ▼
  ┌─────────────┐  ┌──────────────┐
  │ Execute     │  │  Store       │
  │ Action      │  │  Recommend.  │
  │ (Cancel/    │  │  for Later   │
  │  Edit Sub)  │  └──────┬───────┘
  └──────┬──────┘         │
         │                │
         └────────┬───────┘
                  │
                  ▼
                 END
```

---

## 8. Edit/Delete Subscription Flow

```
                    START
                      │
          ┌───────────┴───────────┐
          │                       │
      Edit Mode?             Delete Mode?
          │                       │
         YES                     YES
          │                       │
          ▼                       ▼
   ┌─────────────┐        ┌─────────────┐
   │ User Clicks │        │ User Clicks │
   │"Edit" Button│        │"Delete" Btn │
   └──────┬──────┘        └──────┬──────┘
          │                      │
          ▼                      ▼
   ┌─────────────┐        ┌─────────────┐
   │ Load Current│        │ Show Confirm│
   │ Subscription│        │   Dialog    │
   │    Data     │        └──────┬──────┘
   └──────┬──────┘               │
          │                ┌─────┴──────┐
          ▼                │            │
   ┌─────────────┐    Confirm?      Cancel?
   │ User Modifies    │            │
   │    Fields   │   YES           NO
   └──────┬──────┘    │            │
          │           ▼            ▼
          ▼     ┌─────────┐  ┌────────┐
   ┌─────────────┐ │ Send DELETE CloseDlg
   │ Click "Save"│ │   Request   └───┬────┘
   └──────┬──────┘ └──────┬──────┘   │
          │               │          │
          ▼               ▼          │
   ┌─────────────┐  ┌──────────┐    │
   │ Validate    │  │ Backend: │    │
   │  Changes    │  │  Delete  │    │
   └──────┬──────┘  │ from DB  │    │
          │         └────┬─────┘    │
   ┌──────┴──────┐      │          │
   │             │      ▼          │
Valid?       Invalid? ┌─────┐      │
   │             │    │Delete│      │
  YES            NO   │Google│      │
   │             │    │Event │      │
   ▼             ▼    └──┬───┘      │
┌────────┐  ┌─────┐     │          │
│ Send   │  │Error│     ▼          │
│ PUT    │  │Show │  ┌─────┐       │
│Request │  └──┬──┘  │Return       │
└───┬────┘     │     │Success      │
    │          └─────┤  200 │       │
    ▼                └──┬───┘       │
┌────────┐              │          │
│Backend:│              │          │
│ Update │              │          │
│  in DB │              │          │
└───┬────┘              │          │
    │                   │          │
    ▼                   │          │
┌────────┐              │          │
│ Check  │              │          │
│ if Date│              │          │
│Changed?│              │          │
└───┬────┘              │          │
    │                   │          │
┌───┴────┐              │          │
│        │              │          │
Date    No              │          │
Changed?Change          │          │
│        │              │          │
YES      NO             │          │
│        │              │          │
▼        │              │          │
┌────┐   │              │          │
│Update   │              │          │
│Google   │              │          │
│Event │  │              │          │
└─┬──┘   │              │          │
  │      │              │          │
  └──┬───┘              │          │
     │                  │          │
     ▼                  │          │
┌────────┐              │          │
│ Return │              │          │
│ Success│              │          │
└───┬────┘              │          │
    │                   │          │
    └────────┬──────────┘          │
             │                     │
             ▼                     │
      ┌─────────────┐              │
      │ Frontend:   │              │
      │ Show Success│              │
      │   Message   │              │
      └──────┬──────┘              │
             │                     │
             ▼                     │
      ┌─────────────┐              │
      │  Refresh    │              │
      │Subscription │              │
      │    List     │              │
      └──────┬──────┘              │
             │                     │
             └─────────────────────┘
                      │
                      ▼
                     END
```

