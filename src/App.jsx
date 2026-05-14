import { useMemo, useState } from 'react'
import {
  Apple,
  Beef,
  Camera,
  ChevronLeft,
  Droplets,
  Edit3,
  Flame,
  HeartPulse,
  Home,
  ImagePlus,
  Leaf,
  LineChart,
  Moon,
  Plus,
  Salad,
  Sparkles,
  Star,
  SunMedium,
  Utensils,
} from 'lucide-react'
import './App.css'

const meals = [
  {
    id: 'breakfast',
    name: '早餐',
    time: '08:12',
    kcal: 386,
    status: '已记录',
    visual: '🥣',
    gradient: 'pink',
  },
  {
    id: 'lunch',
    name: '午餐',
    time: '12:34',
    kcal: 542,
    status: '已记录',
    visual: '🥗',
    gradient: 'mint',
  },
  {
    id: 'dinner',
    name: '晚餐',
    time: '待记录',
    kcal: 0,
    status: '未记录',
    visual: '🍲',
    gradient: 'blueberry',
  },
  {
    id: 'snack',
    name: '加餐',
    time: '15:50',
    kcal: 168,
    status: '已记录',
    visual: '🫐',
    gradient: 'gold',
  },
]

const nutrients = [
  { name: '热量', value: '1096', unit: 'kcal', percent: 68, icon: Flame },
  { name: '蛋白质', value: '61', unit: 'g', percent: 84, icon: Beef },
  { name: '碳水', value: '128', unit: 'g', percent: 57, icon: Apple },
  { name: '脂肪', value: '38', unit: 'g', percent: 52, icon: Salad },
  { name: '膳食纤维', value: '18', unit: 'g', percent: 72, icon: Leaf },
  { name: '饮水', value: '1.6', unit: 'L', percent: 80, icon: Droplets },
]

const recognizedFoods = [
  {
    name: '藜麦鸡胸沙拉',
    weight: '220g',
    kcal: 286,
    protein: '28g',
    carbs: '24g',
    fat: '8g',
    fiber: '6g',
  },
  {
    name: '牛油果半颗',
    weight: '70g',
    kcal: 112,
    protein: '1g',
    carbs: '6g',
    fat: '10g',
    fiber: '5g',
  },
  {
    name: '蓝莓酸奶杯',
    weight: '160g',
    kcal: 148,
    protein: '9g',
    carbs: '20g',
    fat: '4g',
    fiber: '2g',
  },
]

const diaryPhotos = ['🥣', '🥗', '🫐', '🍅', '🥑', '🍵']

const reports = [
  { label: '蛋白质达标率', value: 86, tone: 'pink' },
  { label: '蔬菜达标天数', value: 71, text: '5/7 天', tone: 'mint' },
  { label: '高糖饮品次数', value: 18, text: '1 次', tone: 'purple' },
  { label: '外食次数', value: 42, text: '3 次', tone: 'gold' },
  { label: '夜宵次数', value: 14, text: '1 次', tone: 'blue' },
]

const tabs = [
  { id: 'home', label: '今日', icon: Home },
  { id: 'camera', label: '记录', icon: Camera },
  { id: 'analysis', label: '分析', icon: Sparkles },
  { id: 'diary', label: '日记', icon: HeartPulse },
  { id: 'report', label: '报告', icon: LineChart },
]

function App() {
  const [screen, setScreen] = useState('splash')
  const [selectedMeal, setSelectedMeal] = useState('午餐')
  const [portionBoost, setPortionBoost] = useState(0)

  const mealTotal = useMemo(
    () =>
      recognizedFoods.reduce((sum, item) => sum + item.kcal, 0) + portionBoost,
    [portionBoost],
  )

  const showChrome = screen !== 'splash'

  return (
    <main className="stage">
      <div className="phone-shell">
        <div className="phone-glow" />
        <div className="app-screen">
          <SparkleField />
          {screen === 'splash' && <Splash onStart={() => setScreen('home')} />}
          {screen === 'home' && <HomeScreen onRecord={() => setScreen('camera')} />}
          {screen === 'camera' && (
            <CameraScreen
              selectedMeal={selectedMeal}
              setSelectedMeal={setSelectedMeal}
              onAnalyze={() => setScreen('analysis')}
            />
          )}
          {screen === 'analysis' && (
            <AnalysisScreen
              mealTotal={mealTotal}
              onEditPortion={() => setPortionBoost((value) => value + 24)}
              onBack={() => setScreen('camera')}
            />
          )}
          {screen === 'diary' && <DiaryScreen />}
          {screen === 'report' && <ReportScreen />}
          {showChrome && <BottomNav current={screen} setScreen={setScreen} />}
        </div>
      </div>
    </main>
  )
}

function SparkleField() {
  return (
    <div className="sparkle-field" aria-hidden="true">
      {Array.from({ length: 18 }).map((_, index) => (
        <span key={index} />
      ))}
    </div>
  )
}

function Splash({ onStart }) {
  return (
    <section className="screen splash-screen">
      <div className="pearl-orb orb-a" />
      <div className="pearl-orb orb-b" />
      <div className="sticker carrot">🥕</div>
      <div className="sticker avocado">🥑</div>
      <div className="sticker berry">🫐</div>
      <div className="brand-mark">
        <Sparkles size={30} />
      </div>
      <div className="splash-copy">
        <h1>健康饮食记</h1>
        <p>拍一拍，记录你的每一餐</p>
      </div>
      <div className="hero-plate">
        <div className="plate-ring">
          <Salad size={78} />
          <span className="mini-star star-one">
            <Star size={18} fill="currentColor" />
          </span>
          <span className="mini-star star-two">
            <Sparkles size={20} />
          </span>
        </div>
      </div>
      <button className="primary-action" onClick={onStart}>
        开始记录
        <Sparkles size={18} />
      </button>
    </section>
  )
}

function HomeScreen({ onRecord }) {
  return (
    <section className="screen content-screen home-screen">
      <Header title="今日饮食" subtitle="2026年5月14日 · 星期四" />
      <div className="score-card glass-card">
        <div>
          <span className="soft-label">今日闪闪健康分</span>
          <strong>88</strong>
        </div>
        <div className="score-ring">
          <Sparkles size={28} />
        </div>
      </div>

      <div className="meal-grid">
        {meals.map((meal) => (
          <button className={`meal-card ${meal.gradient}`} key={meal.id}>
            <span className="meal-visual" aria-hidden="true">
              {meal.visual}
            </span>
            <span>{meal.status}</span>
            <strong>{meal.name}</strong>
            <small>{meal.kcal ? `${meal.kcal} kcal` : '轻点记录'}</small>
          </button>
        ))}
      </div>

      <button className="camera-fab" onClick={onRecord} aria-label="拍照记录">
        <Camera size={32} />
      </button>

      <section className="nutrition-panel glass-card">
        <div className="panel-title">
          <h2>今日营养</h2>
          <span>目标 1600 kcal</span>
        </div>
        <div className="nutrient-grid">
          {nutrients.map((item) => (
            <Metric key={item.name} {...item} />
          ))}
        </div>
      </section>
    </section>
  )
}

function CameraScreen({ selectedMeal, setSelectedMeal, onAnalyze }) {
  const mealOptions = ['早餐', '午餐', '晚餐', '加餐', '饮品']

  return (
    <section className="screen content-screen">
      <Header title="拍照记录" subtitle="选择餐次，上传这一餐的闪闪证据" />
      <div className="segmented">
        {mealOptions.map((meal) => (
          <button
            className={selectedMeal === meal ? 'active' : ''}
            key={meal}
            onClick={() => setSelectedMeal(meal)}
          >
            {meal}
          </button>
        ))}
      </div>

      <div className="upload-card glass-card">
        <div className="upload-preview">
          <div className="mock-meal-photo" role="img" aria-label="待分析餐食">
            <span>🥗</span>
            <span>🥑</span>
            <span>🍅</span>
            <span>🍋</span>
          </div>
          <div className="upload-badge">
            <Sparkles size={16} />
            Mock AI
          </div>
        </div>
        <div className="upload-actions">
          <button>
            <Camera size={18} />
            拍下这一餐
          </button>
          <button>
            <ImagePlus size={18} />
            从相册选择
          </button>
        </div>
      </div>

      <label className="note-box glass-card">
        <span>备注</span>
        <textarea defaultValue="少油，半碗饭，无糖" />
      </label>

      <button className="primary-action sticky-action" onClick={onAnalyze}>
        开始分析
        <Sparkles size={18} />
      </button>
    </section>
  )
}

function AnalysisScreen({ mealTotal, onEditPortion, onBack }) {
  return (
    <section className="screen content-screen">
      <div className="analysis-header">
        <button onClick={onBack} aria-label="返回拍照页">
          <ChevronLeft size={22} />
        </button>
        <div>
          <h1>AI 分析</h1>
          <p>午餐 · 已识别 3 种食物</p>
        </div>
      </div>

      <div className="meal-total-card glass-card">
        <div>
          <span className="soft-label">本餐总热量</span>
          <strong>{mealTotal}</strong>
          <small>kcal</small>
        </div>
        <div className="mini-macros">
          <span>蛋白质 38g</span>
          <span>碳水 50g</span>
          <span>脂肪 22g</span>
        </div>
      </div>

      <div className="food-list">
        {recognizedFoods.map((food) => (
          <article className="food-card glass-card" key={food.name}>
            <div className="food-icon">
              <Utensils size={20} />
            </div>
            <div>
              <h3>{food.name}</h3>
              <p>
                {food.weight} · {food.kcal} kcal
              </p>
              <small>
                P {food.protein} · C {food.carbs} · F {food.fat} · 纤维{' '}
                {food.fiber}
              </small>
            </div>
            <button onClick={onEditPortion} aria-label={`修改${food.name}分量`}>
              <Edit3 size={17} />
            </button>
          </article>
        ))}
      </div>

      <div className="ai-advice glass-card">
        <div className="advice-score">
          <Sparkles size={22} />
          <strong>92</strong>
        </div>
        <div>
          <h2>本餐健康评分</h2>
          <p>
            蛋白质很优秀，蔬菜和优质脂肪搭配均衡。晚餐建议减少精制碳水，
            再补一杯温水，让全天纤维更稳。
          </p>
        </div>
      </div>
    </section>
  )
}

function DiaryScreen() {
  const dates = Array.from({ length: 14 }, (_, index) => index + 1)

  return (
    <section className="screen content-screen">
      <Header title="饮食日记" subtitle="连续打卡 12 天，保持得很稳" />
      <div className="calendar-card glass-card">
        <div className="calendar-head">
          <strong>五月</strong>
          <span>May 2026</span>
        </div>
        <div className="calendar-grid">
          {dates.map((date) => (
            <span className={date === 14 ? 'today' : date % 3 === 0 ? 'done' : ''} key={date}>
              {date}
            </span>
          ))}
        </div>
      </div>

      <div className="streak-row">
        <div className="streak-card glass-card">
          <SunMedium size={22} />
          <strong>12</strong>
          <span>连续打卡</span>
        </div>
        <div className="streak-card glass-card">
          <Moon size={22} />
          <strong>轻盈</strong>
          <span>饭后状态</span>
        </div>
      </div>

      <section className="tag-panel glass-card">
        <h2>今日状态</h2>
        <div className="tag-cloud">
          <span>开心</span>
          <span>有饱腹感</span>
          <span>不困</span>
          <span>想喝水</span>
        </div>
      </section>

      <section className="photo-wall">
        <div className="panel-title">
          <h2>餐食照片墙</h2>
          <span>本周精选</span>
        </div>
        <div className="photo-grid">
          {diaryPhotos.map((photo, index) => (
            <div className={`photo-tile tile-${index + 1}`} key={`${photo}-${index}`}>
              <span>{photo}</span>
            </div>
          ))}
        </div>
      </section>
    </section>
  )
}

function ReportScreen() {
  return (
    <section className="screen content-screen">
      <Header title="营养报告" subtitle="周报告 · 5月8日 - 5月14日" />
      <div className="trend-card glass-card">
        <div className="panel-title">
          <h2>热量趋势</h2>
          <span>平均 1510 kcal</span>
        </div>
        <div className="bar-chart" aria-label="热量趋势图">
          {[58, 72, 64, 80, 69, 76, 63].map((height, index) => (
            <span key={index} style={{ height: `${height}%` }} />
          ))}
        </div>
      </div>

      <div className="report-list">
        {reports.map((report) => (
          <article className={`report-card glass-card ${report.tone}`} key={report.label}>
            <div className="report-row">
              <strong>{report.label}</strong>
              <span>{report.text || `${report.value}%`}</span>
            </div>
            <div className="progress">
              <i style={{ width: `${report.value}%` }} />
            </div>
          </article>
        ))}
      </div>

      <div className="ai-advice glass-card">
        <div className="advice-score">
          <Leaf size={22} />
          <strong>A-</strong>
        </div>
        <div>
          <h2>下周小目标</h2>
          <p>把高糖饮品控制在 0 次，外食时优先选择一份深绿色蔬菜。</p>
        </div>
      </div>
    </section>
  )
}

function Header({ title, subtitle }) {
  return (
    <header className="screen-header">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <button aria-label="添加记录">
        <Plus size={20} />
      </button>
    </header>
  )
}

function Metric({ name, value, unit, percent, icon: Icon }) {
  return (
    <article className="metric-card">
      <div>
        <Icon size={17} />
        <span>{name}</span>
      </div>
      <strong>
        {value}
        <small>{unit}</small>
      </strong>
      <div className="progress">
        <i style={{ width: `${percent}%` }} />
      </div>
    </article>
  )
}

function BottomNav({ current, setScreen }) {
  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon
        return (
          <button
            className={current === tab.id ? 'active' : ''}
            key={tab.id}
            onClick={() => setScreen(tab.id)}
          >
            <Icon size={20} />
            <span>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export default App
