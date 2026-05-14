import { useEffect, useMemo, useState } from 'react'
import {
  Camera,
  Check,
  ChevronLeft,
  Gamepad2,
  ImagePlus,
  Leaf,
  LineChart,
  Minus,
  Plus,
  Salad,
  Sparkles,
  Star,
} from 'lucide-react'
import { BottomNav, Header, SparkleField } from './components/AppChrome'
import {
  analysisSummary,
  diary,
  mealCards,
  mealOptions,
  noteTags,
  recognizedFoods,
  report,
  today,
} from './data/mockData'
import './App.css'

function App() {
  const [screen, setScreen] = useState('splash')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState('午餐')
  const [selectedMood, setSelectedMood] = useState('开心')
  const [uploaded, setUploaded] = useState(false)
  const [note, setNote] = useState('少油，无糖')
  const [portions, setPortions] = useState(
    () => Object.fromEntries(recognizedFoods.map((food) => [food.id, 1])),
  )

  useEffect(() => {
    if (screen !== 'splash') return undefined
    const timer = window.setTimeout(() => setScreen('login'), 2000)
    return () => window.clearTimeout(timer)
  }, [screen])

  const analyzedFoods = useMemo(
    () =>
      recognizedFoods.map((food) => ({
        ...food,
        portion: portions[food.id],
        weight: Math.round(food.baseWeight * portions[food.id]),
        kcal: Math.round(food.baseKcal * portions[food.id]),
      })),
    [portions],
  )

  const baselineCalories = recognizedFoods.reduce(
    (sum, food) => sum + food.baseKcal,
    0,
  )
  const adjustedFoodCalories = analyzedFoods.reduce((sum, food) => sum + food.kcal, 0)
  const analysisCalories =
    analysisSummary.calories + adjustedFoodCalories - baselineCalories

  function updatePortion(foodId, direction) {
    setPortions((current) => ({
      ...current,
      [foodId]: Math.max(0.5, Math.min(2, current[foodId] + direction * 0.25)),
    }))
  }

  function goHome() {
    setScreen(isLoggedIn ? 'home' : 'login')
  }

  function handleWechatLogin() {
    setIsLoggedIn(true)
    setScreen('home')
  }

  return (
    <main className="stage">
      <div className="phone-shell">
        <div className="phone-glow" />
        <div className="app-screen">
          <SparkleField />
          {screen === 'splash' && <SplashScreen onEnter={goHome} />}
          {screen === 'login' && <LoginScreen onLogin={handleWechatLogin} />}
          {screen === 'home' && (
            <HomeScreen
              onCamera={() => setScreen('camera')}
              onReport={() => setScreen('report')}
            />
          )}
          {screen === 'camera' && (
            <CameraScreen
              note={note}
              selectedMeal={selectedMeal}
              uploaded={uploaded}
              onAnalyze={() => setScreen('analysis')}
              onNoteChange={setNote}
              onSelectMeal={setSelectedMeal}
              onUpload={() => setUploaded(true)}
            />
          )}
          {screen === 'analysis' && (
            <AnalysisScreen
              calories={analysisCalories}
              foods={analyzedFoods}
              onBack={() => setScreen('camera')}
              onSave={() => setScreen('diary')}
              onUpdatePortion={updatePortion}
            />
          )}
          {screen === 'diary' && (
            <DiaryScreen
              selectedMood={selectedMood}
              onMoodChange={setSelectedMood}
              onReport={() => setScreen('report')}
            />
          )}
          {screen === 'report' && <ReportScreen onBack={() => setScreen('home')} />}
          {isLoggedIn && screen !== 'splash' && screen !== 'login' && (
            <BottomNav current={screen} onNavigate={setScreen} />
          )}
        </div>
      </div>
    </main>
  )
}

function LoginScreen({ onLogin }) {
  return (
    <section className="screen login-screen">
      <div className="farm-sky" aria-hidden="true">
        <span className="pixel-cloud cloud-one" />
        <span className="pixel-cloud cloud-two" />
        <span className="pixel-crop crop-one">🥬</span>
        <span className="pixel-crop crop-two">🍅</span>
        <span className="pixel-crop crop-three">🥕</span>
      </div>
      <div className="pixel-hero glass-card">
        <div className="diary-assistant" aria-label="健康日记小助手">
          <span>✨</span>
          <strong>Hi</strong>
        </div>
        <div>
          <h1>微信登录</h1>
          <p>登录后保存你的每日餐食、健康分和营养报告。</p>
        </div>
      </div>
      <button className="wechat-button" onClick={onLogin}>
        <span>微信</span>
        一键登录
      </button>
      <p className="login-note">
        当前为 MVP 演示，会模拟微信授权成功；后续接入真实微信 OAuth。
      </p>
      <div className="game-hint glass-card">
        <Gamepad2 size={18} />
        <span>轻松打卡模式：每天记录一餐，点亮一颗闪闪星。</span>
      </div>
    </section>
  )
}

function SplashScreen({ onEnter }) {
  return (
    <section className="screen splash-screen" onClick={onEnter}>
      <div className="pearl-orb orb-a" />
      <div className="pearl-orb orb-b" />
      <div className="sticker carrot">🥕</div>
      <div className="sticker avocado">🥑</div>
      <div className="sticker tomato">🍅</div>
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
      <button className="primary-action" onClick={onEnter}>
        点击进入
        <Sparkles size={18} />
      </button>
    </section>
  )
}

function HomeScreen({ onCamera, onReport }) {
  const percent = Math.round((today.calories.current / today.calories.target) * 100)

  return (
    <section className="screen content-screen home-screen">
      <Header
        actionLabel="查看营养报告"
        icon={LineChart}
        subtitle={`${today.dateText} · 微信已登录`}
        title="今日饮食"
        onAction={onReport}
      />

      <div className="farm-profile glass-card">
        <div className="tiny-avatar">
          <span>👩🏻‍🌾</span>
        </div>
        <div>
          <strong>小禾的健康日记</strong>
          <p>今日已记录 3 餐，继续保持轻盈节奏。</p>
        </div>
      </div>

      <button className="score-card glass-card" onClick={onReport}>
        <div>
          <span className="soft-label">今日健康评分</span>
          <strong>{today.healthScore}</strong>
          <small>分 · 闪闪状态在线</small>
        </div>
        <div className="score-ring score-ring-large">
          <Sparkles size={28} />
          <i />
          <i />
          <i />
        </div>
      </button>

      <section className="calorie-card glass-card">
        <div className="panel-title">
          <h2>今日总摄入热量</h2>
          <span>{percent}%</span>
        </div>
        <strong>
          {today.calories.current} <small>/ {today.calories.target} kcal</small>
        </strong>
        <div className="progress">
          <i style={{ width: `${percent}%` }} />
        </div>
      </section>

      <section className="daily-nutrition glass-card">
        <div className="panel-title">
          <h2>今日营养进度</h2>
          <span>轻盈达标中</span>
        </div>
        {today.nutrients.map((item) => (
          <div className="nutrition-row" key={item.name}>
            <span>{item.name}</span>
            <strong>{item.value}</strong>
            <div className="progress">
              <i style={{ width: `${item.percent}%` }} />
            </div>
          </div>
        ))}
      </section>

      <div className="meal-grid">
        {mealCards.map((meal) => (
          <button className={`meal-card ${meal.gradient}`} key={meal.id}>
            <span className="meal-visual" aria-hidden="true">
              {meal.visual}
            </span>
            <span>{meal.status}</span>
            <strong>{meal.name}</strong>
            <small>{meal.kcal} kcal</small>
          </button>
        ))}
      </div>

      <button className="camera-fab" onClick={onCamera} aria-label="拍照记录">
        <Camera size={32} />
      </button>
    </section>
  )
}

function CameraScreen({
  note,
  onAnalyze,
  onNoteChange,
  onSelectMeal,
  onUpload,
  selectedMeal,
  uploaded,
}) {
  return (
    <section className="screen content-screen">
      <Header title="记录这一餐" subtitle="先用 mock 数据模拟拍照识别" />

      <div className="segmented">
        {mealOptions.map((meal) => (
          <button
            className={selectedMeal === meal ? 'active' : ''}
            key={meal}
            onClick={() => onSelectMeal(meal)}
          >
            <span className="meal-option-icon" aria-hidden="true">
              {getMealIcon(meal)}
            </span>
            {meal}
          </button>
        ))}
      </div>

      <div className="upload-card glass-card">
        <button className={`upload-preview ${uploaded ? 'is-uploaded' : ''}`} onClick={onUpload}>
          <div className="mock-meal-photo" role="img" aria-label="待分析餐食">
            <span>🍚</span>
            <span>🥦</span>
            <span>🍗</span>
            <span>🍅</span>
          </div>
          <div className="upload-badge">
            {uploaded ? <Check size={16} /> : <Sparkles size={16} />}
            {uploaded ? '上传成功' : 'Mock 上传'}
          </div>
        </button>
        <div className="upload-actions">
          <button onClick={onUpload}>
            <Camera size={18} />
            拍下这一餐
          </button>
          <button onClick={onUpload}>
            <ImagePlus size={18} />
            从相册选择
          </button>
        </div>
      </div>

      <section className="note-box glass-card">
        <span>备注区</span>
        <div className="tag-cloud compact">
          {noteTags.map((tag) => (
            <button key={tag} onClick={() => onNoteChange(tag)}>
              {tag}
            </button>
          ))}
        </div>
        <textarea
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder="例如：少油、半碗饭、无糖、不要香菜"
        />
      </section>

      <button className="primary-action sticky-action" onClick={onAnalyze}>
        开始分析
        <Sparkles size={18} />
      </button>
    </section>
  )
}

function AnalysisScreen({ calories, foods, onBack, onSave, onUpdatePortion }) {
  return (
    <section className="screen content-screen">
      <div className="analysis-header">
        <button onClick={onBack} aria-label="返回拍照记录">
          <ChevronLeft size={22} />
        </button>
        <div>
          <h1>AI 分析结果</h1>
          <p>识别完成，可调整份量后保存</p>
        </div>
      </div>

      <div className="meal-total-card glass-card">
        <div>
          <span className="soft-label">总热量</span>
          <strong>{calories}</strong>
          <small>kcal</small>
        </div>
        <div className="score-pill">
          <Sparkles size={18} />
          {analysisSummary.healthScore} 分
        </div>
      </div>

      <section className="macro-grid">
        {analysisSummary.nutrients.map((item) => (
          <article className="macro-card glass-card" key={item.name}>
            <span>{item.name}</span>
            <strong>
              {item.value}
              <small>{item.unit}</small>
            </strong>
            <div className="progress">
              <i style={{ width: `${item.percent}%` }} />
            </div>
          </article>
        ))}
      </section>

      <div className="food-list">
        {foods.map((food) => (
          <article className="food-card glass-card" key={food.id}>
            <div className="food-icon">{food.visual}</div>
            <div>
              <h3>{food.name}</h3>
              <p>
                {food.weight}g · {food.kcal}kcal
              </p>
              <small>份量 {Math.round(food.portion * 100)}%</small>
            </div>
            <div className="portion-actions">
              <button onClick={() => onUpdatePortion(food.id, -1)} aria-label={`${food.name}减少份量`}>
                <Minus size={15} />
              </button>
              <button onClick={() => onUpdatePortion(food.id, 1)} aria-label={`${food.name}增加份量`}>
                <Plus size={15} />
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="ai-advice glass-card">
        <div className="ai-helper">
          <span>🥗</span>
          <Sparkles size={18} />
        </div>
        <div>
          <h2>AI 营养建议</h2>
          <p>{analysisSummary.suggestion}</p>
        </div>
      </div>

      <div className="double-actions">
        <button onClick={() => onUpdatePortion('brown-rice', -1)}>调整份量</button>
        <button className="primary-action" onClick={onSave}>
          保存记录
        </button>
      </div>
    </section>
  )
}

function DiaryScreen({ onMoodChange, onReport, selectedMood }) {
  return (
    <section className="screen content-screen">
      <Header
        actionLabel="查看报告"
        icon={LineChart}
        subtitle={`连续记录 ${diary.streakDays} 天`}
        title="饮食日记"
        onAction={onReport}
      />

      <div className="streak-banner glass-card">
        <div>
          <span className="soft-label">连续记录天数</span>
          <strong>{diary.streakDays}</strong>
          <small>天 · 习惯养成中</small>
        </div>
        <Leaf size={42} />
      </div>

      <div className="date-strip glass-card">
        {diary.dates.map((date) => (
          <button className={date.active ? 'active' : ''} key={date.day}>
            {date.day}
          </button>
        ))}
      </div>

      <section className="tag-panel glass-card">
        <h2>心情记录</h2>
        <div className="tag-cloud">
          {diary.moods.map((mood) => (
            <button
              className={selectedMood === mood ? 'active' : ''}
              key={mood}
              onClick={() => onMoodChange(mood)}
            >
              {mood}
            </button>
          ))}
        </div>
      </section>

      <section className="tag-panel glass-card">
        <h2>餐后状态</h2>
        <div className="tag-cloud">
          {diary.postMealStates.map((state) => (
            <button key={state}>{state}</button>
          ))}
        </div>
      </section>

      <section className="diary-meal-list">
        {diary.meals.map((meal) => (
          <article className="diary-meal glass-card" key={meal.name}>
            <div className="report-row">
              <div>
                <strong>{meal.name}</strong>
                <span>{meal.time}</span>
              </div>
              <span>{meal.kcal} kcal</span>
            </div>
            <div className="mini-photo-row">
              {meal.photos.map((photo, index) => (
                <button key={`${meal.name}-${photo}-${index}`}>{photo}</button>
              ))}
            </div>
          </article>
        ))}
      </section>
    </section>
  )
}

function ReportScreen({ onBack }) {
  const points = report.trend
    .map((height, index) => `${(index / (report.trend.length - 1)) * 100},${100 - height}`)
    .join(' ')

  return (
    <section className="screen content-screen">
      <div className="analysis-header">
        <button onClick={onBack} aria-label="返回首页">
          <ChevronLeft size={22} />
        </button>
        <div>
          <h1>营养报告</h1>
          <p>本周健康状态复盘</p>
        </div>
      </div>

      <div className="score-card report-hero glass-card">
        <div>
          <span className="soft-label">本周平均健康评分</span>
          <strong>{report.averageScore}</strong>
          <small>分 · 平均 {report.averageCalories} kcal</small>
        </div>
        <div className="score-ring">
          <Star size={28} fill="currentColor" />
        </div>
      </div>

      <div className="trend-card glass-card">
        <div className="panel-title">
          <h2>热量趋势</h2>
          <span>近 7 天</span>
        </div>
        <svg className="line-chart" viewBox="0 0 100 100" role="img" aria-label="热量趋势折线图">
          <polyline points={points} />
          {report.trend.map((height, index) => (
            <circle
              cx={(index / (report.trend.length - 1)) * 100}
              cy={100 - height}
              key={index}
              r="2.8"
            />
          ))}
        </svg>
      </div>

      <article className="report-card glass-card">
        <div className="report-row">
          <strong>蛋白质达标率</strong>
          <span>{report.proteinRate}%</span>
        </div>
        <div className="progress">
          <i style={{ width: `${report.proteinRate}%` }} />
        </div>
      </article>

      <section className="stat-grid">
        {report.stats.map((stat) => (
          <article className="stat-card glass-card" key={stat.label}>
            <span>{stat.visual}</span>
            <strong>{stat.value}</strong>
            <small>{stat.label}</small>
          </article>
        ))}
      </section>

      <div className="ai-advice glass-card">
        <div className="advice-score">
          <Leaf size={22} />
          <strong>A</strong>
        </div>
        <div>
          <h2>本周建议</h2>
          <p>{report.advice}</p>
        </div>
      </div>
    </section>
  )
}

function getMealIcon(meal) {
  return {
    早餐: '☀️',
    午餐: '🥗',
    晚餐: '🌙',
    加餐: '🫐',
    饮品: '🥤',
  }[meal]
}

export default App
