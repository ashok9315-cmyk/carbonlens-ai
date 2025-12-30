export const awsConfig = {
  Auth: {
    region: 'us-east-1',
    userPoolId: 'us-east-1_pesPWWfoF',
    userPoolWebClientId: '6lm8qg1seqc7o05tkp03ecv4v9',
  },
  API: {
    endpoints: [
      {
        name: 'carbonlens-api',
        endpoint: 'https://2fi7ahgujj.execute-api.us-east-1.amazonaws.com/dev',
        region: 'us-east-1'
      }
    ]
  }
};
