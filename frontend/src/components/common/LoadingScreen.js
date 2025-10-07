export default function LoadingScreen() {
  return React.createElement(
    'div',
    { className: 'min-h-screen flex items-center justify-center bg-gray-50' },
    React.createElement(
      'div',
      { className: 'text-center' },
      React.createElement('div', { className: 'spinner w-16 h-16 mx-auto mb-4' }),
      React.createElement(
        'p',
        { className: 'text-gray-600 font-medium' },
        'Loading DocuChain...'
      )
    )
  )
}