const TAG_COLORS = [
  'bg-aurora-blue/20 text-aurora-blue border-aurora-blue/30',
  'bg-aurora-purple/20 text-aurora-purple border-aurora-purple/30',
  'bg-aurora-cyan/20 text-aurora-cyan border-aurora-cyan/30',
  'bg-aurora-green/20 text-aurora-green border-aurora-green/30',
  'bg-aurora-rose/20 text-aurora-rose border-aurora-rose/30',
];

function hashColor(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return TAG_COLORS[Math.abs(h) % TAG_COLORS.length];
}

export default function Tag({ label, onRemove }) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border
        ${hashColor(label)}
      `}
    >
      #{label}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 opacity-60 hover:opacity-100 transition-opacity text-xs leading-none"
        >
          ×
        </button>
      )}
    </span>
  );
}
