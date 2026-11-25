export default function HankoSeal({ label = "鬼殺隊" }: { label?: string }) {
  return (
    <span className="hanko-seal" aria-label={label} role="img">
      <span className="hanko-seal-inner" aria-hidden="true">
        {label}
      </span>
    </span>
  );
}
