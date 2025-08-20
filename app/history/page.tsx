'use client'
import { LogsPanel } from '@/components/ExecutionLog/LogsPanel'
import { StatusCluster } from '@/components/UI/StatusCluster'

export default function Page() {
	return (
		<div className="container mx-auto p-6 space-y-6">
			<LogsPanel />
			<StatusCluster />
		</div>
	)
}


