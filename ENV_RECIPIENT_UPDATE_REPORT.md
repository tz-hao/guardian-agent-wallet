# ENV Recipient Update Report

## Scope

Updated local recipient-related CAW environment variables in `.env.local` for the Guardian Agent Wallet project.

Project path:

`C:\Users\71546\Documents\Codex\2026-05-18\guardian-agent-wallet`

## Variables Updated

The following variables were added or updated:

- `CAW_DESTINATION`
- `CAW_RECIPIENT_DATA_API`
- `CAW_RECIPIENT_AI_INFERENCE`
- `CAW_RECIPIENT_ONCHAIN_ANALYTICS`
- `CAW_RECIPIENT_RESEARCH_FEED`

All five variables now point to the configured local demo recipient address.

## Safety Checks

- Existing `AGENT_WALLET_API_URL` was preserved.
- Existing `AGENT_WALLET_API_KEY` was preserved and was not printed.
- Existing `AGENT_WALLET_WALLET_ID` was preserved.
- Existing variable keys were updated in place instead of duplicated.
- `.env.local` remains ignored by git.

## Commands Run

```powershell
git check-ignore -v .env.local
npm.cmd run test
npm.cmd run lint
npm.cmd run build
```

## Results

- `git check-ignore -v .env.local`: Passed. `.env.local` is ignored by `.gitignore`.
- `npm.cmd run test`: Passed. 42 tests passed.
- `npm.cmd run lint`: Passed.
- `npm.cmd run build`: Passed.

## Notes

- No CAW API key or server credential was exposed.
- The production build detected `.env.local`, which is expected for local runtime configuration.
