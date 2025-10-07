import React from 'react';

export default function StudentDashboard() {
  return React.createElement(
    'div',
    null,
    React.createElement(
      'h1',
      { className: 'text-3xl font-bold mb-6' },
      'Student Dashboard'
    ),
    React.createElement(
      'div',
      { className: 'grid grid-cols-1 md:grid-cols-3 gap-6' },
      React.createElement(
        'div',
        { className: 'card' },
        React.createElement(
          'h3',
          { className: 'text-lg font-semibold' },
          'My Documents'
        ),
        React.createElement(
          'p',
          { className: 'text-3xl font-bold text-primary-600 mt-2' },
          '0'
        )
      ),
      React.createElement(
        'div',
        { className: 'card' },
        React.createElement(
          'h3',
          { className: 'text-lg font-semibold' },
          'Shared With Me'
        ),
        React.createElement(
          'p',
          { className: 'text-3xl font-bold text-primary-600 mt-2' },
          '0'
        )
      ),
      React.createElement(
        'div',
        { className: 'card' },
        React.createElement(
          'h3',
          { className: 'text-lg font-semibold' },
          'Requests'
        ),
        React.createElement(
          'p',
          { className: 'text-3xl font-bold text-primary-600 mt-2' },
          '0'
        )
      )
    )
  )
}