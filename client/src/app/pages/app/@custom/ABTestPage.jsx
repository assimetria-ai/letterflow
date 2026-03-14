// @custom — A/B Testing page for email campaigns
import { DashboardLayout } from '../../../components/@system/Dashboard'
import { LETTERFLOW_NAV_ITEMS } from '../../../config/@custom/navigation'
import ABTestManager from '../../../../../../src/components/ABTestManager'

export function ABTestPage() {
  return (
    <DashboardLayout navItems={LETTERFLOW_NAV_ITEMS}>
      <DashboardLayout.Header
        title="A/B Testing"
        description="Test subject lines, content, and send times to optimize your campaigns"
      />
      <DashboardLayout.Content>
        <ABTestManager />
      </DashboardLayout.Content>
    </DashboardLayout>
  )
}
