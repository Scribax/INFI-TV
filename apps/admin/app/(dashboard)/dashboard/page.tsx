"use client";

import { useStats } from "@/hooks/resources";
import { Spinner } from "@/components/ui/spinner";

function Stat({
  label,
  value,
  icon,
  breakdown,
}: {
  label: string;
  value: number;
  icon: string;
  breakdown: Array<{ label: string; value: number; tone: string }>;
}) {
  return (
    <div className="card flex flex-col gap-3 p-5 transition-shadow hover:shadow-card-hover">
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink-muted">{label}</span>
        <span className="text-lg" aria-hidden>
          {icon}
        </span>
      </div>
      <div className="text-3xl font-semibold tabular-nums text-ink">
        {value.toLocaleString("es-AR")}
      </div>
      <div className="flex flex-wrap gap-2">
        {breakdown.map((b) => (
          <span
            key={b.label}
            className="rounded-md border border-line bg-raised/60 px-2 py-1 text-xs text-ink-muted"
          >
            {b.label}{" "}
            <span className="font-semibold tabular-nums text-ink">
              {b.value.toLocaleString("es-AR")}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useStats();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  if (isError || data === undefined) {
    return (
      <p className="text-sm text-danger">
        No se pudieron cargar las métricas. Reintentá.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Resumen general de la operación.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Clientes"
          value={data.customers.total}
          icon="👥"
          breakdown={[
            { label: "Activos", value: data.customers.active, tone: "text-ok" },
            { label: "Vencidos", value: data.customers.expired, tone: "text-warn" },
            { label: "Suspendidos", value: data.customers.suspended, tone: "text-danger" },
          ]}
        />
        <Stat
          label="Códigos"
          value={data.codes.total}
          icon="🎟️"
          breakdown={[
            { label: "Sin activar", value: data.codes.pending, tone: "text-ink-muted" },
            { label: "Activos", value: data.codes.active, tone: "text-ok" },
            { label: "Revocados", value: data.codes.revoked, tone: "text-danger" },
          ]}
        />
        <Stat
          label="Dispositivos"
          value={data.devices.total}
          icon="📱"
          breakdown={[
            { label: "Activos", value: data.devices.active, tone: "text-ok" },
            { label: "Bloqueados", value: data.devices.blocked, tone: "text-warn" },
          ]}
        />
        <Stat
          label="Sesiones activas"
          value={data.sessions.active}
          icon="🔐"
          breakdown={[]}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Canales"
          value={data.channels.total}
          icon="📺"
          breakdown={[
            { label: "Online", value: data.channels.online, tone: "text-ok" },
            { label: "Offline", value: data.channels.offline, tone: "text-warn" },
          ]}
        />
        <Stat
          label="Reproducciones"
          value={data.playback.plays}
          icon="▶️"
          breakdown={[
            { label: "Errores", value: data.playback.errors, tone: "text-danger" },
          ]}
        />
        <Stat
          label="Activaciones"
          value={data.activations.total}
          icon="✅"
          breakdown={[]}
        />
        <div className="card flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-muted">Última conexión</span>
            <span className="text-lg" aria-hidden>
              🕐
            </span>
          </div>
          <div className="text-lg font-semibold text-ink">
            {data.lastSeenAt !== null
              ? new Date(data.lastSeenAt).toLocaleString("es-AR")
              : "Sin actividad"}
          </div>
        </div>
      </div>
    </div>
  );
}
