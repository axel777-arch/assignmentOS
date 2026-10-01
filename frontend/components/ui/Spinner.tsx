export function Spinner({ label = "Loading" }: { label?: string }) {
  return <span className="spinner-wrap" role="status"><span className="spinner" /><span className="sr-only">{label}</span></span>;
}
