import { PrismaClient, Worker } from "@prisma/client";

const prisma = new PrismaClient();

// In-memory fallback storage for when database is unavailable
const fallbackWorkerStore: Record<string, any> = {};

export type WorkerProfileUpdate = {
	name?: string;
	city?: string;
	zoneId?: string;
	platformId?: string;
	upiId?: string;
};

export async function updateWorkerProfile(workerId: string, updates: WorkerProfileUpdate): Promise<Worker | null> {
	try {
		const updated = await prisma.worker.update({
			where: { id: workerId },
			data: updates,
		});
		return updated;
	} catch (dbErr) {
		// Database error - use in-memory fallback
		console.warn("[updateWorkerProfile] Database error, using in-memory fallback:", dbErr);
		
		// Get or create in-memory worker
		if (!fallbackWorkerStore[workerId]) {
			fallbackWorkerStore[workerId] = {
				id: workerId,
				phone: "0000000000",
				name: `Worker-${workerId.slice(-4)}`,
				city: null,
				zoneId: null,
				platformId: null,
				upiId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
		}
		
		// Apply updates
		const worker = fallbackWorkerStore[workerId];
		Object.assign(worker, updates, { updatedAt: new Date() });
		
		console.log(`[updateWorkerProfile] Fallback: Updated worker ${workerId}`, worker);
		return worker as Worker;
	}
}
