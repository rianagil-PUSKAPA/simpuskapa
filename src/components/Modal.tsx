import { theme } from '@/types/themes'
import { Dialog, Transition } from '@headlessui/react'
import { cn } from '@/lib/utils'
import { Fragment } from 'react'
import { XCloseIcon } from './icon/XCloseIcon'

type ModalProps = {
  icon: React.ReactNode
  children?: React.ReactNode
  modalSizeStyles?: string
  theme: theme
  modalTitle: string
  modalDescription: string
  modalButtons?: React.ReactNode[]
  stateModal: boolean
  handleCloseModal: () => void
  isSeamless?: boolean
}

export const Modal = ({
  icon,
  theme,
  modalTitle,
  modalDescription,
  modalButtons,
  stateModal = false,
  handleCloseModal,
  modalSizeStyles = 'max-w-sm',
  children,
  isSeamless = false,
}: ModalProps) => {
  const colorVariants = {
    warning: 'border-warning-50 bg-warning-100',
    primary: 'border-primary-50 bg-primary-100',
    error: 'border-error-50 bg-error-100',
  }

  return (
    <Transition appear show={stateModal} as={Fragment}>
      <Dialog as="div" className="relative z-20" onClose={handleCloseModal}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          {/* backdrop-blur */}
          <div className="fixed inset-0 bg-gray-700/70" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={cn(
                  'relative w-full overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-xl transition-all',
                  modalSizeStyles,
                )}
              >
                {!isSeamless ? (
                  <>
                    <div
                      className={cn(
                        'flex h-14 w-14 items-center justify-center rounded-full border-[6px]',
                        colorVariants[theme],
                      )}
                    >
                      {icon}
                    </div>
                    <span className="absolute right-6 top-6 hover:cursor-pointer" onClick={handleCloseModal}>
                      <XCloseIcon className="h-6 w-6 stroke-gray-500" />
                    </span>
                    <Dialog.Title as="h3" className="mb-1 mt-4 text-lg font-semibold leading-7 text-gray-900">
                      {modalTitle}
                    </Dialog.Title>
                  </>
                ) : null}

                {modalDescription ? <p className="text-sm text-gray-600">{modalDescription}</p> : null}

                {children}

                {modalButtons && (
                  <div className={cn('flex items-center justify-between gap-3', !isSeamless ? 'mt-8' : 'mt-4')}>
                    {modalButtons?.map((modalBtn, index) => (
                      <Fragment key={index}>{modalBtn}</Fragment>
                    ))}
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
