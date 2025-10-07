import { Outlet } from 'react-router-dom'

export default function MainLayout({ role }) {
  return React.createElement(
    'div',
    { className: 'min-h-screen bg-gray-50' },
    React.createElement(
      'div',
      { className: 'flex' },
      React.createElement(
        'aside',
        { className: 'w-64 bg-white shadow-lg min-h-screen' },
        React.createElement(
          'div',
          { className: 'p-4' },
          React.createElement(
            'h2',
            { className: 'text-xl font-bold text-primary-600' },
            'DocuChain'
          ),
          React.createElement(
            'p',
            { className: 'text-sm text-gray-500 mt-1' },
            role + ' Dashboard'
          )
        )
      ),
      React.createElement(
        'main',
        { className: 'flex-1 p-8' },
        React.createElement(Outlet)
      )
    )
  )
}