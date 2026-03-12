import React, { Fragment } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { cn } from '@/utils';
import { useLanguageStore } from '@/stores/languageStore';

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
];

export const LanguageSelector: React.FC = () => {
  const { currentLanguage, setLanguage } = useLanguageStore();

  const currentLang =
    languages.find(lang => lang.code === currentLanguage) || languages[0];

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="inline-flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
        <Globe className="h-4 w-4" />
        <span>{currentLang.nativeName}</span>
        <span>({currentLang.code})</span>
        <ChevronDown className="h-3 w-3" />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute bottom-full right-0 z-50 mb-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800">
          <div className="py-1">
            {languages.map(language => (
              <Menu.Item key={language.code}>
                {({ active }) => (
                  <button
                    onClick={() => setLanguage(language.code)}
                    className={cn(
                      'flex w-full items-center px-4 py-2 text-left text-sm',
                      active
                        ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                        : 'text-gray-700 dark:text-gray-300',
                      currentLanguage === language.code && 'font-medium'
                    )}
                  >
                    <span className="flex-1">{language.nativeName}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({language.code})
                    </span>
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};
