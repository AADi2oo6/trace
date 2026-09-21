import React from 'react'
import { Settings as SettingsIcon } from 'lucide-react'
import { PageContainer } from '../components/layout/PageContainer'
import { Panel } from '../components/ui/Panel'
import { Divider } from '../components/ui/Divider'

const settingsGroups = [
  {
    heading: 'Request Defaults',
    items: [
      { label: 'Default timeout', value: '10s', description: 'Maximum wait for server response' },
      { label: 'Max redirects', value: '5', description: 'Redirect chain limit' },
      { label: 'Max response size', value: '2 MB', description: 'Payload cap for response body' },
    ],
  },
  {
    heading: 'Interface',
    items: [
      { label: 'Theme', value: 'Dark', description: 'Application color theme' },
      { label: 'Font', value: 'System', description: 'UI typography preference' },
    ],
  },
  {
    heading: 'Backend',
    items: [
      { label: 'API base URL', value: 'http://localhost:8000', description: 'TRACE backend endpoint' },
    ],
  },
]

export const Settings: React.FC = () => {
  return (
    <PageContainer
      title="Settings"
      description="Preferences and configuration for TRACE."
      icon={<SettingsIcon className="w-4.5 h-4.5" />}
    >
      <div className="p-6 space-y-6 max-w-2xl animate-fade-in">
        {settingsGroups.map((group) => (
          <div key={group.heading}>
            <p className="text-[10px] font-mono tracking-widest text-[#3A3A3A] uppercase mb-3">
              {group.heading}
            </p>
            <Panel padding="none" className="overflow-hidden">
              {group.items.map((item, i) => (
                <React.Fragment key={item.label}>
                  {i > 0 && <Divider />}
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-xs font-mono text-[#B0B0B0]">{item.label}</p>
                      <p className="text-[11px] text-[#3A3A3A] mt-0.5">{item.description}</p>
                    </div>
                    <span className="text-xs font-mono text-[#555555] ml-4 shrink-0">
                      {item.value}
                    </span>
                  </div>
                </React.Fragment>
              ))}
            </Panel>
          </div>
        ))}

        <p className="text-[10px] font-mono text-[#2A2A2A] pt-2">
          Settings persistence will be implemented in a future step.
        </p>
      </div>
    </PageContainer>
  )
}
