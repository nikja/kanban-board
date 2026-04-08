import { TeamMember } from '../../types';

interface AvatarProps {
  member: TeamMember;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const sizeClasses = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
};

export function Avatar({ member, size = 'sm', showTooltip = true }: AvatarProps) {
  return (
    <div
      className={`relative group inline-flex items-center justify-center rounded-full font-semibold flex-shrink-0 select-none ${sizeClasses[size]}`}
      style={{ backgroundColor: member.color, color: '#fff' }}
      title={showTooltip ? member.name : undefined}
    >
      {member.initials}
      {showTooltip && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs bg-[#333] text-white rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          {member.name}
        </span>
      )}
    </div>
  );
}

interface AvatarGroupProps {
  members: TeamMember[];
  max?: number;
  size?: 'sm' | 'md';
}

export function AvatarGroup({ members, max = 3, size = 'sm' }: AvatarGroupProps) {
  const visible = members.slice(0, max);
  const overflow = members.length - max;

  const sizePx = size === 'sm' ? 24 : 32;
  const offsetPx = size === 'sm' ? -6 : -8;

  return (
    <div className="flex items-center" style={{ gap: 0 }}>
      {visible.map((member, i) => (
        <div
          key={member.id}
          style={{ marginLeft: i === 0 ? 0 : offsetPx, zIndex: visible.length - i }}
          className="relative"
        >
          <div
            className={`inline-flex items-center justify-center rounded-full font-semibold border-2 border-[#222] select-none cursor-default group`}
            style={{
              backgroundColor: member.color,
              color: '#fff',
              width: sizePx,
              height: sizePx,
              fontSize: size === 'sm' ? 10 : 12,
            }}
            title={member.name}
          >
            {member.initials}
          </div>
        </div>
      ))}
      {overflow > 0 && (
        <div
          className="inline-flex items-center justify-center rounded-full font-semibold border-2 border-[#222] bg-[#333] text-[#aaa] select-none"
          style={{
            marginLeft: offsetPx,
            width: sizePx,
            height: sizePx,
            fontSize: size === 'sm' ? 10 : 12,
          }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
