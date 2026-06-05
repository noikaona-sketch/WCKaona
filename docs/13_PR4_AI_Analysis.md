# PR#4 AI Analysis

## Objective

Implement AI-assisted image analysis for wood receiving receipts.

AI assists inspectors only. The inspector makes the final decision.

## Scope

- Analyze 3 required images as one receipt set
- OCR truck plate
- OCR moisture meter
- Analyze wood load with PVC reference
- Suggest grade
- Return confidence score
- Store AI result JSON for audit

## Input Images

1. truck_plate
2. moisture_meter
3. wood_with_pvc

## AI Tasks

### Truck Plate OCR

Expected output:

- truck_plate

### Moisture Meter OCR

Expected output:

- moisture_percent

### Wood + PVC Analysis

Expected output:

- estimated_log_count
- estimated_diameter_min_cm
- estimated_diameter_max_cm
- wood_condition
- suggested_grade
- confidence
- summary

## JSON Output Example

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

## Workflow

Submitted

-> AI Processing

-> Pending Inbound Scale or Pending Review depending on configured workflow

## Security Rules

- Do not expose AI keys in client code
- AI must run through server route or n8n
- Store raw AI JSON result
- Log AI analysis attempt
- Handle AI failure safely

## Failure Handling

If AI fails:

- Keep receipt active
- Mark status as AI Failed or Pending Manual Review
- Allow inspector to review manually
- Store error summary in audit log

## Acceptance Criteria

- AI receives the 3-image set
- AI returns structured JSON
- AI result is saved to receipt and image metadata
- Inspector can see AI result
- Low confidence is clearly shown
- No AI key is visible in browser
