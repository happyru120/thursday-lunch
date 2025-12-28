'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

// 타입 정의
interface TeamResult {
  teamNum: number
  members: string[]
  size: number
  rank: number
  budget: number
  perPerson: number
}

// 팀 분배 규칙
const TEAM_DISTRIBUTIONS: Record<number, number[]> = {
  6: [3, 3],
  7: [3, 4],
  8: [4, 4],
  9: [3, 3, 3],
  10: [3, 3, 4],
  11: [3, 4, 4],
  12: [4, 4, 4],
  13: [3, 3, 3, 4],
  14: [3, 3, 4, 4],
  15: [3, 4, 4, 4],
}

// 유틸리티 함수
const shuffle = <T,>(array: T[]): T[] => {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

const calculateBudget = (teamSize: number, isWinner: boolean, totalPeople: number, winnerTeamSize: number) => {
  const baseBudget = teamSize * 12000
  if (isWinner) {
    const bonus = (totalPeople - winnerTeamSize) * 2000
    return baseBudget + bonus
  }
  return teamSize * 10000
}

export default function ThursdayLunch() {
  const [step, setStep] = useState<'setup' | 'ladder' | 'result'>('setup')
  const [selectedCount, setSelectedCount] = useState<number>(0)
  const [names, setNames] = useState<string[]>([])
  const [results, setResults] = useState<TeamResult[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const teams = selectedCount ? TEAM_DISTRIBUTIONS[selectedCount] || [] : []

  // 인원 선택
  const handleCountSelect = (count: number) => {
    setSelectedCount(count)
    setNames(Array(count).fill(''))
  }

  // 이름 입력
  const handleNameChange = (index: number, value: string) => {
    const newNames = [...names]
    newNames[index] = value
    setNames(newNames)
  }

  // 사다리 시작
  const startLadder = () => {
    const playerNames = names.map((n, i) => n || `${i + 1}번`)
    const shuffledNames = shuffle(playerNames)
    const shuffledRanks = shuffle([...Array(teams.length).keys()])

    const teamResults: TeamResult[] = []
    let nameIndex = 0

    teams.forEach((size, teamIndex) => {
      teamResults.push({
        teamNum: teamIndex + 1,
        members: shuffledNames.slice(nameIndex, nameIndex + size),
        size,
        rank: shuffledRanks[teamIndex] + 1,
        budget: 0,
        perPerson: 0,
      })
      nameIndex += size
    })

    // 예산 계산
    const winnerTeam = teamResults.find((t) => t.rank === 1)!
    teamResults.forEach((team) => {
      const isWinner = team.rank === 1
      team.budget = calculateBudget(team.size, isWinner, selectedCount, winnerTeam.size)
      team.perPerson = isWinner ? Math.round(team.budget / team.size) : 10000
    })

    setResults(teamResults)
    setStep('ladder')

    // 1.5초 후 결과 표시
    setTimeout(() => {
      setStep('result')
      setShowConfetti(true)
      launchConfetti()
      burstEmojis()
    }, 1500)
  }

  // Confetti 효과
  const launchConfetti = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ff9ff3', '#54a0ff']
    const confetti: Array<{
      x: number
      y: number
      w: number
      h: number
      color: string
      speed: number
      angle: number
      spin: number
      opacity: number
    }> = []

    for (let i = 0; i < 150; i++) {
      confetti.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        w: Math.random() * 10 + 5,
        h: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 3 + 2,
        angle: Math.random() * 360,
        spin: Math.random() * 10 - 5,
        opacity: 1,
      })
    }

    let frame = 0
    const maxFrames = 180

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      confetti.forEach((c) => {
        ctx.save()
        ctx.translate(c.x + c.w / 2, c.y + c.h / 2)
        ctx.rotate((c.angle * Math.PI) / 180)
        ctx.globalAlpha = c.opacity
        ctx.fillStyle = c.color
        ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h)
        ctx.restore()

        c.y += c.speed
        c.angle += c.spin
        c.x += Math.sin((c.angle * Math.PI) / 180) * 0.5

        if (frame > maxFrames - 60) {
          c.opacity -= 0.02
        }
      })

      frame++
      if (frame < maxFrames) {
        requestAnimationFrame(animate)
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        setShowConfetti(false)
      }
    }

    animate()
  }, [])

  // 이모지 폭발 효과
  const burstEmojis = () => {
    const emojis = ['🎉', '🎊', '🏆', '⭐', '✨', '🍽️', '🥳', '💰', '🔥', '👏']

    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        const emoji = document.createElement('div')
        emoji.className = 'emoji-burst'
        emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)]
        emoji.style.left = Math.random() * window.innerWidth + 'px'
        emoji.style.top = Math.random() * 300 + 200 + 'px'
        emoji.style.fontSize = Math.random() * 20 + 20 + 'px'
        document.body.appendChild(emoji)

        setTimeout(() => emoji.remove(), 2000)
      }, i * 100)
    }
  }

  // 슬랙 메시지 생성
  const generateSlackMessage = () => {
    const winnerTeam = results.find((t) => t.rank === 1)!
    const today = new Date()
    const dateStr = `${today.getMonth() + 1}/${today.getDate()}`

    let message = `🍽️ *${dateStr} 목요점심 결과*\n\n`
    message += `👥 오늘 인원: ${selectedCount}명\n`
    message += `📋 팀 구성: ${teams.map((t) => t + '명').join(' / ')}\n\n`
    message += `━━━━━━━━━━━━━━━\n\n`
    message += `🎉 *1등: ${winnerTeam.teamNum}팀*\n`
    message += `   ${winnerTeam.members.join(', ')}\n`
    message += `   💰 *${winnerTeam.budget.toLocaleString()}원* (인당 ${winnerTeam.perPerson.toLocaleString()}원)\n\n`

    const losers = results.filter((t) => t.rank !== 1).sort((a, b) => a.teamNum - b.teamNum)
    losers.forEach((team) => {
      message += `${team.teamNum}팀: ${team.members.join(', ')}\n`
      message += `   💸 ${team.budget.toLocaleString()}원 (인당 ${team.perPerson.toLocaleString()}원)\n\n`
    })

    message += `맛점하세요! 🍜`
    return message
  }

  // 클립보드 복사
  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generateSlackMessage())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // 리셋
  const resetGame = () => {
    setStep('setup')
    setSelectedCount(0)
    setNames([])
    setResults([])
  }

  const winnerTeam = results.find((t) => t.rank === 1)

  return (
    <>
      <canvas ref={canvasRef} id="confetti-canvas" />
      
      <div className="min-h-screen p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          
          {/* 설정 화면 */}
          {step === 'setup' && (
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl">
              <h1 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-2">
                🍽️ 목요점심 사다리타기
              </h1>
              <p className="text-center text-gray-500 mb-8">매주 목요일, 행운의 팀은 누구?</p>

              {/* 인원 선택 */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-purple-600 mb-4">1️⃣ 오늘 출근 인원은?</h2>
                <div className="flex flex-wrap gap-3 justify-center">
                  {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleCountSelect(num)}
                      className={`w-12 h-12 rounded-xl font-bold text-lg transition-all ${
                        selectedCount === num
                          ? 'bg-purple-600 text-white scale-105'
                          : 'bg-white border-2 border-purple-400 text-purple-600 hover:bg-purple-50'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                {/* 팀 구성 미리보기 */}
                {selectedCount > 0 && (
                  <div className="mt-4 bg-purple-50 rounded-xl p-4 text-center">
                    <span className="text-gray-600">팀 구성: </span>
                    {teams.map((t, i) => (
                      <span key={i} className="inline-block bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold mx-1">
                        {i + 1}팀: {t}명
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 이름 입력 */}
              {selectedCount > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-purple-600 mb-4">2️⃣ 팀원 이름 입력 (선택)</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {names.map((name, i) => (
                      <input
                        key={i}
                        type="text"
                        placeholder={`${i + 1}번`}
                        value={name}
                        onChange={(e) => handleNameChange(i, e.target.value)}
                        className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 시작 버튼 */}
              <button
                onClick={startLadder}
                disabled={selectedCount === 0}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                🎰 사다리 타기 시작!
              </button>
            </div>
          )}

          {/* 사다리 화면 */}
          {step === 'ladder' && (
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-8">🪜 사다리 타는 중...</h2>
              <div className="flex justify-around items-end h-64 mb-8">
                {teams.map((size, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold mb-4">
                      {i + 1}팀<br />({size}명)
                    </div>
                    <div className="w-1 h-40 bg-purple-600 animate-pulse rounded-full" />
                    <div className="mt-4 bg-gray-200 px-4 py-2 rounded-lg font-semibold">?</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 결과 화면 */}
          {step === 'result' && winnerTeam && (
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl">
              {/* 1등 발표 */}
              <div className="rainbow-bg rounded-2xl p-6 mb-6 text-center animate-slide-up">
                <div className="text-5xl mb-2 animate-bounce-slow">🏆</div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">🎉 1등 팀 발표!</h2>
                <div className="text-2xl font-bold text-gray-800 animate-shake">
                  {winnerTeam.teamNum}팀 ({winnerTeam.members.join(', ')})
                </div>
              </div>

              {/* 팀별 결과 */}
              <div className="space-y-3 mb-6">
                {[...results]
                  .sort((a, b) => a.rank - b.rank)
                  .map((team) => (
                    <div
                      key={team.teamNum}
                      className={`flex justify-between items-center p-4 rounded-xl ${
                        team.rank === 1
                          ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400'
                          : 'bg-gray-50'
                      }`}
                    >
                      <div>
                        <h3 className="font-bold text-gray-800">
                          {team.rank === 1 ? '🥇' : team.rank === 2 ? '🥈' : '🥉'} {team.teamNum}팀
                        </h3>
                        <p className="text-gray-600 text-sm">{team.members.join(', ')}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-bold ${team.rank === 1 ? 'text-yellow-600' : 'text-gray-800'}`}>
                          {team.budget.toLocaleString()}원
                        </p>
                        <p className="text-gray-500 text-sm">인당 {team.perPerson.toLocaleString()}원</p>
                      </div>
                    </div>
                  ))}
              </div>

              {/* 슬랙 공유 */}
              <div>
                <h3 className="text-lg font-semibold text-purple-600 mb-3">📢 슬랙에 공유하기</h3>
                <div className="bg-gray-900 text-gray-200 p-4 rounded-xl font-mono text-sm whitespace-pre-line mb-4 max-h-60 overflow-y-auto">
                  {generateSlackMessage()}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={copyToClipboard}
                    className="flex-1 py-3 bg-purple-800 text-white rounded-xl font-semibold hover:bg-purple-900 transition-colors"
                  >
                    {copied ? '✅ 복사완료!' : '📋 복사하기'}
                  </button>
                  <button
                    onClick={resetGame}
                    className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                  >
                    🔄 다시하기
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 복사 완료 토스트 */}
      {copied && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-xl shadow-lg">
          ✅ 클립보드에 복사되었습니다!
        </div>
      )}
    </>
  )
}
