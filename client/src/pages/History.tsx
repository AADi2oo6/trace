import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { PageContainer } from '../components/layout/PageContainer'
import { EmptyState } from '../components/feedback/EmptyState'

export const History: React.FC = () => {
  const navigate = useNavigate()

  return (
    <PageContainer
      title="History"
      description="Replay and inspect past HTTP requests."
      icon={<Clock className="w-4.5 h-4.5" />}
    >
      <EmptyState
        icon={<Clock className="w-8 h-8" />}
        title="No requests yet"
        description="Run your first API request to start building a history you can replay and compare."
        action={{
          label: 'Open API Tester',
          onClick: () => navigate('/tester'),
        }}
        className="mt-8"
      />
    </PageContainer>
  )
}
