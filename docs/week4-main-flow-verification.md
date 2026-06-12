# Week 4 Main Flow Verification

## Goal

Run one minimum verifiable Guardian Agent Wallet flow:

```text
input
-> AI / agent intent handling
-> risk and policy decision
-> Web3 execution mechanism
-> verifiable result
```

## Input

```text
支付 0.0001 SETH 给 数据 API 服务商
```

## AI / Agent Handling

The intent parser converted the natural-language input into:

```json
{
  "action": "transfer",
  "amount": 0.0001,
  "token": "SETH",
  "recipient": "data-api-provider",
  "chainId": 8453
}
```

## Risk Result

```json
{
  "score": 5,
  "level": "LOW",
  "warningCount": 1
}
```

## Policy Result

```json
{
  "decision": "ALLOW",
  "riskLevel": "LOW",
  "score": 10,
  "triggeredRules": ["all_checks_passed"]
}
```

## Web3 Mechanism

The server-side CAW execution path was used.

CAW request preview:

```json
{
  "chainId": "SETH",
  "tokenId": "SETH",
  "amount": "0.0001",
  "recipient": "data-api-provider",
  "displayRecipient": "数据 API 服务商",
  "resolvedRecipientAddress": "0x24870681a481856b69D85D41C6f2401575228861",
  "recipientIsFallback": false,
  "pactIdPresent": true,
  "walletIdPresent": true
}
```

CAW payload preview:

```json
{
  "src_addr": "0x4d4f96ac02dbfa885ac22a33b87e7579b3b860e0",
  "dst_addr": "0x24870681a481856b69D85D41C6f2401575228861",
  "tokenId": "SETH",
  "chainId": "SETH",
  "amount": "0.0001",
  "requestId": "guardian-caw-bbfe7c2e-6bec-4191-a308-29b260ab5cd9",
  "pactIdPresent": true
}
```

## Verifiable Result

CAW accepted the request.

```json
{
  "success": true,
  "status": "pending",
  "executionMode": "real-caw",
  "walletMode": "caw",
  "message": "CAW request accepted, transaction hash is not available yet.",
  "requestId": "guardian-caw-bbfe7c2e-6bec-4191-a308-29b260ab5cd9",
  "receiptId": "ac350142-c728-4952-8f54-209b9e6a147c",
  "transactionRecordId": "ac350142-c728-4952-8f54-209b9e6a147c",
  "cawStatus": "Processing",
  "txHash": ""
}
```

Latest status check:

```json
{
  "success": true,
  "requestId": "guardian-caw-bbfe7c2e-6bec-4191-a308-29b260ab5cd9",
  "status": "pending",
  "txHash": "",
  "safeRecord": {
    "id": "ac350142-c728-4952-8f54-209b9e6a147c",
    "status": 400,
    "subStatus": "signing"
  }
}
```

No transaction hash was available at verification time. No fake transaction hash was generated.

## Verification Commands

```powershell
npm.cmd run test
npm.cmd run lint
npm.cmd run build
```

Results are recorded after command execution.

## Verification Results

- `npm.cmd run test`: passed, 56 tests passed
- `npm.cmd run lint`: passed
- `npm.cmd run build`: passed
