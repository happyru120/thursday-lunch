/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // GitHub Pages 배포 시 repo 이름으로 변경하세요
  // 예: basePath: '/thursday-lunch'
  basePath: process.env.NODE_ENV === 'production' ? '/thursday-lunch' : '',
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
