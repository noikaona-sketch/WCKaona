# 26 API Design

## Objective
Define internal APIs for receipt processing and reporting.

## Main APIs

- Create Receipt
- Upload Image
- Run AI Analysis
- Get Receipt Detail
- Get Supplier Summary
- Get Reports

## Principles

- REST style endpoints
- JSON responses
- Versioned APIs
- Authentication required

## Security

- JWT validation
- RLS enforced at database layer
- Rate limiting
- Audit logging

## Future

- Public API
- Webhook support
- API usage metrics
