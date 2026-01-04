export const awsConfig = {
  Auth: {
    region: 'us-east-1',
    userPoolId: 'us-east-1_oxrocaIxJ',
    userPoolWebClientId: '670llc1tn77lkms39cnshnb3sm',
  },
  API: {
    endpoints: [
      {
        name: 'carbonlens-api',
        endpoint: 'https://t95vjsi3kc.execute-api.us-east-1.amazonaws.com/prod',
        region: 'us-east-1'
      }
    ]
  }
};
