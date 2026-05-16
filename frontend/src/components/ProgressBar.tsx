interface Props {
  progress: number;
}

export default function ProgressBar({ progress }: Props) {
  return (
    <div className="w-full bg-gray-200 rounded h-2">
      <div className="bg-blue-600 h-2 rounded transition-all" style={{ width: `${progress}%` }} />
    </div>
  );
}