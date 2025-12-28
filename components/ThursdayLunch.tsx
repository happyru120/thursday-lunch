'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

// 타입 정의
interface TeamResult {
  teamNum: number
  members: string[]
  size: number
  rank: number
  budget: number
  perPerson: number
}

interface Bridge {
  fromCol: number
  y: number
}

// 🎯 팀원 명단
const ALL_MEMBERS = ['세헌', '루리', '연희', '정우', '우진', '주환', '성우', '현석', '원진', '정민']

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
  const [absentMembers, setAbsentMembers] = useState<Set<string>>(new Set())
  const [targetRank, setTargetRank] = useState<number>(1)
  const [results, setResults] = useState<TeamResult[]>([])
  const [copied, setCopied] = useState(false)
  const [bridges, setBridges] = useState<Bridge[]>([])
  const [runnerPositions, setRunnerPositions] = useState<{col: number, y: number}[]>([])
  const [animationComplete, setAnimationComplete] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const confettiRef = useRef<HTMLCanvasElement>(null)

  const presentMembers = ALL_MEMBERS.filter(m => !absentMembers.has(m))
  const selectedCount = presentMembers.length
  const teams = selectedCount >= 6 && selectedCount <= 15 ? TEAM_DISTRIBUTIONS[selectedCount] || [] : []

  const toggleAbsent = (name: string) => {
    const newAbsent = new Set(absentMembers)
    if (newAbsent.has(name)) {
      newAbsent.delete(name)
    } else {
      newAbsent.add(name)
    }
    setAbsentMembers(newAbsent)
  }

  // 사다리 생성
  const generateBridges = (teamCount: number): Bridge[] => {
    const newBridges: Bridge[] = []
    const rows = 8
    
    for (let row = 1; row <= rows; row++) {
      const y = row / (rows + 1)
      const availableCols = Array.from({ length: teamCount - 1 }, (_, i) => i)
      const shuffledCols = shuffle(availableCols)
      const bridgeCount = Math.floor(Math.random() * 2) + 1
      
      for (let i = 0; i < Math.min(bridgeCount, shuffledCols.length); i++) {
        const col = shuffledCols[i]
        // 같은 높이에 인접한 다리가 없는지 확인
        const hasAdjacent = newBridges.some(b => 
          Math.abs(b.y - y) < 0.05 && Math.abs(b.fromCol - col) <= 1
        )
        if (!hasAdjacent) {
          newBridges.push({ fromCol: col, y })
        }
      }
    }
    return newBridges
  }

  // 사다리 타기 결과 계산
  const tracePath = (startCol: number, bridges: Bridge[], teamCount: number): number => {
    let currentCol = startCol
    const sortedBridges = [...bridges].sort((a, b) => a.y - b.y)
    
    for (const bridge of sortedBridges) {
      if (bridge.fromCol === currentCol) {
        currentCol = currentCol + 1
      } else if (bridge.fromCol === currentCol - 1) {
        currentCol = currentCol - 1
      }
    }
    return currentCol
  }

  // 사다리 애니메이션
  const animateLadder = useCallback((teamCount: number, bridges: Bridge[], onComplete: (finalPositions: number[]) => void) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const padding = 40
    const ladderHeight = height - padding * 2
    const colWidth = (width - padding * 2) / (teamCount - 1)

    // 각 러너의 상태
    const runners = Array.from({ length: teamCount }, (_, i) => ({
      col: i,
      y: 0,
      targetY: 0,
      moving: true,
      path: [{ col: i, y: 0 }]
    }))

    const sortedBridges = [...bridges].sort((a, b) => a.y - b.y)
    const speed = 0.008

    const drawLadder = () => {
      ctx.clearRect(0, 0, width, height)

      // 배경
      ctx.fillStyle = '#F5F5F7'
      ctx.fillRect(0, 0, width, height)

      // 세로선
      ctx.strokeStyle = '#D1D1D6'
      ctx.lineWidth = 3
      for (let i = 0; i < teamCount; i++) {
        const x = padding + i * colWidth
        ctx.beginPath()
        ctx.moveTo(x, padding)
        ctx.lineTo(x, height - padding)
        ctx.stroke()
      }

      // 가로선 (다리)
      ctx.strokeStyle = '#D1D1D6'
      ctx.lineWidth = 3
      for (const bridge of bridges) {
        const x1 = padding + bridge.fromCol * colWidth
        const x2 = padding + (bridge.fromCol + 1) * colWidth
        const y = padding + bridge.y * ladderHeight
        ctx.beginPath()
        ctx.moveTo(x1, y)
        ctx.lineTo(x2, y)
        ctx.stroke()
      }

      // 지나간 경로 그리기
      const colors = ['#FF3B30', '#FF9500', '#34C759', '#007AFF', '#AF52DE']
      runners.forEach((runner, idx) => {
        if (runner.path.length > 1) {
          ctx.strokeStyle = colors[idx % colors.length]
          ctx.lineWidth = 4
          ctx.lineCap = 'round'
          ctx.beginPath()
          
          runner.path.forEach((point, i) => {
            const x = padding + point.col * colWidth
            const y = padding + point.y * ladderHeight
            if (i === 0) {
              ctx.moveTo(x, y)
            } else {
              ctx.lineTo(x, y)
            }
          })
          ctx.stroke()
        }
      })

      // 러너 (공)
      runners.forEach((runner, idx) => {
        const x = padding + runner.col * colWidth
        const y = padding + runner.y * ladderHeight
        
        // 그림자
        ctx.beginPath()
        ctx.arc(x, y + 2, 14, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(0,0,0,0.1)'
        ctx.fill()
        
        // 공
        const gradient = ctx.createRadialGradient(x - 4, y - 4, 0, x, y, 14)
        gradient.addColorStop(0, colors[idx % colors.length])
        gradient.addColorStop(1, colors[idx % colors.length] + '99')
        ctx.beginPath()
        ctx.arc(x, y, 12, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()
        
        // 팀 번호
        ctx.fillStyle = 'white'
        ctx.font = 'bold 10px -apple-system, SF Pro Display, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(`${idx + 1}`, x, y)
      })

      // 시작점 라벨
      ctx.font = 'bold 14px -apple-system, SF Pro Display, sans-serif'
      ctx.textAlign = 'center'
      for (let i = 0; i < teamCount; i++) {
        const x = padding + i * colWidth
        ctx.fillStyle = '#1D1D1F'
        ctx.fillText(`${i + 1}팀`, x, padding - 15)
      }

      // 도착점 라벨
      for (let i = 0; i < teamCount; i++) {
        const x = padding + i * colWidth
        ctx.fillStyle = '#86868B'
        ctx.fillText(`${i + 1}`, x, height - padding + 20)
      }
    }

    let animationId: number

    const animate = () => {
      let allComplete = true

      runners.forEach((runner) => {
        if (runner.y < 1) {
          allComplete = false
          runner.y += speed

          // 다리 체크
          for (const bridge of sortedBridges) {
            const bridgeY = bridge.y
            const prevY = runner.y - speed
            
            if (prevY <= bridgeY && runner.y >= bridgeY) {
              if (bridge.fromCol === runner.col) {
                runner.path.push({ col: runner.col, y: bridgeY })
                runner.col = runner.col + 1
                runner.path.push({ col: runner.col, y: bridgeY })
              } else if (bridge.fromCol === runner.col - 1) {
                runner.path.push({ col: runner.col, y: bridgeY })
                runner.col = runner.col - 1
                runner.path.push({ col: runner.col, y: bridgeY })
              }
            }
          }
          
          runner.path.push({ col: runner.col, y: runner.y })
        }
      })

      drawLadder()

      if (allComplete) {
        cancelAnimationFrame(animationId)
        const finalPositions = runners.map(r => r.col)
        setTimeout(() => onComplete(finalPositions), 500)
      } else {
        animationId = requestAnimationFrame(animate)
      }
    }

    drawLadder()
    setTimeout(() => {
      animationId = requestAnimationFrame(animate)
    }, 500)

    return () => cancelAnimationFrame(animationId)
  }, [])

  // 사다리 시작
  const startLadder = () => {
    const teamCount = teams.length
    const newBridges = generateBridges(teamCount)
    setBridges(newBridges)
    setAnimationComplete(false)
    setStep('ladder')

    setTimeout(() => {
      animateLadder(teamCount, newBridges, (finalPositions) => {
        // 결과 계산
        const shuffledNames = shuffle(presentMembers)
        const teamResults: TeamResult[] = []
        let nameIndex = 0

        teams.forEach((size, teamIndex) => {
          const endPosition = finalPositions[teamIndex]
          teamResults.push({
            teamNum: teamIndex + 1,
            members: shuffledNames.slice(nameIndex, nameIndex + size),
            size,
            rank: endPosition + 1,
            budget: 0,
            perPerson: 0,
          })
          nameIndex += size
        })

        // 예산 계산 - targetRank에 해당하는 팀이 당첨!
        const winnerTeam = teamResults.find((t) => t.rank === targetRank)!
        teamResults.forEach((team) => {
          const isWinner = team.rank === targetRank
          team.budget = calculateBudget(team.size, isWinner, selectedCount, winnerTeam.size)
          team.perPerson = isWinner ? Math.round(team.budget / team.size) : 10000
        })

        setResults(teamResults)
        setAnimationComplete(true)
        
        setTimeout(() => {
          setStep('result')
          launchConfetti()
        }, 1000)
      })
    }, 100)
  }

  // Confetti
  const launchConfetti = useCallback(() => {
    const canvas = confettiRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const colors = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#AF52DE']
    const confetti: Array<{
      x: number; y: number; w: number; h: number
      color: string; speed: number; angle: number; spin: number; opacity: number
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
        if (frame > maxFrames - 60) c.opacity -= 0.02
      })
      frame++
      if (frame < maxFrames) requestAnimationFrame(animate)
      else ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    animate()
  }, [])

  // 슬랙 메시지
  const generateSlackMessage = () => {
    const winnerTeam = results.find((t) => t.rank === targetRank)!
    const today = new Date()
    const dateStr = `${today.getMonth() + 1}/${today.getDate()}`
    const targetLabel = targetRank === 1 ? '1등' : targetRank === teams.length ? '꼴등' : `${targetRank}등`

    let message = `🍽️ *${dateStr} 목요점심 결과*\n\n`
    message += `👥 오늘 인원: ${selectedCount}명\n`
    message += `📋 팀 구성: ${teams.map((t) => t + '명').join(' / ')}\n`
    message += `🎯 목표: ${targetLabel}\n\n`
    message += `━━━━━━━━━━━━━━━\n\n`
    message += `🎉 *당첨: ${winnerTeam.teamNum}팀* (${targetLabel} 달성!)\n`
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

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generateSlackMessage())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const resetGame = () => {
    setStep('setup')
    setAbsentMembers(new Set())
    setTargetRank(1)
    setResults([])
    setBridges([])
    setAnimationComplete(false)
  }

  const winnerTeam = results.find((t) => t.rank === targetRank)
  const targetLabel = targetRank === 1 ? '1등' : targetRank === teams.length ? '꼴등' : `${targetRank}등`

  return (
    <>
      <canvas ref={confettiRef} className="fixed inset-0 pointer-events-none z-50" />
      
      <div className="min-h-screen bg-[#F5F5F7] p-4 md:p-6" style={{ fontFamily: '-apple-system, SF Pro Display, sans-serif' }}>
        <div className="max-w-xl mx-auto">
          
          {/* 설정 화면 */}
          {step === 'setup' && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-lg border border-white/20">
              <h1 className="text-2xl md:text-3xl font-semibold text-center text-[#1D1D1F] mb-1 tracking-tight">
                목요점심
              </h1>
              <p className="text-center text-[#86868B] mb-8 text-sm">사다리타기로 행운의 팀을 정해요</p>

              {/* 결석자 선택 */}
              <div className="mb-8">
                <div className="flex items-baseline gap-2 mb-4">
                  <h2 className="text-sm font-medium text-[#86868B] uppercase tracking-wide">오늘 출근자</h2>
                  <span className="text-xs text-[#86868B]">안 온 사람 터치해서 빼기</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {ALL_MEMBERS.map((name) => {
                    const isAbsent = absentMembers.has(name)
                    return (
                      <button
                        key={name}
                        onClick={() => toggleAbsent(name)}
                        className={`py-3.5 px-4 rounded-2xl font-medium text-base transition-all duration-200 ${
                          isAbsent
                            ? 'bg-[#FF3B30]/10 text-[#FF3B30] line-through'
                            : 'bg-white text-[#1D1D1F] shadow-sm border border-[#E5E5E7]'
                        }`}
                      >
                        {name}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 목표 등수 선택 */}
              {teams.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-baseline gap-2 mb-4">
                    <h2 className="text-sm font-medium text-[#86868B] uppercase tracking-wide">오늘의 목표</h2>
                    <span className="text-xs text-[#86868B]">몇 등 할까요?</span>
                  </div>
                  
                  <div className="flex gap-2">
                    {teams.map((_, i) => {
                      const rank = i + 1
                      const isSelected = targetRank === rank
                      const emoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🏅'
                      const label = rank === 1 ? '1등' : rank === teams.length ? '꼴등' : `${rank}등`
                      return (
                        <button
                          key={rank}
                          onClick={() => setTargetRank(rank)}
                          className={`flex-1 py-3 px-2 rounded-2xl font-medium text-sm transition-all duration-200 ${
                            isSelected
                              ? 'bg-[#007AFF] text-white shadow-md'
                              : 'bg-[#F5F5F7] text-[#86868B]'
                          }`}
                        >
                          {emoji} {label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* 출근 인원 */}
              <div className="bg-[#F5F5F7] rounded-2xl p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-[#86868B] text-sm">참여 인원</span>
                  <span className="text-2xl font-semibold text-[#1D1D1F]">{selectedCount}명</span>
                </div>
                {teams.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {teams.map((t, i) => (
                      <span key={i} className="bg-white text-[#1D1D1F] px-3 py-1 rounded-full text-sm font-medium shadow-sm">
                        {i + 1}팀 · {t}명
                      </span>
                    ))}
                  </div>
                )}
                {teams.length === 0 && (
                  <p className="text-[#FF3B30] text-sm mt-2">6~15명이 필요해요</p>
                )}
              </div>

              {/* 시작 버튼 */}
              <button
                onClick={startLadder}
                disabled={teams.length === 0}
                className="w-full py-4 bg-[#007AFF] text-white rounded-2xl font-semibold text-lg disabled:bg-[#D1D1D6] disabled:cursor-not-allowed transition-all duration-200 hover:bg-[#0056CC] active:scale-[0.98]"
              >
                사다리 타기
              </button>
            </div>
          )}

          {/* 사다리 화면 */}
          {step === 'ladder' && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-4 md:p-6 shadow-lg border border-white/20">
              <h2 className="text-xl font-semibold text-[#1D1D1F] mb-4 text-center">
                {animationComplete ? '완료!' : '사다리 타는 중...'}
              </h2>
              <canvas 
                ref={canvasRef} 
                width={350} 
                height={400}
                className="w-full rounded-2xl"
                style={{ maxWidth: '350px', margin: '0 auto', display: 'block' }}
              />
            </div>
          )}

          {/* 결과 화면 */}
          {step === 'result' && winnerTeam && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-lg border border-white/20">
              {/* 당첨 발표 */}
              <div className="bg-gradient-to-br from-[#FFD60A] to-[#FF9F0A] rounded-2xl p-6 mb-6 text-center">
                <div className="text-4xl mb-2">🏆</div>
                <p className="text-sm font-medium text-[#1D1D1F]/60 mb-1">{targetLabel} 당첨!</p>
                <h2 className="text-2xl font-bold text-[#1D1D1F]">
                  {winnerTeam.teamNum}팀
                </h2>
                <p className="text-[#1D1D1F]/80 mt-1">{winnerTeam.members.join(', ')}</p>
                <p className="text-xl font-bold text-[#1D1D1F] mt-3">
                  {winnerTeam.budget.toLocaleString()}원
                </p>
                <p className="text-sm text-[#1D1D1F]/60">인당 {winnerTeam.perPerson.toLocaleString()}원</p>
              </div>

              {/* 나머지 팀 */}
              <div className="space-y-2 mb-6">
                {[...results]
                  .filter(t => t.rank !== targetRank)
                  .sort((a, b) => a.rank - b.rank)
                  .map((team) => {
                    const rankEmoji = team.rank === 1 ? '🥇' : team.rank === 2 ? '🥈' : team.rank === 3 ? '🥉' : '🏅'
                    return (
                    <div
                      key={team.teamNum}
                      className="flex justify-between items-center p-4 bg-[#F5F5F7] rounded-2xl"
                    >
                      <div>
                        <h3 className="font-semibold text-[#1D1D1F]">
                          {rankEmoji} {team.teamNum}팀
                        </h3>
                        <p className="text-[#86868B] text-sm">{team.members.join(', ')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[#1D1D1F]">
                          {team.budget.toLocaleString()}원
                        </p>
                        <p className="text-[#86868B] text-xs">인당 {team.perPerson.toLocaleString()}원</p>
                      </div>
                    </div>
                  )})}
              </div>

              {/* 슬랙 공유 */}
              <div className="bg-[#1D1D1F] rounded-2xl p-4 mb-4 max-h-48 overflow-y-auto">
                <pre className="text-[#F5F5F7] text-xs whitespace-pre-wrap font-mono">
                  {generateSlackMessage()}
                </pre>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 py-3.5 bg-[#007AFF] text-white rounded-2xl font-semibold transition-all hover:bg-[#0056CC] active:scale-[0.98]"
                >
                  {copied ? '복사됨 ✓' : '복사하기'}
                </button>
                <button
                  onClick={resetGame}
                  className="flex-1 py-3.5 bg-[#F5F5F7] text-[#1D1D1F] rounded-2xl font-semibold transition-all hover:bg-[#E5E5E7] active:scale-[0.98]"
                >
                  다시하기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 토스트 */}
      {copied && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#1D1D1F] text-white px-6 py-3 rounded-full shadow-lg text-sm font-medium">
          클립보드에 복사됨
        </div>
      )}
    </>
  )
}
