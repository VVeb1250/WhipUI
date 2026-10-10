---
id: B2
family: CREATE_TO_SHIP
specificity: detailed
character: utilitarian
judged_on: preference, task fit, usability spot-check
viewports: [1440x900, 390x844]
---
Expense dashboard for a 12-person design studio (static HTML/CSS/JS, mock data inline).
Users: studio manager (approves), staff (submit). Primary task: the manager sees what needs approval this week and approves or rejects fast.
Data: 30 expenses (date, person, category, amount THB, status pending/approved/rejected, receipt yes/no). Show this-month total vs budget (฿180,000).
Must handle: empty state (no pending), long names, a 500 error state for loading, Thai and English names. Keyboard accessible.
