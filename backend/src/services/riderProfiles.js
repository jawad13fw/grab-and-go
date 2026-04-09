import { nanoid } from 'nanoid';
import { Rider } from '../models/index.js';

function scoreRiderProfile(rider) {
  let score = 0;

  if (rider.currentOrderId) score += 100;
  if (rider.status === 'busy') score += 50;
  if (rider.status === 'available') score += 25;
  if (rider.email) score += 5;

  return score;
}

export async function findPrimaryRiderProfile(userId) {
  const riders = await Rider.find({ userId });
  if (!riders.length) return null;

  riders.sort((left, right) => {
    const scoreDelta = scoreRiderProfile(right) - scoreRiderProfile(left);
    if (scoreDelta !== 0) return scoreDelta;

    return new Date(left.createdAt || 0).getTime() - new Date(right.createdAt || 0).getTime();
  });

  return riders[0];
}

export async function ensureRiderProfileForUser(user) {
  const existing = await findPrimaryRiderProfile(user.id);
  if (existing) return existing;

  const rider = new Rider({
    id: `rider-${nanoid(10)}`,
    userId: user.id,
    name: user.name || 'Rider',
    email: user.email,
    phone: user.phone || 'No phone provided',
    status: 'offline'
  });

  await rider.save();
  return rider;
}