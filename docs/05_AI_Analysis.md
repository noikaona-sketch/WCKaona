# AI Analysis
## Objective
Use AI Vision to analyze required images and suggest wood grades.
AI should assist inspectors, not replace them.
Final grade is determined by Inspector.
---
# Required Images
## 1. Truck Plate
Purpose
Read vehicle registration.
Expected Result
Truck plate number.
Example
70-1234
---
## 2. Moisture Meter
Purpose
Read moisture percentage.
Expected Result
Moisture %
Example
34.5 %
---
## 3. Wood Load with PVC Reference
Purpose
Estimate wood size using PVC as scale reference.
Expected Result
Approximate diameter range.
Estimated number of logs.
Suggested grade.
---
# AI Tasks
## OCR
Read
* Truck Plate
* Moisture Meter
---
## Image Analysis
Estimate
* Log diameter
* Number of logs
* Wood condition
---
## Grade Recommendation
Examples
A+
A
B+
B
C
---
# Confidence Score
Range
0 - 100
Example
92 %
Low confidence should require manual review.
---
# AI Output
truck_plate
moisture_percent
estimated_log_count
estimated_diameter_min_cm
estimated_diameter_max_cm
wood_condition
suggested_grade
confidence
summary
---
# JSON Response Example
```json
{
  "truck_plate": "70-1234",
  "moisture_percent": 34.5,
  "estimated_log_count": 56,
  "estimated_diameter_min_cm": 20,
  "estimated_diameter_max_cm": 35,
  "wood_condition": "normal",
  "suggested_grade": "B+",
  "confidence": 92,
  "summary": "Wood quality is acceptable."
}
```
---
# Rules
AI is advisory only.
Inspector makes final decision.
Every manual adjustment must record a reason.
AI response JSON should be stored for audit purposes.
Do not expose AI keys to client applications.
AI execution should run through server or n8n.
---
# Future Improvements
Species recognition
Wood defect detection
Bark ratio estimation
Burnt wood detection
Log counting
Supplier quality scoring
Automatic anomaly detection
