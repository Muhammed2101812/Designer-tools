/**
 * Example usage of the UsageIndicator component
 * This file demonstrates different ways to use the component
 */

import { UsageIndicator } from './UsageIndicator'

// Example 1: Basic usage with provided data
export function BasicUsageExample() {
  return (
    <UsageIndicator
      currentUsage={5}
      dailyLimit={10}
      planName="free"
    />
  )
}

// Example 2: Compact version for inline display
export function CompactUsageExample() {
  return (
    <div className="flex items-center gap-4">
      <span>API Usage:</span>
      <UsageIndicator
        currentUsage={8}
        dailyLimit={10}
        planName="free"
        compact
      />
    </div>
  )
}

// Example 3: Auto-fetching with real-time updates
export function AutoFetchingExample() {
  return (
    <UsageIndicator
      refreshInterval={30000} // Refresh every 30 seconds
      onUsageUpdate={(data) => {
        console.log('Usage updated:', data)
      }}
    />
  )
}

// Example 4: Custom upgrade handler
export function CustomUpgradeExample() {
  const handleUpgrade = () => {
    // Custom upgrade logic
    console.log('Custom upgrade clicked')
    // Could open a modal, redirect to custom page, etc.
  }

  return (
    <UsageIndicator
      currentUsage={9}
      dailyLimit={10}
      planName="premium"
      onUpgradeClick={handleUpgrade}
    />
  )
}

// Example 5: Different plan levels
export function PlanLevelsExample() {
  return (
    <div className="space-y-4">
      <div>
        <h3>Free Plan</h3>
        <UsageIndicator
          currentUsage={8}
          dailyLimit={10}
          planName="free"
        />
      </div>
      
      <div>
        <h3>Premium Plan</h3>
        <UsageIndicator
          currentUsage={400}
          dailyLimit={500}
          planName="premium"
        />
      </div>
      
      <div>
        <h3>Pro Plan</h3>
        <UsageIndicator
          currentUsage={1500}
          dailyLimit={2000}
          planName="pro"
        />
      </div>
    </div>
  )
}