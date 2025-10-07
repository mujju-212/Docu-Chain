// Test API connection from frontend
console.log('Testing API connection...');

fetch('http://localhost:5000/api/institutions/list')
  .then(response => {
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    return response.json();
  })
  .then(data => {
    console.log('✅ API Response:', data);
    console.log('✅ Institutions found:', data.institutions?.length || 0);
  })
  .catch(error => {
    console.error('❌ API Error:', error);
  });