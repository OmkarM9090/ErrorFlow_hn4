const token = 'rc_8291f750b5cf0a26c7f69f05bd1063a7140ad48f95d10db413601a6118502588';
fetch('https://api.featherless.ai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    model: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
    messages: [{ role: 'user', content: 'Say hi' }]
  })
})
.then(res => res.text())
.then(console.log)
.catch(console.error);
