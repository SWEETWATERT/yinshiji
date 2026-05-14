import { Camera, HeartPulse, Home, Plus } from 'lucide-react'

const navItems = [
  { id: 'home', label: '首页', icon: Home },
  { id: 'camera', label: '拍照', icon: Camera },
  { id: 'diary', label: '日记', icon: HeartPulse },
]

export function SparkleField() {
  return (
    <div className="sparkle-field" aria-hidden="true">
      {Array.from({ length: 22 }).map((_, index) => (
        <span key={index} />
      ))}
    </div>
  )
}

export function Header({
  actionLabel = '添加记录',
  icon: Icon = Plus,
  onAction,
  subtitle,
  title,
}) {
  return (
    <header className="screen-header">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <button onClick={onAction} aria-label={actionLabel}>
        <Icon size={20} />
      </button>
    </header>
  )
}

export function BottomNav({ current, onNavigate }) {
  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon
        const active =
          current === item.id || (current === 'analysis' && item.id === 'camera')

        return (
          <button
            className={active ? 'active' : ''}
            key={item.id}
            onClick={() => onNavigate(item.id)}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
