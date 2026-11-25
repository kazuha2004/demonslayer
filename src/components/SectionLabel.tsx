export default function SectionLabel({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  return (
    <div className="section-label">
      <span className="section-index section-label-number">{number}</span>
      <span className="section-label-rule" aria-hidden="true" />
      <span className="section-label-title">{title}</span>
    </div>
  );
}
