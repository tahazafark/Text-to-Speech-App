module.exports = {
  apps: [{
    name: 'text-to-speech',
    script: 'server.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
} 