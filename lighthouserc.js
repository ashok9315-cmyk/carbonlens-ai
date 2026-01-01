module.exports = {
  ci: {
    collect: {
      url: [
        'https://carbonlens-ai.solutionsynth.cloud',
        'https://carbonlens-ai.solutionsynth.cloud/dashboard',
        'https://carbonlens-ai.solutionsynth.cloud/upload'
      ],
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --headless'
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }]
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};