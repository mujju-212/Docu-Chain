// 🚨 COPY THIS ENTIRE BLOCK AND PASTE INTO BROWSER CONSOLE (F12) 🚨

localStorage.setItem('userId', '46a7c52e-7dab-42cd-b6cd-bff51c435106');
localStorage.setItem('userEmail', 'meera.patel@mu.ac.in');
localStorage.setItem('userRole', 'faculty');
localStorage.setItem('userName', 'Dr. Meera Patel');

console.log('%c✅ SUCCESS! LocalStorage has been set for Dr. Meera Patel', 'background: #4CAF50; color: white; padding: 10px; font-size: 14px; font-weight: bold;');
console.log('%c📋 Now refresh the page with Ctrl+Shift+R', 'background: #2196F3; color: white; padding: 8px; font-size: 12px;');
console.log('%c👉 After refresh, the status should show APPROVED', 'background: #FF9800; color: white; padding: 8px; font-size: 12px;');

// Show confirmation alert
alert('✅ LocalStorage set!\n\n👉 Now press Ctrl+Shift+R to hard refresh\n\nThe approval status will then show correctly as APPROVED.');
