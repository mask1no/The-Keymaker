'use client'
import MemecoinCreator from '@/components/MemecoinCreator/MemecoinCreator'
import { StatusCluster } from '@/components/UI/StatusCluster'

export default function Page() {
	return (
		<div className="container mx-auto p-6 space-y-6">
			<MemecoinCreator />
			<StatusCluster />
		</div>
	)
}


