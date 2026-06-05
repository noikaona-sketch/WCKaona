# PR#3 Image Upload

## Objective

Implement image capture and upload for wood receiving receipts.

## Scope

- Capture images from mobile camera
- Require 3 images before submit
- Store image metadata
- Save GPS and timestamp
- Validate file type and file size
- Upload to Supabase Storage

## Required Images

1. Truck Plate
2. Moisture Meter
3. Wood + PVC Reference

## Image Types

- truck_plate
- moisture_meter
- wood_with_pvc

## Storage Bucket

wood-images

## Storage Path

receipt_no/image_type/timestamp.ext

Example:

WR-20260605-001/truck_plate/20260605130501.jpg

## Metadata

Each image must store:

- receipt_id
- image_type
- file_path
- file_url
- taken_by
- taken_at
- gps_lat
- gps_lng

## Validation

Allowed file types:

- jpg
- jpeg
- png
- webp

Maximum file size:

10 MB

## UI Rules

- Show image status: waiting / captured / uploaded
- Disable submit until all 3 required images are present
- Allow retake before submit
- After submit, lock images unless status is Need Retake Photo

## Security Rules

- Do not allow public upload without login
- Use authenticated user ID as taken_by
- Do not expose service role key in browser

## Acceptance Criteria

- User can capture 3 images
- Images upload to storage
- Metadata is saved
- Submit is blocked if any required image is missing
- Upload fails safely with visible error message
