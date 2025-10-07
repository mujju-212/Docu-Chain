import { Outlet } from 'react-router-dom'

export default function AuthLayout({ children }) {
  return React.createElement(
    'div',
    { className: 'min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4' },
    React.createElement(
      'div',
      { className: 'w-full max-w-md' },
      children || React.createElement(Outlet)
    )
  )
}