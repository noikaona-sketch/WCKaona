# 33 LINE Integration

## Objective
Integrate LINE as the primary user interface.

## Components

- LINE OA
- LIFF
- Webhook
- n8n
- Supabase

## Main Flow

1. User uploads images.
2. Webhook receives event.
3. n8n processes request.
4. AI analyzes images.
5. Result stored in database.
6. Reply sent to LINE.

## Security

- Verify webhook signature.
- Store channel secrets securely.
- Prevent replay attacks.
- Audit message processing.

## Future

- Rich menu
- Push notifications
- Approval workflow
- LINE Flex Messages
