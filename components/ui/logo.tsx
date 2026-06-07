import Image from 'next/image';

type LogoSize = 'sm' | 'md' | 'lg';

const sizes: Record<LogoSize, { width: number; height: number }> = {
  sm: { width: 28, height: 28 },
  md: { width: 36, height: 36 },
  lg: { width: 48, height: 48 },
};

interface LogoProps {
  size?: LogoSize;
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const { width, height } = sizes[size];

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src="/logo.png"
        alt="Bromance"
        width={width}
        height={height}
        className="rounded"
      />
      {showText && (
        <span className="font-display font-bold text-xl tracking-tight text-stone-900">
          Bro<span className="text-red-800">mance</span>
        </span>
      )}
    </span>
  );
}
