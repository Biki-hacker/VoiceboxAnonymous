import React, { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline';

const CustomSelect = ({ value, onChange, options, label, icon: Icon, disabled = false, className = '' }) => {
  const selectedOption = options.find(opt => opt.value === value) || (options.length > 0 ? options[0] : {label: 'Select', value: ''});
  
  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      {({ open }) => (
        <div className={`relative w-full ${className}`}>
          {label && (
            <Listbox.Label className="flex items-center text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
              {Icon && <Icon className="h-4 w-4 mr-1 text-gray-400 dark:text-slate-500" />}
              {label}
            </Listbox.Label>
          )}
          <Listbox.Button 
            className={`relative w-full cursor-default rounded-md py-2.5 pl-3 pr-10 text-left text-sm bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="block truncate text-gray-900 dark:text-slate-100">
              {selectedOption?.label || 'Select'}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400 dark:text-slate-400" aria-hidden="true" />
            </span>
          </Listbox.Button>
          <Transition
            show={open}
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options 
              className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-slate-700 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm custom-scrollbar"
              static
            >
              {options.map((option) => (
                <Listbox.Option
                  key={option.value}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-slate-100'
                    }`
                  }
                  value={option.value}
                >
                  {({ selected }) => (
                    <>
                      <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                        {option.label}
                      </span>
                      {selected && (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600 dark:text-blue-400">
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      )}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      )}
    </Listbox>
  );
};

export default CustomSelect;
