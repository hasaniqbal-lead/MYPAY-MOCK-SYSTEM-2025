'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface PasswordModalProps {
  isOpen: boolean
  onClose: () => void
  password: string
  email: string
}

export default function PasswordModal({ isOpen, onClose, password, email }: PasswordModalProps) {
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleCopy = () => {
    navigator.clipboard.writeText(password)
    alert('Password copied to clipboard!')
  }

  const handleContinue = () => {
    onClose()
    router.push('/login')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Registration Successful!
                </h3>
                <div className="mt-2 space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Your login email:</p>
                    <p className="text-sm font-mono bg-gray-100 p-2 rounded">{email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Your auto-generated password:</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-mono bg-yellow-50 border border-yellow-200 p-2 rounded flex-1">
                        {password}
                      </p>
                      <button
                        onClick={handleCopy}
                        className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-4">
                    <p className="text-xs text-yellow-800">
                      <strong>Important:</strong> Please save this password. You will need it to log in. 
                      This password cannot be recovered.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleContinue}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Continue to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

