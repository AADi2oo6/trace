import React, { useState } from 'react'
import { KeyValueEditor } from './KeyValueEditor'
import { BodyEditor } from './BodyEditor'
import { useRequestStore } from '../../store/requestStore'

type Tab = 'params' | 'headers' | 'body'

interface RequestTabsProps {
  bodyValidationError?: string | null
  disabled?: boolean
}

export const RequestTabs: React.FC<RequestTabsProps> = ({
  bodyValidationError,
  disabled = false,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('params')

  const {
    params, addParam, updateParam, toggleParam, removeParam,
    requestHeaders, addHeader, updateHeader, toggleHeader, removeHeader,
    bodyContentType, bodyText, setBodyContentType, setBodyText,
  } = useRequestStore()

  const tabs: { id: Tab; label: string; count?: number }[] = [
    {
      id: 'params',
      label: 'Params',
      count: params.filter((r) => r.enabled && r.key.trim()).length || undefined,
    },
    {
      id: 'headers',
      label: 'Headers',
      count: requestHeaders.filter((r) => r.enabled && r.key.trim()).length || undefined,
    },
    {
      id: 'body',
      label: 'Body',
      count: bodyContentType !== 'none' && bodyText.trim() ? 1 : undefined,
    },
  ]

  return (
    <div className="flex flex-col">
      {/* Tab bar */}
      <div
        className="flex items-end border-b border-[#1E1E1E]"
        role="tablist"
        aria-label="Request configuration"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`req-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`req-panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'flex items-center gap-1.5 px-4 py-2.5 text-xs font-mono tracking-wider',
                'transition-colors duration-100 border-b-2 -mb-px',
                'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF6A00] focus-visible:ring-inset',
                isActive
                  ? 'text-[#E8E8E8] border-[#FF6A00]'
                  : 'text-[#3A3A3A] border-transparent hover:text-[#6B6B6B]',
              ].join(' ')}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={[
                    'inline-flex items-center justify-center w-4 h-4 text-[9px] rounded-none',
                    isActive
                      ? 'bg-[#FF6A0020] text-[#FF6A00]'
                      : 'bg-[#1A1A1A] text-[#3A3A3A]',
                  ].join(' ')}
                  aria-label={`${tab.count} active`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab panels */}
      <div className="pt-4">
        <div
          id="req-panel-params"
          role="tabpanel"
          aria-labelledby="req-tab-params"
          hidden={activeTab !== 'params'}
        >
          {activeTab === 'params' && (
            <KeyValueEditor
              rows={params}
              onAdd={addParam}
              onUpdate={updateParam}
              onToggle={toggleParam}
              onRemove={removeParam}
              keyPlaceholder="parameter name"
              valuePlaceholder="value"
              disabled={disabled}
            />
          )}
        </div>

        <div
          id="req-panel-headers"
          role="tabpanel"
          aria-labelledby="req-tab-headers"
          hidden={activeTab !== 'headers'}
        >
          {activeTab === 'headers' && (
            <KeyValueEditor
              rows={requestHeaders}
              onAdd={addHeader}
              onUpdate={updateHeader}
              onToggle={toggleHeader}
              onRemove={removeHeader}
              keyPlaceholder="header name"
              valuePlaceholder="value"
              sensitiveKeys={['authorization', 'cookie', 'proxy-authorization']}
              disabled={disabled}
            />
          )}
        </div>

        <div
          id="req-panel-body"
          role="tabpanel"
          aria-labelledby="req-tab-body"
          hidden={activeTab !== 'body'}
        >
          {activeTab === 'body' && (
            <BodyEditor
              bodyContentType={bodyContentType}
              bodyText={bodyText}
              onTypeChange={setBodyContentType}
              onTextChange={setBodyText}
              validationError={bodyValidationError}
              disabled={disabled}
            />
          )}
        </div>
      </div>
    </div>
  )
}
