# Availability measurement

## Target

The SRS target is at least 99.5% availability during scheduled exam windows.

## Health endpoints

- `GET /api/health` checks that the backend process is running.
- `GET /api/health/ready` checks that the backend is ready to serve requests requiring MongoDB.

## Measurement procedure

1. Configure an external uptime monitor to check `/api/health/ready` during scheduled exam windows.
2. Retain each check's timestamp and HTTP status.
3. Record the start and end of any unavailable interval that overlaps a scheduled exam window.
4. Calculate availability for each reporting window:

   `availability % = 100 × (scheduled window seconds - unavailable seconds) / scheduled window seconds`

5. Compare the measured result with the 99.5% target.

A passing local health check does not establish the availability target. Report the target as verified only after reviewing monitoring data from scheduled exam windows.
