# Flowcharts (Mermaid Format)

## 1. User Registration Flow

```mermaid
---
title: User Registration Flow
---
flowchart TD
    Start([Start]) --> OpenApp[User Opens App]
    OpenApp --> ClickSignup[Click Sign Up]
    ClickSignup --> EnterData[Enter Email, Password, Name]
    EnterData --> Validate{Valid Input?}
    
    Validate -->|No| ShowError[Show Error Message]
    ShowError --> EnterData
    
    Validate -->|Yes| HashPass[Hash Password]
    HashPass --> CheckEmail{Email Unique?}
    
    CheckEmail -->|No| EmailTaken[Error: Email Already Taken]
    EmailTaken --> EnterData
    
    CheckEmail -->|Yes| CreateUser[Create User in Database]
    CreateUser --> GenToken[Generate JWT Token]
    GenToken --> SendEmail[Send Welcome Email]
    SendEmail --> Redirect[Redirect to Dashboard]
    Redirect --> End([End])
    
    style Start fill:#4CAF50,stroke:#2E7D32,color:#fff
    style End fill:#F44336,stroke:#C62828,color:#fff
    style Validate fill:#FF9800,stroke:#E65100,color:#fff
    style CheckEmail fill:#FF9800,stroke:#E65100,color:#fff
```

## 2. User Login Flow

```mermaid
---
title: User Login Flow
---
flowchart TD
    Start([Start]) --> OpenApp[User Opens App]
    OpenApp --> ClickLogin[Click Login]
    ClickLogin --> EnterCreds[Enter Email/Password]
    EnterCreds --> Submit[Submit Credentials]
    Submit --> QueryUser[Backend: Query User by Email]
    
    QueryUser --> UserFound{User Found?}
    
    UserFound -->|No| ErrorInvalid[Error: Invalid Credentials]
    ErrorInvalid --> EnterCreds
    
    UserFound -->|Yes| VerifyPass[Verify Password Hash]
    VerifyPass --> PassMatch{Password Match?}
    
    PassMatch -->|No| ErrorPass[Error: Invalid Password]
    ErrorPass --> EnterCreds
    
    PassMatch -->|Yes| GenToken[Generate JWT Token]
    GenToken --> UpdateLast[Update Last Login]
    UpdateLast --> ReturnToken[Return Token to Frontend]
    ReturnToken --> StoreToken[Store Token in Local Storage]
    StoreToken --> Navigate[Navigate to Dashboard]
    Navigate --> End([End])
    
    style Start fill:#4CAF50,stroke:#2E7D32,color:#fff
    style End fill:#F44336,stroke:#C62828,color:#fff
    style UserFound fill:#FF9800,stroke:#E65100,color:#fff
    style PassMatch fill:#FF9800,stroke:#E65100,color:#fff
```

## 3. Add Subscription Flow

```mermaid
---
title: Add Subscription Flow
---
flowchart TD
    Start([Start]) --> ClickAdd[User Clicks Add Subscription]
    ClickAdd --> OpenForm[Open Subscription Form]
    OpenForm --> FillForm[User Fills Form:<br/>Name, Price, Billing Cycle,<br/>Date, Category, Payment Method]
    FillForm --> ClickSave[Click Save]
    ClickSave --> ValidateForm{All Fields Valid?}
    
    ValidateForm -->|No| ShowError[Show Error Messages]
    ShowError --> FillForm
    
    ValidateForm -->|Yes| SendPost[Send POST to Backend]
    SendPost --> InsertDB[Backend: Insert into Database]
    InsertDB --> GetToken[Get User's Google Calendar Token]
    
    GetToken --> TokenValid{Token Valid?}
    
    TokenValid -->|No| SkipSync[Skip Calendar Sync]
    TokenValid -->|Yes| CreateEvent[Create Event in Google Calendar]
    
    CreateEvent --> SetRecur[Set Recurrence Rules]
    SetRecur --> AddRemind[Add Reminders]
    AddRemind --> StoreEventID[Store Event ID]
    
    StoreEventID --> ReturnSuccess[Return Success Response]
    SkipSync --> ReturnSuccess
    
    ReturnSuccess --> UpdateUI[Update UI: Show Success Message]
    UpdateUI --> RefreshList[Refresh Subscription List]
    RefreshList --> End([End])
    
    style Start fill:#4CAF50,stroke:#2E7D32,color:#fff
    style End fill:#F44336,stroke:#C62828,color:#fff
    style ValidateForm fill:#FF9800,stroke:#E65100,color:#fff
    style TokenValid fill:#FF9800,stroke:#E65100,color:#fff
```

## 4. Payment Reminder Process

```mermaid
---
title: Payment Reminder Process
---
flowchart TD
    Start([Start]) --> CronTrigger[Cron Job Triggers Daily at 8 AM]
    CronTrigger --> GetDate[Get Current Date]
    GetDate --> QuerySubs[Query All Active Subscriptions<br/>Due Within Reminder Window]
    
    QuerySubs --> SubsFound{Subscriptions Found?}
    
    SubsFound -->|No| LogNoReminders[Log: No Reminders Today]
    LogNoReminders --> End([End])
    
    SubsFound -->|Yes| LoopStart[Loop Through Each Subscription]
    LoopStart --> GetUser[Get User Details]
    GetUser --> CheckPrefs[Check User Notification Preferences]
    
    CheckPrefs --> RemindersEnabled{Reminders Enabled?}
    
    RemindersEnabled -->|No| SkipUser[Skip User]
    RemindersEnabled -->|Yes| FormatMsg[Format Message:<br/>Name, Date, Amount]
    
    FormatMsg --> CheckChannel[Check Notification Channel]
    CheckChannel --> SendEmail[Send Email]
    CheckChannel --> SendSMS[Send SMS]
    CheckChannel --> AddCalendar[Add Calendar Reminder]
    
    SendEmail --> SaveNotif[Save to Notification Table]
    SendSMS --> SaveNotif
    AddCalendar --> SaveNotif
    
    SaveNotif --> MarkSent[Mark as Sent]
    SkipUser --> MoreSubs{More Subscriptions?}
    MarkSent --> MoreSubs
    
    MoreSubs -->|Yes| LoopStart
    MoreSubs -->|No| End
    
    style Start fill:#4CAF50,stroke:#2E7D32,color:#fff
    style End fill:#F44336,stroke:#C62828,color:#fff
    style SubsFound fill:#FF9800,stroke:#E65100,color:#fff
    style RemindersEnabled fill:#FF9800,stroke:#E65100,color:#fff
    style MoreSubs fill:#FF9800,stroke:#E65100,color:#fff
```

## 5. Google Calendar Sync Flow

```mermaid
---
title: Google Calendar Sync Flow
---
flowchart TD
    Start([Start]) --> ClickConnect[User Clicks Connect Calendar]
    ClickConnect --> OpenPopup[Open OAuth Popup]
    OpenPopup --> RedirectGoogle[Redirect to Google OAuth Consent Screen]
    
    RedirectGoogle --> UserDecision{User Grants Permission?}
    
    UserDecision -->|No| ClosePopup[Close Popup]
    ClosePopup --> ShowError[Show Error]
    ShowError --> End([End])
    
    UserDecision -->|Yes| ReturnCode[Google Returns Auth Code]
    ReturnCode --> RedirectCallback[Redirect to Backend /callback]
    RedirectCallback --> ExchangeCode[Exchange Auth Code for Tokens]
    ExchangeCode --> ReceiveTokens[Receive:<br/>Access Token,<br/>Refresh Token,<br/>Expiry]
    ReceiveTokens --> SaveTokens[Save Tokens to Database]
    SaveTokens --> PostMessage[PostMessage to Parent Window]
    PostMessage --> ClosePopupSuccess[Close Popup]
    ClosePopupSuccess --> ShowSuccess[Frontend: Show Success Message]
    ShowSuccess --> QuerySubs[Query All User's Subscriptions]
    
    QuerySubs --> HasSubs{Has Subscriptions?}
    
    HasSubs -->|No| Done[Done]
    HasSubs -->|Yes| SyncAll[Sync All Subs to Calendar]
    
    SyncAll --> CreateEvents[For Each Sub:<br/>Create Event with Recurrence]
    CreateEvents --> Done
    Done --> End
    
    style Start fill:#4CAF50,stroke:#2E7D32,color:#fff
    style End fill:#F44336,stroke:#C62828,color:#fff
    style UserDecision fill:#FF9800,stroke:#E65100,color:#fff
    style HasSubs fill:#FF9800,stroke:#E65100,color:#fff
```

## 6. Budget Tracking Flow

```mermaid
---
title: Budget Tracking Flow
---
flowchart TD
    Start([Start]) --> SetBudget[User Sets/Updates Monthly Budget]
    SetBudget --> SavePrefs[Save Budget to User Preferences]
    SavePrefs --> QuerySubs[Query All Active Subscriptions for User]
    QuerySubs --> CalcTotal[Calculate Total Monthly Recurring Cost]
    CalcTotal --> GroupCat[Group by Category]
    GroupCat --> CalcPercent[Calculate % of Budget Used:<br/>Total/Budget × 100]
    
    CalcPercent --> CheckBudget{Over Budget?}
    
    CheckBudget -->|No| SetStatusOK[Set Status: OK]
    CheckBudget -->|Yes| SetStatusOver[Set Status: OVER]
    
    SetStatusOver --> CalcOver[Calculate Overspend Amount]
    CalcOver --> CreateWarning[Create Warning Notification]
    CreateWarning --> SendNotif[Send to Notification Service]
    SendNotif --> CallAI[Call AI Service for Savings Recommendations]
    
    CallAI --> DisplayDash[Display Budget Dashboard]
    SetStatusOK --> DisplayDash
    
    DisplayDash --> AutoRefresh[Auto-refresh on Sub Add/Edit/Delete]
    AutoRefresh --> End([End])
    
    style Start fill:#4CAF50,stroke:#2E7D32,color:#fff
    style End fill:#F44336,stroke:#C62828,color:#fff
    style CheckBudget fill:#FF9800,stroke:#E65100,color:#fff
```

## 7. AI Recommendations Flow

```mermaid
---
title: AI Recommendations Flow
---
flowchart TD
    Start([Start]) --> ClickRec[User Clicks Get Recommendations]
    ClickRec --> SendRequest[Frontend Sends Request to Backend]
    SendRequest --> GatherData[Backend Gathers:<br/>- All Subscriptions<br/>- Spending History<br/>- Category Breakdown<br/>- Budget Info]
    GatherData --> FormatData[Format Data for AI Service]
    FormatData --> PostAI[Send POST to AI Service:<br/>/api/analyze]
    PostAI --> Analyze[AI Service: Analyze Patterns]
    Analyze --> Identify[Identify:<br/>- Unused/Duplicate<br/>- Overlapping<br/>- Expensive Plans<br/>- Yearly vs Monthly]
    Identify --> GenRec[Generate Recommendations:<br/>1. Cancel unused<br/>2. Switch plans<br/>3. Share with family<br/>4. Bundle savings]
    GenRec --> CalcSavings[Calculate Potential Savings Amount]
    CalcSavings --> ReturnJSON[Return JSON:<br/>recommendations,<br/>totalSavings,<br/>priority,<br/>actions]
    ReturnJSON --> ForwardFront[Backend Receives & Forwards to Frontend]
    ForwardFront --> Display[Display:<br/>📊 Analytics Card<br/>💡 Recommendations<br/>💰 Savings Amount<br/>🎯 Action Buttons]
    
    Display --> UserAction{User Takes Action?}
    
    UserAction -->|No| StoreLater[Store Recommendation for Later]
    UserAction -->|Yes| ExecuteAction[Execute Action<br/>Cancel/Edit Sub]
    
    StoreLater --> End([End])
    ExecuteAction --> End
    
    style Start fill:#4CAF50,stroke:#2E7D32,color:#fff
    style End fill:#F44336,stroke:#C62828,color:#fff
    style UserAction fill:#FF9800,stroke:#E65100,color:#fff
```

## 8. Edit/Delete Subscription Flow

```mermaid
---
title: Edit/Delete Subscription Flow
---
flowchart TD
    Start([Start]) --> Mode{Mode?}
    
    Mode -->|Edit| ClickEdit[User Clicks Edit Button]
    Mode -->|Delete| ClickDelete[User Clicks Delete Button]
    
    ClickEdit --> LoadData[Load Current Subscription Data]
    LoadData --> UserModify[User Modifies Fields]
    UserModify --> ClickSave[Click Save]
    
    ClickSave --> ValidateChanges{Valid Changes?}
    ValidateChanges -->|No| ShowError[Show Error]
    ShowError --> UserModify
    
    ValidateChanges -->|Yes| SendPUT[Send PUT Request]
    SendPUT --> UpdateDB[Backend: Update in Database]
    UpdateDB --> DateChanged{Date Changed?}
    
    DateChanged -->|Yes| UpdateGoogleEvent[Update Google Calendar Event]
    DateChanged -->|No| ReturnSuccess[Return Success Response]
    UpdateGoogleEvent --> ReturnSuccess
    
    ClickDelete --> ShowConfirm[Show Confirm Dialog]
    ShowConfirm --> UserConfirm{Confirm?}
    
    UserConfirm -->|No| CloseDialog[Close Dialog]
    CloseDialog --> End([End])
    
    UserConfirm -->|Yes| SendDELETE[Send DELETE Request]
    SendDELETE --> DeleteDB[Backend: Delete from Database]
    DeleteDB --> DeleteGoogle[Delete Google Calendar Event]
    DeleteGoogle --> Return200[Return Success 200]
    
    Return200 --> ShowSuccess[Frontend: Show Success Message]
    ReturnSuccess --> ShowSuccess
    
    ShowSuccess --> RefreshList[Refresh Subscription List]
    RefreshList --> End
    
    style Start fill:#4CAF50,stroke:#2E7D32,color:#fff
    style End fill:#F44336,stroke:#C62828,color:#fff
    style Mode fill:#2196F3,stroke:#1565C0,color:#fff
    style ValidateChanges fill:#FF9800,stroke:#E65100,color:#fff
    style DateChanged fill:#FF9800,stroke:#E65100,color:#fff
    style UserConfirm fill:#FF9800,stroke:#E65100,color:#fff
```

---

## How to Use These Diagrams:

### **Option 1: View in VS Code** (Recommended)
1. Install extension: "Markdown Preview Mermaid Support"
2. Open any `.md` file
3. Press `Ctrl+Shift+V` (Windows) or `Cmd+Shift+V` (Mac)
4. Diagrams render beautifully!

### **Option 2: View & Export Online**
1. Go to https://mermaid.live/
2. Copy any diagram code
3. Paste into the editor
4. Click "Download PNG" or "Download SVG"

### **Option 3: GitHub**
- Push to GitHub - diagrams render automatically in README files

### **Option 4: Export to PowerPoint/PDF**
1. Use mermaid.live to export as PNG (high resolution)
2. Insert images into PowerPoint presentation
3. Add titles and descriptions
