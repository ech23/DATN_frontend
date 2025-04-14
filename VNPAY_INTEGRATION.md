# VNPay Payment Integration

This document outlines the implementation of VNPay payment in the Ogani frontend application.

## Overview

The integration allows users to pay for their orders using VNPay, a popular payment gateway in Vietnam. The flow is as follows:

1. User selects products and adds them to cart
2. User proceeds to checkout
3. User fills in shipping information and selects VNPay as payment method
4. User clicks "Place Order" button
5. Frontend creates an order with "pending" payment status
6. Frontend requests a payment URL from the backend
7. User is redirected to VNPay's payment gateway
8. After payment, VNPay redirects back to our payment-result page with transaction data
9. The payment-result page verifies the transaction with the backend
10. Order status is updated based on payment result

## Frontend Implementation

The frontend implementation includes:

- `VNPayService`: Service for communicating with the backend for VNPay-related operations
- `PaymentResultComponent`: Component for handling the callback from VNPay
- Updated `CheckoutComponent`: Modified to include VNPay payment option
- Updated `OrderService`: Modified to include payment method and status updates

## Required Backend APIs

The backend must implement the following APIs to support VNPay integration:

### 1. Create Payment URL

- **Endpoint**: `POST /api/payment/vnpay/create-payment`
- **Request Body**:
  ```json
  {
    "amount": 150000,
    "orderInfo": "Payment for order #123",
    "orderId": "123"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?..."
  }
  ```

### 2. Verify Payment Callback

- **Endpoint**: `POST /api/payment/vnpay/payment-callback`
- **Request Body**: All query parameters received from VNPay
  ```json
  {
    "vnp_Amount": "1000000",
    "vnp_BankCode": "NCB",
    "vnp_OrderInfo": "Payment for order #123",
    "vnp_ResponseCode": "00",
    ...
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Payment verified successfully",
    "data": {
      "orderId": "123",
      "amount": 100000,
      "transactionId": "VNP13456789",
      "paymentDate": "2023-05-20T10:30:45"
    }
  }
  ```

### 3. Update Order Payment Status

- **Endpoint**: `POST /api/order/update-payment-status`
- **Request Body**:
  ```json
  {
    "orderId": "123",
    "paymentStatus": "completed",
    "transactionInfo": {
      "transactionId": "VNP13456789",
      "paymentDate": "2023-05-20T10:30:45",
      "bankCode": "NCB"
    }
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Order payment status updated successfully"
  }
  ```

## Backend Implementation Details

For the backend, you will need to:

1. Register a merchant account with VNPay
2. Obtain the following credentials:
   - Terminal ID (vnp_TmnCode)
   - Secret Key (vnp_HashSecret)
3. Configure the return URL (should be your frontend's payment-result page)
4. Implement the required API endpoints
5. Use VNPay's SDK or API documentation to generate payment URLs and verify callbacks

The backend should handle:
- Creating payment URLs with the correct parameters
- Verifying the hash signature from VNPay to ensure the callback is authentic
- Updating the order status in the database

## VNPay Parameters

Common parameters for VNPay requests:

- `vnp_Version`: API version (default: 2.1.0)
- `vnp_Command`: Command code (default: pay)
- `vnp_TmnCode`: Terminal ID
- `vnp_Amount`: Amount to pay (multiplied by 100)
- `vnp_CurrCode`: Currency code (default: VND)
- `vnp_TxnRef`: Transaction reference (order ID)
- `vnp_OrderInfo`: Order description
- `vnp_OrderType`: Order type (default: 190000)
- `vnp_Locale`: Language (default: vn)
- `vnp_ReturnUrl`: Return URL after payment
- `vnp_IpAddr`: IP address of the client
- `vnp_CreateDate`: Creation date in yyyyMMddHHmmss format
- `vnp_SecureHash`: Hash signature for request verification

## Testing

For testing, you can use VNPay's sandbox environment and their test cards:
- Bank: NCB
- Card Number: 9704198526191432198
- Account Name: NGUYEN VAN A
- Release Date: 07/15
- OTP: 123456 