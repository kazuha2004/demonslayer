export default function Checker({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`checker ${className}`.trim()} />;
}
