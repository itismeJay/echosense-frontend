import { Wifi, WifiOff } from "lucide-react";

interface LiveStatusProps {
  online: boolean;
  uptime?: string;
}

export default function LiveStatus({ online, uptime }: LiveStatusProps) {
  return (
    <div
      className={`flex items-center gap-2.5 px-4 py-2 backdrop-blur-xl rounded-xl border transition-colors ${
        online
          ? "bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/15 dark:border-emerald-500/20"
          : "bg-red-500/5 dark:bg-red-500/10 border-red-500/15 dark:border-red-500/20"
      }`}
    >
      {online ? (
        <Wifi className="w-4 h-4 text-emerald-500 dark:text-emerald-400 animate-pulse shrink-0" />
      ) : (
        <WifiOff className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0" />
      )}
      <div>
        <p
          className={`text-xs font-semibold leading-none ${
            online ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
          }`}
        >
          {online ? "System Active" : "Offline"}
        </p>
        {online && uptime && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-none">Up {uptime}</p>
        )}
      </div>
    </div>
  );
}
