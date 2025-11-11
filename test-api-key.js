const apiKey = "AIzaSyAgjLAyz8loMw15lTCSm0Imyt9_mdIgmm8";

console.log('Testing Gemini API with provided key...');
console.log('API Key (masked):', apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 10));

const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{
      parts: [{
        text: "Say hello"
      }]
    }]
  })
})
.then(res => {
  console.log('Response Status:', res.status);
  console.log('Response StatusText:', res.statusText);
  return res.text();
})
.then(text => {
  console.log('Response Body:', text);
  try {
    const json = JSON.parse(text);
    if (json.error) {
      console.error('❌ API Error:', json.error);
    } else {
      console.log('✅ Success!');
    }
  } catch (e) {
    console.log('Raw response:', text);
  }
})
.catch(err => {
  console.error('❌ Fetch Error:', err);
});
