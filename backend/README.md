# Arbiter backend

This backend is responsible for monitoring arbitration requests and email arbiter owners about their next actions.

## Services

- **emailing**: Sends emails to arbiter owners
- **subgraph**: Retrieves data from the bel2 arbiter subgraph
- **transaction-handler**: Discovers transactions, sends emails when arbitrations are requested
- **registration**: Associates arbiter evm address with email address

## Development

```bash
docker-compose up -d
```