"use client";

type HistoryEntry = { id: string; type: "add" | "sell"; quantity: number; date: string };

export function ProductHistoryModal({
  open,
  productName,
  history,
  onClose,
}: {
  open: boolean;
  productName: string;
  history: HistoryEntry[];
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-paper p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Product History</h2>
          <button onClick={onClose} className="text-sm text-ink/50 hover:text-ink">Close</button>
        </div>
        <p className="mt-1 text-sm text-ink/60">{productName}</p>
        <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
          {history.length === 0 ? (
            <p className="text-sm text-ink/40">No history yet.</p>
          ) : (
            history.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm">
                <span className={entry.type === "add" ? "text-emerald-600" : "text-red-600"}>
                  {entry.type === "add" ? "Added" : "Sold"} {entry.quantity}
                </span>
                <span className="text-ink/40">{entry.date}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}