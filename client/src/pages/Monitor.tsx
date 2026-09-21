import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity } from 'lucide-react'
import { PageContainer } from '../components/layout/PageContainer'
import { EmptyState } from '../components/feedback/EmptyState'

export const Monitor: React.FC = () => {
  const navigate = useNavigate()

  return (
    <PageContainer
      title="Monitor"
      description="Track endpoint health and response time over time."
      icon={<Activity className="w-4.5 h-4.5" />}
    >
      <EmptyState
        icon={<Activity className="w-8 h-8" />}
        title="No monitoring targets"
        description="Add an endpoint to monitor its uptime and response time on a recurring schedule."
        action={{
          label: 'Go to Dashboard',
          onClick: () => navigate('/'),
        }}
        className="mt-8"
      />
    </PageContainer>
  )
}
