# Telemetría, auditoría y logging (FASE 17)

## Telemetría (§43)

`GET /admin/stats` devuelve, en una sola consulta paralela, las métricas del
dashboard:

- `customers` — total / activos / vencidos / suspendidos.
- `codes` — total / sin activar / activos / revocados.
- `devices` — total / activos / bloqueados.
- `sessions.active` — sesiones activas.
- `activations.total` — códigos activados.
- `playback` — `plays` (reproducciones registradas en `watch_history`) y
  `errors` (canales con `streamStatus` OFFLINE o TIMEOUT).
- `channels` — total / online / offline del catálogo.
- `lastSeenAt` — última conexión de cliente (máx `customer.lastSeenAt`).

No se recolecta información personal innecesaria.

## Auditoría (§35)

`AuditService.log()` registra las acciones administrativas (actor, action,
entity, entityId, timestamp, metadata, ip). Ya cableada en: auth, códigos,
clientes, dispositivos, planes, sesiones, activaciones, admin-users y sync
IPTV/EPG. Listado: `GET /admin/audit-logs` (solo SUPER_ADMIN).

## Logging (§58)

Nest Logger con niveles INFO/WARN/ERROR + auditoría separada en `audit_logs`.
No se loguean secretos (passwords, tokens completos, códigos completos,
API keys).
