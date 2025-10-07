// Placeholder files for remaining pages
import React from 'react';

export default function Placeholder({ title }) {
  return React.createElement(
    'div',
    null,
    React.createElement(
      'h1',
      { className: 'text-3xl font-bold mb-6' },
      title
    ),
    React.createElement(
      'div',
      { className: 'card' },
      React.createElement(
        'p',
        { className: 'text-gray-600' },
        'This page is under construction.'
      )
    )
  )
}