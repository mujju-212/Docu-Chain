#!/bin/bash
# Post-deployment email service test script
# Run this after deploying to Azure to verify email functionality

echo "=== DocuChain Email Service Test ==="
echo "Testing Brevo connectivity..."

# Test DNS resolution
if nslookup api.brevo.com > /dev/null 2>&1; then
    echo "✓ DNS resolution for api.brevo.com successful"
else
    echo "✗ DNS resolution for api.brevo.com failed"
    echo "Trying alternative DNS servers..."
    
    # Add Google DNS
    echo "nameserver 8.8.8.8" >> /etc/resolv.conf
    echo "nameserver 8.8.4.4" >> /etc/resolv.conf
    
    # Test again
    if nslookup api.brevo.com > /dev/null 2>&1; then
        echo "✓ DNS resolution successful with Google DNS"
    else
        echo "✗ DNS resolution still failing"
    fi
fi

# Test HTTP connectivity
echo "Testing HTTP connectivity to Brevo..."
status_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 https://api.brevo.com)

if [ "$status_code" -eq 200 ] || [ "$status_code" -eq 404 ]; then
    echo "✓ HTTP connectivity to Brevo successful (Status: $status_code)"
else
    echo "✗ HTTP connectivity failed (Status: $status_code)"
fi

# Test application health endpoints
echo "Testing application health endpoints..."

# Basic health check
health_status=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 http://localhost:$PORT/api/health)
if [ "$health_status" -eq 200 ]; then
    echo "✓ Basic health check passed"
else
    echo "✗ Basic health check failed (Status: $health_status)"
fi

# Detailed health check
detailed_status=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 http://localhost:$PORT/api/health/detailed)
if [ "$detailed_status" -eq 200 ]; then
    echo "✓ Detailed health check passed"
else
    echo "✗ Detailed health check failed (Status: $detailed_status)"
fi

# Email-specific health check
email_status=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 http://localhost:$PORT/api/health/email)
if [ "$email_status" -eq 200 ]; then
    echo "✓ Email service health check passed"
else
    echo "✗ Email service health check failed (Status: $email_status)"
fi

echo "=== Test Complete ==="
echo "Check the application logs for more detailed information."

# Get the actual health check response for logging
echo "=== Email Health Details ==="
curl -s http://localhost:$PORT/api/health/email | python -m json.tool || echo "Failed to get email health details"